  const express = require("express");
  const cors = require("cors");
  const mongoose = require("mongoose");

  const mqttClient = require("./mqttClient"); 

  const authRoutes = require("./routes/authRoutes");
  const cubicleRoutes = require("./routes/cubicleRoutes");
  const reservationRoutes = require("./routes/reservationRoutes");
  const ImuWindow = require("./models/SensorSamples.js");
  const Sensor = require("./models/RawSensor.js");

  const predict = require("../AI/model.js");

  let lastBeep = 0;
  const BEEP_COOLDOWN = 5000; // 5 seconds


  const app = express();
  app.use(cors());
  app.use(express.json());

  // --------------------
  // MongoDB
  // --------------------
  mongoose.connect("mongodb://localhost:27017/esp32")
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB error:", err));

  // --------------------
  // MQTT
  // --------------------
  let latestSensors = {};
let buffer = [];
let intrusionHits = 0;
let intrusionDetected = false;


mqttClient.subscribe("esp32/sensors");

mqttClient.on("message", async (topic, message) => {
  if (topic !== "esp32/sensors") return;

  let data;
  try {
    data = JSON.parse(message.toString());
  } catch (e) {
    console.log("Invalid JSON:", message.toString());
    return;
  }

  // --------------------
  // 1️⃣ Save latest + DB
  // --------------------
  latestSensors = data;

  try {
    await Sensor.create(data);
  } catch (err) {
    console.error("MongoDB insert error:", err.message);
  }

  // --------------------
  
  // 2️⃣ AI buffer
  // --------------------
  buffer.push({
    ax: data.ax,
    ay: data.ay,
    az: data.az,
    gx: data.gx,
    gy: data.gy,
    gz: data.gz
  });

  if (buffer.length < 10) return;

  const result = predict(buffer);
  console.log("Prediction:", result);

  // --------------------
  // 3️⃣ Intrusion logic
  // --------------------
  if (result === "intrusion") {
    intrusionHits++;
  } else {
    intrusionHits = 0;
  }

  if (intrusionHits >= 2) {
    const now = Date.now();

    if (now - lastBeep > BEEP_COOLDOWN) {
      console.log("🚨 INTRUSION DETECTED");
      mqttClient.publish("esp32/cmd", "beep");
      lastBeep = now;
       intrusionDetected = true;

    }

    intrusionHits = 0;
  }

  // reset window
  buffer = [];
});

app.get("/intrusion", (req, res) => {
  res.json({ intrusion: intrusionDetected });
  intrusionDetected = false; // reset after read
});




  // --------------------
  // API ROUTESm
  // --------------------
  app.use("/auth", authRoutes);
  app.use("/cubicles", cubicleRoutes);
  app.use("/reservations", reservationRoutes);

  // --------------------
  // Sensors route
  // --------------------
  app.get("/sensors", (req, res) => {
    res.json(latestSensors);
  });

  // --------------------
  app.listen(3000, () => {
    console.log("Server running on port 3000");
  });
