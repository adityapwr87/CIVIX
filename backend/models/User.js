const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: {
      type: String,
      required: true,
      select: false, // This ensures password isn't returned in queries
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    districtCode: { type: String },
    reports: [{ type: mongoose.Schema.Types.ObjectId, ref: "Issue" }],
    comments: [
      {
        issue: { type: mongoose.Schema.Types.ObjectId, ref: "Issue" },
        text: String,
        createdAt: Date,
      },
    ],
  },
  { timestamps: true }
);

// Add password hashing middleware
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("User", userSchema);
