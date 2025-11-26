const express = require("express");
const cors = require("cors");
const mqtt = require("mqtt");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

// ----------------------
// MongoDB Connection
// ----------------------
mongoose.connect("mongodb://localhost:27017/esp32")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err));


const sensorSchema = new mongoose.Schema({
  reed: String,
  weight: Number,
  ax: Number,
  ay: Number,
  az: Number,
  gx: Number,
  gy: Number,
  gz: Number,
  timestamp: { type: Date, default: Date.now }
});

const Sensor = mongoose.model("Sensor", sensorSchema);

// ----------------------
// MQTT
// ----------------------
const mqttClient = mqtt.connect("mqtt://10.106.114.177");

let latestSensors = {
  reed: "--",
  weight: "--",
  ax: "--",
  ay: "--",
  az: "--",
  gx: "--",
  gy: "--",
  gz: "--"
};

mqttClient.on("connect", () => {
  console.log("Connected to MQTT");
  mqttClient.subscribe("esp32/sensors");
});

mqttClient.on("message", async (topic, message) => {
  if (topic === "esp32/sensors") {
    try {
      const data = JSON.parse(message.toString());
      latestSensors = data;

      // Save the packet in MongoDB
      await Sensor.create(data);

      console.log("Saved to MongoDB:", data);
    } catch (e) {
      console.log("Invalid JSON:", message.toString());
    }
  }
});

// ----------------------
// REST API
// ----------------------
app.get("/sensors", (req, res) => {
  res.json(latestSensors);
});

app.post("/command", (req, res) => {
  const cmd = req.body.cmd;
  mqttClient.publish("esp32/cmd", cmd);
  res.json({ status: "Command sent!" });
});

app.listen(3000, () => console.log("Server running on port 3000"));
