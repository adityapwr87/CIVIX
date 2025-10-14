const Issue = require("../models/Issue");
const User = require("../models/User");
const Notification = require("../models/Notification");
const getDistrictIssues = async (req, res) => {
  try {
    // The logged-in admin (set by protect middleware)
    const adminId = req.user._id;

    // Find admin by ID and populate issue arrays
    const admin = await User.findById(adminId)
      .populate({
        path: "unsolvedIssues",
        populate: {
          path: "createdBy",
          select: "username email",
        },
      })
      .populate({
        path: "inProgressIssues",
        populate: {
          path: "createdBy",
          select: "username email",
        },
      })
      .populate({
        path: "solvedIssues",
        populate: {
          path: "createdBy",
          select: "username email",
        },
      });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Ensure only admins can access this endpoint
    if (admin.role !== "admin" && admin.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    const groupedIssues = {
      unsolved: admin.unsolvedIssues || [],
      inProgress: admin.inProgressIssues || [],
      solved: admin.solvedIssues || [],
      total:
        (admin.unsolvedIssues?.length || 0) +
        (admin.inProgressIssues?.length || 0) +
        (admin.solvedIssues?.length || 0),
    };

    res.status(200).json({
      success: true,
      data: groupedIssues,
      message: "District issues retrieved successfully",
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching district issues",
      error: error.message,
    });
  }
};

const updateIssueStatus = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { status } = req.body;
    const validStatuses = ["unsolved", "in progress", "solved"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    // First find the admin and current location of issue
    const admin = await User.findOne({ _id: req.user._id, role: "admin" });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Determine which array currently contains the issue
    let currentArray = "unsolvedIssues";
    if (admin.inProgressIssues.includes(issueId)) {
      currentArray = "inProgressIssues";
    } else if (admin.solvedIssues.includes(issueId)) {
      currentArray = "solvedIssues";
    }

    // Move issue from current array to new array
    const targetArray =
      status === "in progress" ? "inProgressIssues" : `${status}Issues`;
    await User.findByIdAndUpdate(admin._id, {
      $pull: { [currentArray]: issueId },
      $push: { [targetArray]: issueId },
    });

    // Update issue status
    const updatedIssue = await Issue.findByIdAndUpdate(
      issueId,
      {
        status,
        updatedAt: new Date(),
        ...(status === "solved" && { solvedAt: new Date() }),
      },
      { new: true }
    );

    if (!updatedIssue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    const truncatedTitle =
      updatedIssue.title.length > 20
        ? updatedIssue.title.slice(0, 20) + "..."
        : updatedIssue.title;

    const notificationMessage = `Issue "${truncatedTitle}" status changed to "${status}"`;

    const notification = await Notification.create({
      user: updatedIssue.createdBy,
      type: "issue",
      referenceId: issueId,
      message: notificationMessage,
    });
   

    res.status(200).json({
      success: true,
      data: { issue: updatedIssue },
      message: "Issue status updated successfully",
    });
  } catch (error) {
    console.error("Update issue status error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating issue status",
    });
  }
};





module.exports = {
  getDistrictIssues,
  updateIssueStatus,
};
