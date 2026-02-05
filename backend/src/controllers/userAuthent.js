const redisClient = require("../config/redis");
const User = require("../models/user");
const validate = require("../utils/validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  maxAge: 60 * 60 * 1000
};

/* ================= REGISTER ================= */
const register = async (req, res) => {
  try {
    validate(req.body);

    const { password, emailId } = req.body;
    req.body.password = await bcrypt.hash(password, 10);
    req.body.role = "user";

    const user = await User.create(req.body);

    const token = jwt.sign(
      { _id: user._id, emailId, role: "user" },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, COOKIE_OPTIONS);

    res.status(201).json({
      user: {
        firstName: user.firstName,
        emailId: user.emailId,
        _id: user._id,
        role: user.role
      },
      message: "Login Successfully"
    });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/* ================= LOGIN ================= */
const login = async (req, res) => {
  try {
    const { emailId, password } = req.body;
    if (!emailId || !password) throw new Error("Invalid Credentials");

    const user = await User.findOne({ emailId });
    if (!user) throw new Error("Invalid Credentials");

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new Error("Invalid Credentials");

    const token = jwt.sign(
      { _id: user._id, emailId, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, COOKIE_OPTIONS);

    res.status(201).json({
      user: {
        firstName: user.firstName,
        emailId: user.emailId,
        _id: user._id,
        role: user.role
      },
      message: "Login Successfully"
    });

  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

/* ================= LOGOUT ================= */
const logout = async (req, res) => {
  try {
    const { token } = req.cookies;
    if (!token) return res.send("Already logged out");

    const payload = jwt.verify(token, process.env.JWT_KEY);

    if (redisClient?.isOpen) {
      await redisClient.set(`token:${token}`, "Blocked");
      await redisClient.expireAt(`token:${token}`, payload.exp);
    }

    res.cookie("token", "", { ...COOKIE_OPTIONS, maxAge: 0 });
    res.send("Logged out successfully");

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { register, login, logout };
