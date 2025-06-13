const express = require("express");
const router = express.Router();
const multer = require("multer");
const { protect } = require("../middleware/authMiddleware");
const Issue = require("../models/Issue");

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Public routes
router.get("/all", async (req, res) => {
  try {
    const issues = await Issue.find()
      .populate("createdBy", "username")
      .sort({ createdAt: -1 });
    res.json(issues);
  } catch (error) {
    console.error("Error fetching all issues:", error);
    res.status(500).json({ message: "Error fetching all issues" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id).populate(
      "createdBy",
      "username"
    );
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }
    res.json(issue);
  } catch (error) {
    console.error("Error fetching issue by ID:", error);
    res.status(500).json({ message: "Error fetching issue by ID" });
  }
});

// Protected routes
router.use(protect);

router.post("/", upload.array("images", 5), async (req, res) => {
  try {
    const { title, description, districtCode } = req.body;
    const location = JSON.parse(req.body.location);

    // Create issue object
    const issueData = {
      title,
      description,
      districtCode,
      location,
      createdBy: req.user._id,
      status: "pending",
    };

    // Add image paths if files were uploaded
    if (req.files && req.files.length > 0) {
      issueData.images = req.files.map((file) => file.path);
    }

    const issue = await Issue.create(issueData);

    // Populate creator details
    await issue.populate("createdBy", "username");

    res.status(201).json(issue);
  } catch (error) {
    console.error("Error creating issue:", error);
    res.status(500).json({
      message: "Failed to create issue",
      error: error.message,
    });
  }
});

router.get("/my-issues", async (req, res) => {
  try {
    const issues = await Issue.find({ createdBy: req.user._id })
      .populate("createdBy", "username")
      .sort({ createdAt: -1 });
    res.json(issues);
  } catch (error) {
    console.error("Error fetching user issues:", error);
    res.status(500).json({ message: "Error fetching user issues" });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const stats = await Issue.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    res.json(stats);
  } catch (error) {
    console.error("Error fetching issue stats:", error);
    res.status(500).json({ message: "Error fetching issue stats" });
  }
});

router.patch("/:issueId/status", async (req, res) => {
  try {
    const { status } = req.body;
    const issue = await Issue.findByIdAndUpdate(
      req.params.issueId,
      { status },
      { new: true }
    );
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }
    res.json(issue);
  } catch (error) {
    console.error("Error updating issue status:", error);
    res.status(500).json({ message: "Error updating issue status" });
  }
});

router.post("/:id/comments", async (req, res) => {
  try {
    const { comment } = req.body;
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }
    issue.comments.push({ text: comment, createdBy: req.user._id });
    await issue.save();
    res.json(issue);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Error adding comment" });
  }
});

router.post("/:id/upvote", async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }
    const userId = req.user._id.toString();
    const upvoteIndex = issue.upvotes.indexOf(userId);
    if (upvoteIndex === -1) {
      issue.upvotes.push(userId);
    } else {
      issue.upvotes.splice(upvoteIndex, 1);
    }
    await issue.save();
    res.json(issue);
  } catch (error) {
    console.error("Error toggling upvote:", error);
    res.status(500).json({ message: "Error toggling upvote" });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const issues = await Issue.find({ createdBy: req.params.userId })
      .populate("createdBy", "username")
      .sort({ createdAt: -1 });
    res.json(issues);
  } catch (error) {
    console.error("Error fetching user issues:", error);
    res.status(500).json({ message: "Error fetching user issues" });
  }
});

module.exports = router;
