const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createIssue,
  getAllIssues,
  getUserIssues,
  getIssueStats,
  updateIssueStatus,
} = require("../controllers/issueController");

// Public routes
router.get("/all", getAllIssues);

// Protected routes
router.use(protect);
router.post("/", createIssue);
router.get("/my-issues", getUserIssues);
router.get("/stats", getIssueStats);
router.patch("/:issueId/status", updateIssueStatus);

module.exports = router;
