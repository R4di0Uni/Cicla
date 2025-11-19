const express = require("express");
const cors = require("cors");
const mqtt = require("mqtt");

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MQTT
const mqttClient = mqtt.connect("mqtt://BROKER_IP");

mqttClient.on("connect", () => {
  console.log("Connected to MQTT");
  mqttClient.subscribe("esp32/temp");
});

// Store latest sensor data
let latestTemp = "--";

mqttClient.on("message", (topic, message) => {
  if (topic === "esp32/temp") {
    latestTemp = message.toString();
  }
});

// REST endpoint for frontend
app.get("/temperature", (req, res) => {
  res.json({ temp: latestTemp });
});

// Send command to ESP32
app.post("/command", (req, res) => {
  const cmd = req.body.cmd;
  mqttClient.publish("esp32/cmd", cmd);
  res.json({ status: "Command sent!" });
});

app.listen(3000, () => console.log("Server running on port 3000"));
