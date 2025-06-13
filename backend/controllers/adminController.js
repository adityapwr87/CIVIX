const Issue = require('../models/Issue');
const User = require('../models/User');

const getDashboardStats = async (req, res) => {
  try {
    const stats = {
      total: await Issue.countDocuments(),
      pending: await Issue.countDocuments({ status: 'pending' }),
      inProgress: await Issue.countDocuments({ status: 'in-progress' }),
      resolved: await Issue.countDocuments({ status: 'resolved' }),
      usersCount: await User.countDocuments({ role: 'user' })
    };

    const recentIssues = await Issue.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('createdBy', 'username');

    res.json({
      stats,
      recentIssues
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user status' });
  }
};

const getDistrictStats = async (req, res) => {
  try {
    const stats = await Issue.aggregate([
      {
        $group: {
          _id: '$districtCode',
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } }
        }
      }
    ]);
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching district statistics' });
  }
};

module.exports = {
  getDashboardStats,
  getUsers,
  updateUserStatus,
  getDistrictStats
};