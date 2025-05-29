const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
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

module.exports = mongoose.model("User", userSchema);
