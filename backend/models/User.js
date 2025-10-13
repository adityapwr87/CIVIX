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
    districtCode: String,
    state: String,
    districtName: String,
    employeeId: String,

    profileImage: {
      type: String, // e.g., URL to S3 or server path
      default: "", // Optional: set a default avatar URL if needed
    },

    bio: {
      type: String,
      maxlength: 300, // Limit to 300 chars if desired
    },

    reports: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Issue",
      },
    ],

    unsolvedIssues: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Issue",
      },
    ],

    inProgressIssues: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Issue",
      },
    ],

    solvedIssues: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Issue",
      },
    ],

    comments: [
      {
        issue: { type: mongoose.Schema.Types.ObjectId, ref: "Issue" },
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],

    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Password hashing middleware
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("User", userSchema);
