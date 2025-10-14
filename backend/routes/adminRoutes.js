const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getDistrictIssues,
  getDistrictStats,
  updateIssueStatus,
} = require("../controllers/adminController");

// Admin routes
router.get("/district/issues", protect, getDistrictIssues);
router.patch("/issues/:issueId/status", protect, updateIssueStatus);

module.exports = router;
