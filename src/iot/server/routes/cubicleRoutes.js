const express = require("express");
const router = express.Router();
const Cubicle = require("../models/Cubicle");

// GET ALL
router.get("/", async (req, res) => {
  const cubicles = await Cubicle.find();
  res.json(cubicles);
});



// GET ONE (with user)
// GET ONE (with user)
router.get("/:id", async (req, res) => {
  try {
    let cubicle = await Cubicle.findById(req.params.id).populate("user");

    if (!cubicle) {
      return res.status(404).json({ error: "Cubicle not found" });
    }

    // -------------------------
    // AUTO INITIALIZE SLOTS
    // -------------------------
    if (!cubicle.slots || cubicle.slots.length === 0) {
      cubicle.slots = Array.from(
        { length: cubicle.totalSlots },
        (_, i) => ({ id: i + 1, occupied: false })
      );

      cubicle.freeSlots = cubicle.totalSlots;

      await cubicle.save();
    }

    res.json(cubicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
