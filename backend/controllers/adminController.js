const Issue = require("../models/Issue");
const User = require("../models/User");
const Notification = require("../models/Notification");
const sendEmail = require("../utils/sendEmail");

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

// Auto-assign unsolved issues to workers in the admin's district
const autoAssignIssues = async (req, res) => {
  try {
    const adminId = req.user._id;
    // populate unsolvedIssues so we can use admin.unsolvedIssues as source
    const admin = await User.findById(adminId).populate({
      path: "unsolvedIssues",
      populate: { path: "createdBy", select: "username email" },
    });

    if (!admin || (admin.role !== "admin" && admin.role !== "superadmin")) {
      return res
        .status(403)
        .json({ success: false, message: "Admin access required" });
    }

    const unsolvedIssues = admin.unsolvedIssues || [];

    if (!unsolvedIssues.length) {
      return res
        .status(200)
        .json({ success: true, message: "No unsolved issues to assign" });
    }

    // Find workers in the same district
    const workers = await User.find({
      role: "worker",
      state: admin.state,
      districtName: admin.districtName,
    });

    if (!workers.length) {
      return res.status(400).json({
        success: false,
        message: "No workers available in this district",
      });
    }

    // Group workers by department
    const workersByDept = {};
    workers.forEach((w) => {
      const dept = w.department || "Others";
      if (!workersByDept[dept]) workersByDept[dept] = [];
      workersByDept[dept].push(w);
    });

    // Group issues by department
    const issuesByDept = {};
    unsolvedIssues.forEach((iss) => {
      const dept = iss.department || "Others";
      if (!issuesByDept[dept]) issuesByDept[dept] = [];
      issuesByDept[dept].push(iss);
    });

    const assignments = [];

    // For each department, distribute issues among workers evenly
    for (const dept of Object.keys(issuesByDept)) {
      const deptIssues = issuesByDept[dept];
      const deptWorkers = workersByDept[dept] || [];

      if (!deptWorkers.length) {
        // skip if no workers for this department
        continue;
      }

      // Work on a shallow copy so we can mutate totalAssigned locally
      const pool = deptWorkers.map((w) => ({
        _id: w._id,
        totalAssigned: w.totalAssigned || 0,
      }));

      for (const issue of deptIssues) {
        // pick worker with smallest totalAssigned
        pool.sort((a, b) => a.totalAssigned - b.totalAssigned);
        const chosen = pool[0];

        // Update issue: assignedWorker, assignedAt, status -> in progress
        const updated = await Issue.findByIdAndUpdate(
          issue._id,
          {
            assignedWorker: chosen._id,
            assignedAt: new Date(),
            status: "in progress",
            updatedAt: new Date(),
          },
          { new: true },
        );

        // Update worker counts and assign to worker's unsolvedIssues
        await User.findByIdAndUpdate(chosen._id, {
          $inc: { totalAssigned: 1 },
          $push: { unsolvedIssues: issue._id },
          $pull: { inProgressIssues: issue._id },
        });

        // Update admin lists: move from unsolved to inProgress
        await User.findByIdAndUpdate(admin._id, {
          $pull: { unsolvedIssues: issue._id },
          $push: { inProgressIssues: issue._id },
        });

        // Update local pool count
        pool[0].totalAssigned += 1;

        // Send Email to User
        try {
          const user = await User.findById(issue.createdBy);
          if (user && user.email) {
            await sendEmail({
              email: user.email,
              subject: "Update on your Issue - CIVIX",
              message: `
                <h3>Your issue "${issue.title}" has been assigned to a worker.</h3>
                <p>Status: <strong>In Progress</strong></p>
                <p>The assigned worker will visit the location soon.</p>
                <br/>
                <p>Regards,<br/>Team CIVIX</p>
              `,
            });
          }
        } catch (emailErr) {
          console.error("Email send error (auto-assign):", emailErr);
        }

        // Emit real-time assignment notification to the chosen worker
        try {
          const socketHelper = require("../socket");
          const io = socketHelper.getIO();
          const assignPayload = {
            issueId: issue._id,
            assignedAt: new Date(),
            title: issue.title,
            department: issue.department,
            message: `You have been assigned issue: ${issue.title}`,
          };
          if (io) {
            io.to(chosen._id.toString()).emit("issue_assigned", assignPayload);
          }
        } catch (emitErr) {
          console.error("Socket emit error (auto-assign):", emitErr);
        }

        assignments.push({ issueId: issue._id, workerId: chosen._id });
      }
    }

    res
      .status(200)
      .json({ success: true, message: "Auto-assign complete", assignments });
  } catch (error) {
    console.error("Auto assign error:", error);
    res.status(500).json({
      success: false,
      message: "Error during auto-assign",
      error: error.message,
    });
  }
};

const getDistrictWorkers = async (req, res) => {
  try {
    const adminId = req.user._id;
    const admin = await User.findById(adminId);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const workers = await User.find({
      role: "worker",
      districtName: admin.districtName,
    });

    const workersData = await Promise.all(
      workers.map(async (worker) => {
        const solvedCount = await Issue.countDocuments({
          assignedWorker: worker._id,
          status: "solved",
        });

        const unsolvedCount = await Issue.countDocuments({
          assignedWorker: worker._id,
          status: { $ne: "solved" },
        });

        return {
          id: worker._id,
          name: worker.username,
          department: worker.department,
          solvedIssues: solvedCount,
          unsolvedIssues: unsolvedCount,
        };
      }),
    );

    res.status(200).json(workersData);
  } catch (error) {
    console.error("Error fetching district workers:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const assignIssueToWorker = async (req, res) => {
  try {
    const { issueId, workerId } = req.body;
    const adminId = req.user._id;

    if (!issueId || !workerId) {
      return res.status(400).json({
        success: false,
        message: "Issue ID and Worker ID are required",
      });
    }

    // 1. Find the issue
    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res
        .status(404)
        .json({ success: false, message: "Issue not found" });
    }

    // Check if issue is already assigned or solved?
    // User request: "assign the signle issue to the signle worker"
    // I should probably check if it's already assigned to someone else, but request implies just doing the assignment.
    // However, moving from "unsolved" to "in progress" implies it's currently unsolved.

    // 2. Find the worker
    const worker = await User.findById(workerId);
    if (!worker || worker.role !== "worker") {
      return res
        .status(404)
        .json({ success: false, message: "Worker not found" });
    }

    // 3. Update Issue
    const updatedIssue = await Issue.findByIdAndUpdate(
      issueId,
      {
        assignedWorker: workerId,
        status: "in progress",
        assignedAt: new Date(),
      },
      { new: true },
    );

    // 4. Update Admin (pull from unsolved, push to inProgress)
    await User.findByIdAndUpdate(adminId, {
      $pull: { unsolvedIssues: issueId },
      $push: { inProgressIssues: issueId },
    });

    // 5. Update Worker (push to unsolvedIssues, inc totalAssigned)
    await User.findByIdAndUpdate(workerId, {
      $push: { unsolvedIssues: issueId },
      // remove from others if reassigning? simpler to assume fresh assignment from unsolved
      $inc: { totalAssigned: 1 },
    });

    // 6. Notify Worker via Socket
    try {
      const socketHelper = require("../socket");
      const io = socketHelper.getIO();
      if (io) {
        io.to(workerId).emit("issue_assigned", {
          issueId: updatedIssue._id,
          title: updatedIssue.title,
          message: `You have been assigned a new issue: ${updatedIssue.title}`,
          assignedAt: updatedIssue.assignedAt,
        });
      }
    } catch (err) {
      console.error("Socket emit error:", err);
    }

    // 7. Send Email to Issue Creator
    try {
      const user = await User.findById(issue.createdBy);
      if (user && user.email) {
        await sendEmail({
          email: user.email,
          subject: "Issue Assigned - CIVIX",
          message: `
            <h3>Your issue "${issue.title}" has been assigned.</h3>
            <p>Worker <strong>${worker.username}</strong> has been assigned to resolve your issue.</p>
            <p>Status: <strong>In Progress</strong></p>
            <br/>
            <p>Thank you for using CIVIX.</p>
          `,
        });
      }
    } catch (emailErr) {
      console.error("Email send error (manual assign):", emailErr);
    }

    res.status(200).json({
      success: true,
      message: "Issue assigned successfully",
      issue: updatedIssue,
    });
  } catch (error) {
    console.error("Error assigning issue:", error);
    res.status(500).json({
      success: false,
      message: "Server error during assignment",
    });
  }
};

module.exports = {
  getDistrictIssues,
  autoAssignIssues,
  getDistrictWorkers,
  assignIssueToWorker,
};
