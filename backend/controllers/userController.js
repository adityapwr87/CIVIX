const User = require("../models/User");
const Issue = require("../models/Issue");

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select("_id username email createdAt comments reports") // ⬅️ Added _id here
      .populate({
        path: "reports",
        select: "title status upvotes comments createdAt",
      });

    if (!user) return res.status(404).json({ message: "User not found" });

    const totalUpvotes = user.reports.reduce(
      (sum, issue) => sum + (issue.upvotes?.length || 0),
      0
    );
    const commentsCount = user.comments.length;

    const commentsWithIssue = await Promise.all(
      user.comments.map(async (c) => {
        const issue = await Issue.findById(c.issue).select("title status");
        return { ...c._doc, issue };
      })
    );

    res.json({
      _id: user._id, // Optional: Explicitly include _id (even though selected above)
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
