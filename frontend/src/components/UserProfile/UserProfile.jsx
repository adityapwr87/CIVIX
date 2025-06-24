import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import "./UserProfile.css";

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
 const token = localStorage.getItem("token");
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState("issues");

  // ✅ Load logged-in user from localStorage
  const currentUser = JSON.parse(localStorage.getItem("user"));
  console.log("Current User:", currentUser);
  useEffect(() => {
    fetch(`http://localhost:5000/api/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then(setProfile);
  }, [userId]);

  const handleChatClick = () => {
    console.log("Starting chat with:", profile);
    // ✅ Ensure currentUser and profile are defined before navigating  
    console.log("Current User:", currentUser);
    if (!currentUser || !profile) return;

    navigate("/chat", {
      state: {
        currentUser,
        receiverUser: profile,
      },
    });
  };

  if (!profile) return <div>Loading...</div>;

  return (
    <>
      <Navbar />
      <div className="user-profile-container">
        <div className="profile-header">
          <div className="avatar-placeholder" />
          <div>
            <h2>{profile.username}</h2>
            <p>
              Community advocate passionate about improving our neighborhood.
              <br />
              Always ready to help make our city a better place to live.
            </p>
            <div>
              <span>Joined {new Date(profile.joined).toLocaleDateString()}</span>
            </div>
          </div>

          {/* ✅ Only show chat button if viewing another user's profile */}
          {currentUser?.id !== profile._id && (
            <button className="chat-btn" onClick={handleChatClick}>
              Start Chat
            </button>
          )}
        </div>

        <div className="profile-stats">
          <span><b>{profile.issuesReported}</b> Issues Reported</span>
          <span><b>{profile.commentsCount}</b> Comments</span>
          <span><b>{profile.totalUpvotes}</b> Total Upvotes</span>
        </div>

        <div className="profile-tabs">
          <button
            onClick={() => setTab("issues")}
            className={tab === "issues" ? "active" : ""}
          >
            Reported Issues
          </button>
          <button
            onClick={() => setTab("comments")}
            className={tab === "comments" ? "active" : ""}
          >
            Recent Comments
          </button>
        </div>

        {tab === "issues" && (
          <div className="reported-issues-list">
            {profile.reportedIssues.map((issue) => (
              <div key={issue._id} className="issue-card">
                <span className={`status-badge ${issue.status}`}>
                  {issue.status}
                </span>
                <Link to={`/issue/${issue._id}`}>
                  <b>{issue.title}</b>
                </Link>
                <div>
                  <span>👍 {issue.upvotes?.length || 0} upvotes</span>
                  <span>💬 {issue.comments?.length || 0} comments</span>
                </div>
                <div>{new Date(issue.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}

        {tab === "comments" && (
          <div className="user-comments-list">
            {profile.comments.map((c, idx) => (
              <div key={idx} className="comment-card">
                <Link to={`/issue/${c.issue?._id}`}>
                  {c.issue?.title || "Issue"}
                </Link>
                <div>{c.text}</div>
                <div>{new Date(c.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default UserProfile;
