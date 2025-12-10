const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  cubicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Cubicle", required: true },
  slot: Number,
  day: String,
  startTime: String,
  duration: Number,
  price: Number,
  status: { type: String, default: "active" }
});

module.exports = mongoose.model("Reservation", reservationSchema);
