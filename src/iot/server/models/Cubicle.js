const mongoose = require("mongoose");

const cubicleSchema = new mongoose.Schema({
  name: String,
  address: String,
  lat: Number,
  lng: Number,
  totalSlots: Number,
  freeSlots: Number,
  pricePerHour: Number,
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" } // who rented it
});

module.exports = mongoose.model("Cubicle", cubicleSchema);
