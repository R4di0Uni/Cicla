const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  cubicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Cubicle", required: true },
  slot: Number,

  startDateTime: { type: Date, required: true },
  endDateTime: { type: Date, required: true },

  price: Number,
  status: { type: String, default: "active" },
  isUnlocked: { type: Boolean, default: false }
});


module.exports = mongoose.model("Reservation", reservationSchema);
