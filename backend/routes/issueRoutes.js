const express = require("express");
const router = express.Router();

const {
  createIssue,
  getIssues,
  updateIssueStatus,
} = require("../controllers/issueController");

const { protect, isAdmin } = require("../middleware/authMiddleware");

// User and Admin can create issues (user creates, admin handles)
router.post("/", protect, createIssue);

// Get issues for current user or admin
router.get("/", protect, getIssues);

// Admin updates issue status
router.patch("/:issueId/status", protect, isAdmin, updateIssueStatus);

module.exports = router;
