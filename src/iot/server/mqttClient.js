const mqtt = require("mqtt");

const mqttClient = mqtt.connect("mqtt://10.103.72.177");

mqttClient.on("connect", () => {
  console.log("Connected to MQTT broker");
});

mqttClient.on("error", (err) => {
  console.error("MQTT error:", err);
});

module.exports = mqttClient;
