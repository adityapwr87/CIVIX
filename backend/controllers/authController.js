const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const JWT_SECRET = process.env.JWT_SECRET;

const register = async (req, res) => {
  try {
    const { username, email, password, role = "user", employeeId, districtCode } = req.body;

    console.log('Registration request received:', req.body);

    // Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({ 
        message: "Username, email and password are required" 
      });
    }

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Validate admin registration
    if (role === "admin") {
      // Only check email domain for admin roles
      if (!email.endsWith("@gov.in") && !email.endsWith("@nic.in")) {
        return res.status(403).json({
          message: "Only official government emails allowed for admin registration"
        });
      }

      if (!employeeId || !districtCode) {
        return res.status(400).json({
          message: "Employee ID and district code are required for admins"
        });
      }

      // Check if admin already exists for this district
      const existingAdmin = await User.findOne({ role: "admin", districtCode });
      if (existingAdmin) {
        return res.status(400).json({
          message: `Admin already exists for district ${districtCode}`
        });
      }
    }

    // Create new user
    const newUser = new User({
      username,
      email,
      password,
      role,
      ...(role === "admin" && { employeeId, districtCode })
    });

    await newUser.save();

    console.log('User created successfully:', newUser);

    // Generate token
    const token = jwt.sign(
      { id: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        districtCode: newUser.districtCode || null
      }
    });

  } catch (error) {
    if (error.code === 11000) {
      // Handle duplicate key error
      const duplicateField = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        message: `Duplicate value for field: ${duplicateField}`,
        error: error.message
      });
    }

    console.error("Registration error:", error);
    res.status(500).json({ 
      message: "Registration failed", 
      error: error.message 
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user and explicitly select password field
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('No user found with email:', email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        districtCode: user.districtCode || null
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: "Login failed" });
  }
};

module.exports = {
  register,
  login,
};
