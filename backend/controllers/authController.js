const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const JWT_SECRET = process.env.JWT_SECRET;

const validDistricts = ["1", "2", "3"];
const register = async (req, res) => {
  try {
    const { username, email, password, role, employeeId, districtCode } =
      req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    if (!username || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (role === "admin" || role === "superadmin") {
      if (!employeeId || !districtCode) {
        return res
          .status(400)
          .json({
            message: "Employee ID and district code are required for admins",
          });
      }

      if (!email.endsWith("@gov.in") && !email.endsWith("@nic.in")) {
        return res
          .status(403)
          .json({
            message: "Only official government emails allowed for admins",
          });
      }

      if (!validDistricts.includes(districtCode)) {
        return res.status(403).json({ message: "Invalid district code" });
      }
    }

    const newUser = new User({
      username,
      email,
      password, // pass plain password, schema will hash it
      role,
      employeeId: role !== "user" ? employeeId : undefined,
      districtCode: role !== "user" ? districtCode : undefined,
    });

    await newUser.save();

    const token = generateToken({ id: newUser._id, role: newUser.role });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        districtCode: newUser.districtCode || null,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken({ id: user._id, role: user.role });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        districtCode: user.districtCode || null,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  register,
  login,
};
