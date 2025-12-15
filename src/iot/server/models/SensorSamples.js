const mongoose = require("mongoose");

const SampleSchema = new mongoose.Schema({
  ax: Number,
  ay: Number,
  az: Number,
  gx: Number,
  gy: Number,
  gz: Number,
  reed: Number,
  weight: Number,
  lock: Number,
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const ImuSampleSchema = new mongoose.Schema({
  ax: Number,
  ay: Number,
  az: Number,
  gx: Number,
  gy: Number,
  gz: Number,
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const ImuWindowSchema = new mongoose.Schema({
  samples: {
    type: [ImuSampleSchema],
    required: true,
    validate: v => v.length === 10
  },
  label: {
    type: String,
    enum: ["normal", "intrusion", null],
    default: "intrusion"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("ImuWindow", ImuWindowSchema);