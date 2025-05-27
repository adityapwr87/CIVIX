const Issue = require("../models/Issue");
const User = require("../models/User");

const createIssue = async (req, res) => {
  try {
    const { title, description, images, coordinates, address, districtCode } =
      req.body;

    if (!title || !description || !images || !coordinates || !districtCode) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Validate district code format
    const validDistrict = /^[A-Z]{2}\s?\d{2}$/;
    if (!validDistrict.test(districtCode)) {
      return res
        .status(400)
        .json({ message: "Invalid district code format (e.g., 'MH 24')." });
    }
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

// Get issues based on role and district
const getIssues = async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user._id;
    const userDistrict = req.user.districtCode;

    let filter = {};

    if (role === "user") {
      filter.createdBy = userId;
    } else if (role === "admin") {
      filter.districtCode = userDistrict;
    }

    const issues = await Issue.find(filter)
      .populate("createdBy", "username email")
      .sort({ createdAt: -1 });

    res.status(200).json(issues);
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
  getIssues,
  updateIssueStatus,
};
