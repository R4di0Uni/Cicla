const express = require("express");
const router = express.Router();
const Cubicle = require("../models/Cubicle");

// GET ALL
router.get("/", async (req, res) => {
  const cubicles = await Cubicle.find();
  res.json(cubicles);
});

// GET ONE (with user)
router.get("/:id", async (req, res) => {
  const cubicle = await Cubicle.findById(req.params.id).populate("user");
  res.json(cubicle);
});

module.exports = router;
