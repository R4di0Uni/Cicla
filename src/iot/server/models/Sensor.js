const mongoose = require("mongoose");

const SensorSchema = new mongoose.Schema(
  {
    reed: Number,
    weight: Number,
    lock: Number,

    ax: Number,
    ay: Number,
    az: Number,

    gx: Number,
    gy: Number,
    gz: Number,
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Sensor", SensorSchema);
