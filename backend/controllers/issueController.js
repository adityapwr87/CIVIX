const Issue = require("../models/Issue");
const User = require("../models/User");

const createIssue = async (req, res) => {
  try {
    const { title, description, images, coordinates, address, districtCode } =
      req.body;

    if (!title || !description  || !coordinates || !districtCode) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Validate district code format
    const newIssue = new Issue({
      title,
      description,
      images,
      location: {
        type: "Point",
        coordinates,
        address: address || "",
      },
      districtCode,
      createdBy: req.user._id,
    });

    await newIssue.save();

    // Add issue to user reports array
    await User.findByIdAndUpdate(req.user._id, {
      $push: { reports: newIssue._id },
    });

    // Add issue to admin's unsolvedIssues array of that district
    const admin = await User.findOneAndUpdate(
      { role: "admin", districtCode },
      { $push: { unsolvedIssues: newIssue._id } }
    );

    if (!admin) {
      return res
        .status(404)
        .json({ message: "Admin for this district not found." });
    }

    res
      .status(201)
      .json({ message: "Issue reported successfully", issue: newIssue });
  } catch (error) {
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
        inProgress: issues.filter(
          (issue) => issue.status === "in progress"
        ).length,
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

module.exports = {
  createIssue,
  getAllIssues, // Public issues
  getUserIssues, // User/Admin specific issues
  getIssueStats, // Admin dashboard stats
  updateIssueStatus,
};
