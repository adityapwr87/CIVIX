const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const upload = require("../utils/upload");
const {
  createIssue,
  getAllIssues,
  getUserIssues,
  getIssueStats,
  updateIssueStatus,
  getIssueById,
  addComment,
  toggleUpvote,
} = require("../controllers/issueController");

// Public routes
router.get("/all", getAllIssues);
router.get("/:id", getIssueById);

// Protected routes
router.use(protect);
router.post("/", upload.array("images"), createIssue);
router.get("/my-issues", getUserIssues);
router.get("/stats", getIssueStats);
router.patch("/:issueId/status", updateIssueStatus);
router.post("/:id/comments", addComment);
router.post("/:id/upvote", protect, toggleUpvote);

module.exports = router;
