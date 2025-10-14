const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    images: [String],
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: [Number],
      address: String,
    },
    districtCode: String,
    state: String,
    districtName: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, default: "unsolved" },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: String,
        createdAt: Date,
      },
    ],
    solvedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Issue", issueSchema);
