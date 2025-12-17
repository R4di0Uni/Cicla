const express = require("express");
const Reservation = require("../models/Reservation");
const Cubicle = require("../models/Cubicle");
const mqttClient = require("../mqttClient"); // ✅ cliente MQTT central

const router = express.Router();

// --------------------
// CREATE reservation
// --------------------
router.post("/", async (req, res) => {
  try {
    const { cubicleId, slot, startDateTime, endDateTime } = req.body;

    const conflict = await Reservation.findOne({
      cubicleId,
      slot,
      status: "active",
      startDateTime: { $lt: endDateTime },
      endDateTime: { $gt: startDateTime }
    });

    if (conflict) {
      return res.status(400).json({ error: "Slot not available for this time" });
    }

    const reservation = await Reservation.create(req.body);
    res.json(reservation);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------
// GET reservations of user
// --------------------
router.get("/user/:id", async (req, res) => {
  try {
    const reservations = await Reservation.find({ userId: req.params.id })
      .populate("cubicleId", "name");
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------
// UNLOCK
// --------------------
router.post("/:id/unlock", async (req, res) => {
  try {
    const booking = await Reservation.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: "Reservation not found" });
    }

    booking.isUnlocked = true;
    await booking.save();

    // 🔓 envia comando para o ESP32
    if (Number(booking.slot) === 1) {
  mqttClient.publish("esp32/cmd", "slot1_unlock");
}


    res.json({ success: true, isUnlocked: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------
// LOCK
// --------------------
router.post("/:id/lock", async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ error: "Reservation not found" });
    }

    reservation.isUnlocked = false;
    await reservation.save();

    // 🔒 envia comando para o ESP32
    if (Number(reservation.slot) === 1) {
  mqttClient.publish("esp32/cmd", "slot1_lock");
}


    res.json({
      success: true,
      isUnlocked: false
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------
// GET reservations of cubicle (day)
// --------------------
router.get("/cubicle/:cubicleId", async (req, res) => {
  const { cubicleId } = req.params;
  const { day } = req.query;

  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const dayIndex = days.indexOf(day);
  if (dayIndex === -1) {
    return res.status(400).json({ error: "Invalid day" });
  }

  const now = new Date();
  const monday = new Date(now.setDate(now.getDate() - now.getDay() + 1));

  const startOfDay = new Date(monday);
  startOfDay.setDate(startOfDay.getDate() + dayIndex);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(startOfDay);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    const reservations = await Reservation.find({
      cubicleId,
      status: "active",
      startDateTime: { $lt: endOfDay },
      endDateTime: { $gt: startOfDay }
    });

    res.json(reservations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/cubicle/:cubicleId/availability", async (req, res) => {
  const { cubicleId } = req.params;
  const { datetime } = req.query;

  if (!datetime) {
    return res.status(400).json({ error: "datetime required" });
  }

  const targetTime = new Date(datetime);

  try {
    const reservations = await Reservation.find({
      cubicleId,
      status: "active",
      startDateTime: { $lte: targetTime },
      endDateTime: { $gte: targetTime }
    });

    res.json(reservations); // only the slots that are OCCUPIED
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
