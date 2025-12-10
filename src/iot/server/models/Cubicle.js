const mongoose = require("mongoose");

const cubicleSchema = new mongoose.Schema({
  name: String,
  address: String,
  lat: Number,
  lng: Number,
  totalSlots: Number,
  freeSlots: Number,
  pricePerHour: Number,
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  // NEW FIELD
  slots: [
    {
      id: Number,
      occupied: { type: Boolean, default: false }
    }
  ]
});

module.exports = mongoose.model("Cubicle", cubicleSchema);
