const express = require("express");
const { getUserProfile } = require("../controllers/userController");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
router.get("/:userId", protect, getUserProfile);

module.exports = router;