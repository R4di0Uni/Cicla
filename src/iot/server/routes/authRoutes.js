const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

// SIGN UP
router.post("/signup", async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Email already exists" });
  }
});

// LOGIN
// LOGIN
router.post("/login", async (req, res) => {
  const { email, username, password } = req.body;

  // Allow login via email OR username
  const user = await User.findOne(
    email ? { email } : { username }
  );

  if (!user) return res.status(400).json({ error: "User not found" });

  const valid = await user.comparePassword(password);
  if (!valid) return res.status(400).json({ error: "Wrong password" });

  const token = jwt.sign({ id: user._id }, "SECRET_KEY");

  // Send token + user data
  res.json({
    token,
    user: {
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email
    }
  });
});


module.exports = router;
