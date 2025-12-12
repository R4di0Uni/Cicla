const express = require("express");
const Reservation = require("../models/Reservation");
const Cubicle = require("../models/Cubicle");
const router = express.Router();

// CREATE reservation
router.post("/", async (req, res) => {
  try {
    const { cubicleId, slot } = req.body;

    // 1️⃣ Create reservation
    const saved = await Reservation.create(req.body);

    // 2️⃣ Update cubicle (mark slot occupied)
    const cubicle = await Cubicle.findById(cubicleId);
    if (!cubicle) return res.status(404).json({ error: "Cubicle not found" });

    // Initialize slot array if not present
    if (!cubicle.slots || cubicle.slots.length === 0) {
      cubicle.slots = Array.from({ length: cubicle.totalSlots }, (_, i) => ({
        id: i + 1,
        occupied: false
      }));
    }

    // Mark selected slot as occupied
    const idx = cubicle.slots.findIndex(s => s.id === slot);
    if (idx !== -1) {
      cubicle.slots[idx].occupied = true;
    } else {
      return res.status(400).json({ error: "Invalid slot number" });
    }

    // Recalculate free slots
    cubicle.freeSlots = cubicle.slots.filter(s => !s.occupied).length;

    await cubicle.save();

    res.json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET reservations of user
router.get("/user/:id", async (req, res) => {
  try {
    const reservations = await Reservation.find({ userId: req.params.id });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/slots", async (req, res) => {
  try {
    // Since you only have one cubicle, just get the first one
    const cubicle = await Cubicle.findOne();
    if (!cubicle) return res.status(404).json({ error: "Cubicle not found" });

    const reservations = await Reservation.find({ status: "active" })
      .populate("userId", "name");

    const slots = cubicle.slots.map(s => {
      const resv = reservations.find(r => r.slot === s.id);
      return {
        id: s.id,
        occupied: s.occupied,
        user: resv ? resv.userId.name : null
      };
    });

    res.json({
      totalSlots: cubicle.totalSlots,
      slots
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});



module.exports = router;
