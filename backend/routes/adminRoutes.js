const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');

// Define routes with properly imported controller functions
router.get('/dashboard', protect, adminOnly, adminController.getDashboardStats);
router.get('/users', protect, adminOnly, adminController.getUsers);
router.patch('/users/:userId/status', protect, adminOnly, adminController.updateUserStatus);
router.get('/district-stats', protect, adminOnly, adminController.getDistrictStats);

module.exports = router;