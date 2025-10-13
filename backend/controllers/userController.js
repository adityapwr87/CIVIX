const User = require("../models/User");
const Issue = require("../models/Issue");
const uploadtos3 = require("../utils/s3Upload"); // Assuming this is a utility function to handle S3 uploads
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select(
        "_id username email createdAt comments reports bio profileImage unsolvedIssues inProgressIssues solvedIssues state districtName"
      )
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
      _id: user._id,
      username: user.username,
      email: user.email,
      joined: user.createdAt,
      issuesReported: (user.reports || []).length,
      commentsCount: (user.comments || []).length,
      totalUpvotes,
      reportedIssues: user.reports || [],
      comments: commentsWithIssue,
      bio: user.bio || "",
      profileImage: user.profileImage,
      unsolvedCount: (user.unsolvedIssues || []).length,
      inProgressCount: (user.inProgressIssues || []).length,
      solvedCount: (user.solvedIssues || []).length,
      state: user.state || null,
      districtName: user.districtName || null,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const updateProfilePic = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    console.log("Received file:", req.file);
    if (req.file) {
      user.profileImage = await uploadtos3(req.file);
    }

    await user.save();
    res.json({ message: "Profile picture updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const updateUserBio = async (req, res) => {
  try {
    const { bio } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.bio = bio;
    await user.save();

    res.json({ message: "Bio updated successfully", bio: user.bio });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = { getUserProfile, updateProfilePic, updateUserBio };
