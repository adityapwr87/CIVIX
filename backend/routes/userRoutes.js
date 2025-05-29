const express = require("express");
const { getUserProfile } = require("../controllers/userController");
const router = express.Router();

router.get("/:userId", getUserProfile);

module.exports = router;