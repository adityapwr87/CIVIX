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




<<<<<<< HEAD
    const stats = {
      total:
        (admin.unsolvedIssues?.length || 0) +
        (admin.inProgressIssues?.length || 0) +
        (admin.solvedIssues?.length || 0),
      unsolved: admin.unsolvedIssues?.length || 0,
      inProgress: admin.inProgressIssues?.length || 0,
      solved: admin.solvedIssues?.length || 0,
      averageResolutionTime: 0,
      resolutionRate: 0,
    };

    // Calculate resolution rate
    stats.resolutionRate = stats.total
      ? Number(((stats.solved / stats.total) * 100).toFixed(2))
      : 0;

    
    const solvedIssues = await Issue.find({
      _id: { $in: admin.solvedIssues },
      solvedAt: { $exists: true },
    });

    if (solvedIssues.length > 0) {
      const totalTime = solvedIssues.reduce((acc, issue) => {
        return acc + (new Date(issue.solvedAt) - new Date(issue.createdAt));
      }, 0);
      stats.averageResolutionTime = Math.round(
        totalTime / solvedIssues.length / (1000 * 60 * 60 * 24)
      );
    }

    res.status(200).json({
      success: true,
      data: {
        stats,
        statusBreakdown: [
          { status: "unsolved", count: stats.unsolved },
          { status: "in progress", count: stats.inProgress },
          { status: "solved", count: stats.solved },
        ],
      },
      message: "District statistics retrieved successfully",
    });
  } catch (error) {
    console.error("Get district stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching district statistics",
      error: error.message,
    });
  }
};

// getting issue datail by issue id
const getIssueDetails = async (req, res) => {
  try {
    const { issueId } = req.params;

    const issue = await Issue.findById(issueId)
      .populate("createdBy", "username email")
      .populate({
        path: "comments",
        populate: { path: "user", select: "username email" },
      });

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    res.json(issue);
  } catch (error) {
    console.error("Get issue details error:", error);
    res.status(500).json({
      message: "Error fetching issue details",
      error: error.message,
    });
  }
};
=======
>>>>>>> 03c33b1d7f5bf1dd44c178c7709544e34bb80594

module.exports = {
  getDistrictIssues,
  updateIssueStatus,
};
