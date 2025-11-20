const express = require("express");
const cors = require("cors");
const mqtt = require("mqtt");

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MQTT broker
const mqttClient = mqtt.connect("mqtt://BROKER_IP");

// Store latest sensor packet from ESP32
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

// When connected to MQTT
mqttClient.on("connect", () => {
  console.log("Connected to MQTT");
  mqttClient.subscribe("esp32/sensors");
});

// Handle incoming MQTT messages
mqttClient.on("message", (topic, message) => {
  if (topic === "esp32/sensors") {
    try {
      // Parse JSON from ESP32
      const data = JSON.parse(message.toString());
      latestSensors = data;
    } catch (e) {
      console.log("Invalid JSON from ESP32:", message.toString());
    }
  }
});

// REST endpoint for frontend
app.get("/sensors", (req, res) => {
  res.json(latestSensors);
});

// Send command to ESP32 via MQTT
app.post("/command", (req, res) => {
  const cmd = req.body.cmd;
  mqttClient.publish("esp32/cmd", cmd);
  res.json({ status: "Command sent!" });
});

app.listen(3000, () => console.log("Server running on port 3000"));
