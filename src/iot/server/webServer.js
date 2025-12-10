const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const mqtt = require("mqtt");

const Sensor = require("./models/Sensor");
const authRoutes = require("./routes/authRoutes");
const cubicleRoutes = require("./routes/cubicleRoutes");
const reservationRoutes = require("./routes/reservationRoutes");


const app = express();
app.use(cors());
app.use(express.json());

// MongoDB
mongoose.connect("mongodb://localhost:27017/esp32")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err));

// --------------------
// MQTT
// --------------------
let latestSensors = {};
const mqttClient = mqtt.connect("mqtt://172.25.1.177");

mqttClient.on("connect", () => {
  console.log("Connected to MQTT");
  mqttClient.subscribe("esp32/sensors");
});

mqttClient.on("message", async (topic, message) => {
  if (topic === "esp32/sensors") {
    try {
      const data = JSON.parse(message.toString());
      latestSensors = data;

      await Sensor.create(data);
    } catch (e) {
      console.log("Invalid JSON:", message.toString());
    }
  }
});

// --------------------
// API ROUTES
// --------------------
app.use("/auth", authRoutes);       // /auth/signup  /auth/login
app.use("/cubicles", cubicleRoutes);
app.use("/reservations", reservationRoutes);

// Sensors basic route
app.get("/sensors", (req, res) => {
  res.json(latestSensors);
});

app.listen(3000, () => console.log("Server running on port 3000"));
