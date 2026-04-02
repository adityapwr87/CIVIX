const User = require("../models/User");
const Issue = require("../models/Issue");
const Notification = require("../models/Notification");
const socketHelper = require("../socket");
const sendEmail = require("../utils/sendEmail");

// Get worker profile (by id or current authenticated worker)
const getWorkerProfile = async (req, res) => {
  try {
    const workerId = req.params.workerId || req.user._id;

    const worker = await User.findById(workerId)
      .select(
        "_id username email createdAt bio profileImage unsolvedIssues inProgressIssues solvedIssues state districtName department totalAssigned",
      )
      .populate({
        path: "unsolvedIssues",
        select: "title status department createdAt assignedAt",
      })
      .populate({
        path: "inProgressIssues",
        select: "title status department createdAt assignedAt",
      })
      .populate({
        path: "solvedIssues",
        select: "title status department createdAt solvedAt",
      });

    if (!worker) return res.status(404).json({ message: "Worker not found" });

    res.json({
      _id: worker._id,
      username: worker.username,
      email: worker.email,
      joined: worker.createdAt,
      bio: worker.bio || "",
      profileImage: worker.profileImage || "",
      state: worker.state || null,
      districtName: worker.districtName || null,
      department: worker.department || null,
      totalAssigned: worker.totalAssigned || 0,
      unsolved: worker.unsolvedIssues || [],
      inProgress: worker.inProgressIssues || [],
      solved: worker.solvedIssues || [],
    });
  } catch (err) {
    console.error("Get worker profile error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Worker updates status of an assigned issue (primarily to mark solved)
const update_issue_status = async (req, res) => {
  try {
    const issueId = req.params.issueId || req.params.id;
    const { status } = req.body;

    // Only allow workers to call this
    if (req.user.role !== "worker") {
      return res.status(403).json({ message: "Worker access required" });
    }

    const workerId = req.user._id;

    const issue = await Issue.findById(issueId);
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    // Ensure the issue is assigned to this worker
    if (
      !issue.assignedWorker ||
      issue.assignedWorker.toString() !== workerId.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Issue not assigned to this worker" });
    }

    // Only support marking as solved via this endpoint for now
    if (status !== "solved") {
      return res.status(400).json({
        message:
          "Invalid status change. Workers may only mark issues as 'solved' here.",
      });
    }

    // Update issue
    issue.status = "solved";
    issue.solvedAt = new Date();
    issue.updatedAt = new Date();
    await issue.save();

    // Update worker arrays: unsolved -> solved
    await User.findByIdAndUpdate(workerId, {
      $pull: { unsolvedIssues: issue._id },
      $push: { solvedIssues: issue._id },
    });

    // Update admin arrays: inProgress -> solved
    const admin = await User.findOne({
      role: "admin",
      state: issue.state,
      districtName: issue.districtName,
    });
    if (admin) {
      await User.findByIdAndUpdate(admin._id, {
        $pull: { inProgressIssues: issue._id },
        $push: { solvedIssues: issue._id },
      });
    }

    // Notification to reporter
    await Notification.create({
      user: issue.createdBy,
      type: "issue",
      referenceId: issue._id,
      message: `Issue "${issue.title}" has been marked solved by the worker.`,
    });

    // Send Email to Reporter
    try {
      const user = await User.findById(issue.createdBy);
      if (user && user.email) {
        await sendEmail({
          email: user.email,
          subject: "Issue Solved! - CIVIX",
          message: `
            <h3>Great news! Your issue "${issue.title}" has been resolved.</h3>
            <p>The assigned worker has marked this issue as <strong>Solved</strong>.</p>
            <p>Thank you for helping us improve our community.</p>
            <br/>
            <p>CIVIX Team</p>
          `,
        });
      }
    } catch (emailErr) {
      console.error("Email send error (issue solved):", emailErr);
    }

    // Emit real-time update to reporter and admin
    try {
      const io = socketHelper.getIO();
      const payload = {
        message: `Issue "${issue.title}" has been marked solved by the worker.`,
      };
      if (io) {
        // Notify reporter
        io.to(issue.createdBy.toString()).emit("issue_status_changed", payload);
      }
    } catch (emitErr) {
      console.error("Socket emit error (worker update):", emitErr);
    }

    res.json({ success: true, message: "Issue marked as solved", issue });
  } catch (err) {
    console.error("Worker update issue status error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  getWorkerProfile,
  update_issue_status,
};
