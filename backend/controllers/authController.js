const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const JWT_SECRET = process.env.JWT_SECRET;

const validDistricts = ["MH24", "2", "3"];
const register = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      role = "user",
      employeeId,
      districtCode,
    } = req.body;

    // Basic validation
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Username, email and password are required" });
    }

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Validate admin registration
    if (role === "admin") {
      if (!employeeId || !districtCode) {
        return res.status(400).json({
          message: "Employee ID and district code are required for admins",
        });
      }

      // Validate government email
      if (!email.endsWith("@gov.in") && !email.endsWith("@nic.in")) {
        return res.status(403).json({
          message: "Only official government emails allowed for admins",
        });
      }

      // Check if admin already exists for this district
      const existingAdmin = await User.findOne({ role: "admin", districtCode });
      if (existingAdmin) {
        return res.status(400).json({
          message: `Admin already exists for district ${districtCode}`,
        });
      }
    }

    // Create new user
    const newUser = new User({
      username,
      email,
      password,
      role,
      ...(role === "admin" && { employeeId, districtCode }),
    });

    await newUser.save();

    // Generate token using id (not userId)
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        districtCode: newUser.districtCode || null,
      },
      details:newUser,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      message: "Registration failed",
      error: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });

      res.status(200).json({
        message: "User logged in successfully",
        token,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          districtCode: user.districtCode || null,
        },
        details: user,
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
};
