const Issue = require("../models/Issue");
const User = require("../models/User");
const uploadToS3 = require("../utils/s3Upload"); // <-- Add this

const createIssue = async (req, res) => {
  try {
    const { title, description, coordinates, address, districtCode } = req.body;

    if (!title || !description || !coordinates || !districtCode) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // First check if admin exists for the district
    const admin = await User.findOne({ role: "admin", districtCode });
    if (!admin) {
      return res.status(404).json({
        message: "No admin found for this district. Cannot create issue.",
      });
    }

    // Upload images to S3 and get URLs
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) => uploadToS3(file));
      imageUrls = await Promise.all(uploadPromises);
    }

    const newIssue = new Issue({
      title,
      description,
      images: imageUrls,
      location: {
        type: "Point",
        coordinates: JSON.parse(coordinates),
        address: address || "",
      },
      districtCode,
      createdBy: req.user._id,
    });

    await newIssue.save();

    // Update user and admin documents
    const [updatedUser, updatedAdmin] = await Promise.all([
      User.findByIdAndUpdate(
        req.user._id,
        { $push: { reports: newIssue._id } },
        { new: true }
      ),
      User.findByIdAndUpdate(
        admin._id,
        { $push: { unsolvedIssues: newIssue._id } },
        { new: true }
      ),
    ]);

    // Populate the createdBy field for the response
    await newIssue.populate("createdBy", "username email");

    res.status(201).json({
      message: "Issue reported successfully",
      issue: newIssue,
    });
  } catch (error) {
    console.error("Create issue error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all issues for public display
const getAllIssues = async (req, res) => {
  try {
    const issues = await Issue.find()
      .populate("createdBy", "username")
      .sort({ createdAt: -1 });

    res.status(200).json(issues);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get user-specific or admin-district issues
const getUserIssues = async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user._id;
    const userDistrict = req.user.districtCode;

    let filter = {};
    let issues = [];

    if (role === "user") {
      // Get issues created by the user
      issues = await Issue.find({ createdBy: userId })
        .populate("createdBy", "username")
        .sort({ createdAt: -1 });
    } else if (role === "admin") {
      // Get all issues from admin's district with stats
      issues = await Issue.find({ districtCode: userDistrict })
        .populate("createdBy", "username")
        .sort({ createdAt: -1 });

      // Get statistics for admin dashboard
      const stats = {
        total: issues.length,
        unsolved: issues.filter((issue) => issue.status === "unsolved").length,
        inProgress: issues.filter((issue) => issue.status === "in progress")
          .length,
        solved: issues.filter((issue) => issue.status === "solved").length,
      };

      return res.status(200).json({ issues, stats });
    }

    res.status(200).json(issues);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get issue statistics for admin dashboard
const getIssueStats = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const districtCode = req.user.districtCode;

    const stats = await Issue.aggregate([
      { $match: { districtCode } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const formattedStats = {
      unsolved: 0,
      inProgress: 0,
      solved: 0,
    };

    stats.forEach((stat) => {
      formattedStats[stat._id] = stat.count;
    });

    res.status(200).json(formattedStats);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update issue status (admin only)
const updateIssueStatus = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { status } = req.body;
    const validStatuses = ["unsolved", "in progress", "solved"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    // Only admins from the district can update
    if (
      req.user.role !== "admin" ||
      req.user.districtCode !== issue.districtCode
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Update status
    issue.status = status;
    if (status === "solved") {
      issue.solvedAt = new Date();
    } else {
      issue.solvedAt = undefined;
    }
    await issue.save();

    // Update admin's issue arrays accordingly
    const adminUpdate = {};

    // Remove from all arrays first
    adminUpdate.$pull = {
      unsolvedIssues: issue._id,
      inProgressIssues: issue._id,
      solvedIssues: issue._id,
    };

    await User.findByIdAndUpdate(req.user._id, adminUpdate);

    // Add to the correct array
    if (status === "unsolved") {
      await User.findByIdAndUpdate(req.user._id, {
        $push: { unsolvedIssues: issue._id },
      });
    } else if (status === "in progress") {
      await User.findByIdAndUpdate(req.user._id, {
        $push: { inProgressIssues: issue._id },
      });
    } else if (status === "solved") {
      await User.findByIdAndUpdate(req.user._id, {
        $push: { solvedIssues: issue._id },
      });
    }

    // Update status in user's reports array is automatic because reports are references

    res.status(200).json({ message: "Issue status updated", issue });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getIssueById = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate("createdBy", "username email _id")
      .populate({
        path: "comments.user",
        select: "username email _id",
      });
    if (!issue) return res.status(404).json({ message: "Issue not found" });
    res.json(issue);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text)
      return res.status(400).json({ message: "Comment text required" });

    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    const comment = {
      user: req.user._id,
      text,
      createdAt: new Date(),
    };

    // Add to issue
    issue.comments.push(comment);
    await issue.save();

    // Add to user
    await User.findByIdAndUpdate(req.user._id, {
      $push: {
        comments: { issue: issue._id, text, createdAt: comment.createdAt },
      },
    });

    // Populate the user field for the new comment
    await issue.populate({
      path: "comments.user",
      select: "username email _id",
    });

    res
      .status(201)
      .json({ comment: issue.comments[issue.comments.length - 1] });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const toggleUpvote = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    const upvoteIndex = issue.upvotes.indexOf(req.user._id);

    if (upvoteIndex === -1) {
      // Add upvote
      issue.upvotes.push(req.user._id);
    } else {
      // Remove upvote
      issue.upvotes.splice(upvoteIndex, 1);
    }

    await issue.save();
    res.json({ upvotes: issue.upvotes.length });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  createIssue,
  getAllIssues, // Public issues
  getUserIssues, // User/Admin specific issues
  getIssueStats, // Admin dashboard stats
  updateIssueStatus,
  getIssueById,
  addComment,
  toggleUpvote,
};
