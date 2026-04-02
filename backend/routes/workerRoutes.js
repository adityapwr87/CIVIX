const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getWorkerProfile,
  update_issue_status,
} = require("../controllers/workerController");

// Get worker profile (self)
router.get("/profile", protect, getWorkerProfile);
// Get worker profile (by id)
router.get("/profile/:workerId", protect, getWorkerProfile);

// Worker updates issue status (e.g., mark solved)
router.patch("/issues/:issueId/status", protect, update_issue_status);

module.exports = router;
