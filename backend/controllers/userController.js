const User = require("../models/User");
const Issue = require("../models/Issue");

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select("username email createdAt comments reports")
      .populate({
        path: "reports",
        select: "title status upvotes comments createdAt",
      });

    if (!user) return res.status(404).json({ message: "User not found" });

    // Calculate stats
    const totalUpvotes = user.reports.reduce((sum, issue) => sum + (issue.upvotes?.length || 0), 0);
    const commentsCount = user.comments.length;

    // Get recent comments with issue info
    const commentsWithIssue = await Promise.all(
      user.comments.map(async (c) => {
        const issue = await Issue.findById(c.issue).select("title status");
        return { ...c._doc, issue };
      })
    );

    res.json({
      username: user.username,
      email: user.email,
      joined: user.createdAt,
      issuesReported: user.reports.length,
      commentsCount,
      totalUpvotes,
      reportedIssues: user.reports,
      comments: commentsWithIssue,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = { getUserProfile };