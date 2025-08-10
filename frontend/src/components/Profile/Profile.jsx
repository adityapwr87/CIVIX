import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import "./Profile.css";
import { getUserProfile } from "../../services/api";
import {updateprofilepic} from "../../services/api";
import { updateUserBio } from "../../services/api"; // Assuming this function exists
const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState("issues");
  const [avatar, setAvatar] = useState(null);

  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const userId = currentUser?._id;

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await getUserProfile(userId);
        setProfile(res.data);
      } catch (err) {
        console.error("Failed to fetch user profile", err);
      }
    };
   
    if (userId) {
      fetchUserProfile(); 
    }
  }, [userId]);

  const handleChatClick = () => {
    if (!currentUser || !profile) return;
    navigate("/chat", {
      state: {
        currentUser,
        receiverUser: profile,
      },
    });
  };
  const handlebiochange = () => {
    const newBio = prompt("Enter your new bio:", profile.bio || "");
    if (newBio !== null) {
      // Call API to update bio
      updateUserBio(newBio)
        .then((res) => {
          console.log("Bio updated successfully");
          setProfile((prev) => ({ ...prev, bio: newBio }));
        })
        .catch((err) => {
          console.error("Failed to update bio", err);
        });
    }
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(URL.createObjectURL(file));
      updateprofilepic(file)
        .then((res) => {
          console.log("Profile picture updated successfully");
        })
        .catch((err) => {
          console.error("Failed to update profile picture", err);
        });
    }
  };

  if (!profile) return <div>Loading...</div>;

  return (
    <>
      <Navbar />
      <div className="user-profile-container">
        <div className="profile-header">
          <div className="avatar-placeholder">
            {profile.profileImage ? (
              <a
                href={profile.profileImage}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={avatar || profile.profileImage}
                  alt="Profile"
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    cursor: "pointer",
                  }}
                />
              </a>
            ) : (
              <div className="default-avatar">No Image</div>
            )}
          </div>

          <div>
            <h2>{profile.username}</h2>
            <p>
              {profile?.bio ||
                " Always ready to help make our city a better place to live."}
            </p>
            <div>
              <span>
                Joined {new Date(profile.joined).toLocaleDateString()}
              </span>
            </div>

            {/* Show buttons only for own profile */}
            {currentUser?._id === profile._id && (
              <div className="profile-actions">
                <button
                  className="profile-action-btn"
                  onClick={() => handlebiochange()}
                >
                  Change Bio
                </button>
                <label
                  className="profile-action-btn"
                  style={{ cursor: "pointer" }}
                >
                  Update Profile Picture
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleProfilePicChange}
                  />
                </label>
              </div>
            )}
          </div>

          {currentUser?._id !== profile._id && (
            <button className="chat-btn" onClick={handleChatClick}>
              Start Chat
            </button>
          )}

          <button
            className="chat-btn"
            onClick={() => {
              localStorage.removeItem("user");
              navigate("/");
            }}
          >
            Logout
          </button>
        </div>

        <div className="profile-stats">
          <span>
            <b>{profile.issuesReported}</b> Issues Reported
          </span>
          <span>
            <b>{profile.commentsCount}</b> Comments
          </span>
          <span>
            <b>{profile.totalUpvotes}</b> Total Upvotes
          </span>
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
            {Array.isArray(profile.reportedIssues) &&
              profile.reportedIssues.map((issue) => (
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
            {Array.isArray(profile.comments) &&
              profile.comments.map((c, idx) => (
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

export default Profile;
