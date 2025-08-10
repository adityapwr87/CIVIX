import React, { useEffect, useState } from "react";
import Navbar from "../Navbar/Navbar";
import "./AdminProfile.css";
import {
  getUserProfile,
  updateprofilepic,
  updateUserBio,
} from "../../services/api";

const AdminProfile = () => {
  const [profile, setProfile] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const userId = currentUser._id;
  const [totalCount, setTotalCount] = useState(0);
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await getUserProfile(userId);
        setProfile(res.data);
        const totalCount = res.data.unsolvedCount + res.data.inProgressCount + res.data.solvedCount;
        setTotalCount(totalCount);

      } catch (err) {
        console.error("Failed to fetch user profile", err);
      }
    };

    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

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

  const handleBioChange = () => {
    const newBio = prompt("Enter your new bio:", profile.bio || "");
    if (newBio !== null) {
      updateUserBio(newBio)
        .then(() => {
          console.log("Bio updated successfully");
          setProfile((prev) => ({ ...prev, bio: newBio }));
        })
        .catch((err) => {
          console.error("Failed to update bio", err);
        });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  if (!profile) return <div>Loading...</div>;

  return (
    <>
      <Navbar />
      <div className="admin-profile-container">
        <div className="admin-profile-card">
          <div className="admin-profile-header">
            <div className="admin-avatar-placeholder">
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
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      cursor: "pointer",
                    }}
                  />
                </a>
              ) : (
                <div className="default-avatar">No Image</div>
              )}
            </div>
            <div className="admin-profile-details">
              <h2>{profile.username}</h2>
              <p>{profile.bio || "No bio provided"}</p>
              <span>
                Joined {new Date(profile.joined).toLocaleDateString()}
              </span>
              <div className="profile-actions">
                <button
                  className="profile-action-btn"
                  onClick={handleBioChange}
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
            </div>
            <button className="chat-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>

          <div className="admin-profile-info">
            <h3>Admin Statistics</h3>
            <table>
              <tbody>
                <tr>
                  <td>districtCode:</td>
                  <td>{profile.districtCode}</td>
                </tr>
                <tr>
                  <td>Total Issues Reported:</td>
                  <td>{totalCount}</td>
                </tr>
                <tr>
                  <td>Unsolved Issues:</td>
                  <td>{profile.unsolvedCount}</td>
                </tr>
                <tr>
                  <td>In Progress Issues:</td>
                  <td>{profile.inProgressCount}</td>
                </tr>
                <tr>
                  <td>Solved Issues:</td>
                  <td>{profile.solvedCount}</td>
                </tr>
                <tr>
                  <td>Joined On:</td>
                  <td>{new Date(profile.joined).toLocaleDateString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminProfile;
