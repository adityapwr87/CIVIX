import React, { useEffect, useState } from "react";
import Navbar from "../Navbar/Navbar";
import {useNavigate } from "react-router-dom";
import "./AdminProfile.css";
import {
  getUserProfile,
  updateprofilepic,
  updateUserBio,
} from "../../services/api";
import { toast } from "react-toastify";

const AdminProfile = () => {
  const [profile, setProfile] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const userId = currentUser._id;
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await getUserProfile(userId);
        setProfile(res.data);
        console.log("User profile data:", res.data);
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
      const toastid=toast.info("Updating profile picture...", {
            position: "top-right",
            autoClose: false,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            style: {
              border: "2px solid #d32f2f",
              backgroundColor: "#fff",
              color: "#d32f2f",
              borderRadius: "10px",
              fontWeight: "500",
              padding: "12px 16px",
              fontSize: "15px",
            },
            icon: false,
            progressStyle: { background: "#d32f2f" },
          });
      setAvatar(URL.createObjectURL(file));
      updateprofilepic(file)
        .then((res) => {
          toast.dismiss(toastid);
          toast.success("Profile picture updated successfully!", {
            position: "top-right",
            autoClose: 4000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            style: {
              border: "2px solid #d32f2f",
              backgroundColor: "#fff",
              color: "#d32f2f",
              borderRadius: "10px",
              fontWeight: "500",
              padding: "12px 16px",
              fontSize: "15px",
            },
            icon: false,
            progressStyle: { background: "#d32f2f" },
          });
        })
        .catch((err) => {
          toast.dismiss(toastid);
          toast.error("Failed to update profile picture", {
            position: "top-right",
            autoClose: 4000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            style: {
              border: "2px solid #d32f2f",
              backgroundColor: "#fff",
              color: "#d32f2f",
              borderRadius: "10px",
              fontWeight: "500",
              padding: "12px 16px",
              fontSize: "15px",
            },
            icon: false,
            progressStyle: { background: "#d32f2f" },
          });
        });
    }
  };

  const handleBioChange = () => {
    const newBio = prompt("Enter your new bio:", profile.bio || "");
    if (newBio !== null) {
      const toastid = toast.info("Updating bio...", {
            position: "top-right",
            autoClose: false,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            style: {
              border: "2px solid #d32f2f",
              backgroundColor: "#fff",
              color: "#d32f2f",
              borderRadius: "10px",
              fontWeight: "500",
              padding: "12px 16px",
              fontSize: "15px",
            },
            icon: false,
            progressStyle: { background: "#d32f2f" },
          });
      updateUserBio(newBio)
        .then(() => {
          toast.dismiss(toastid);
          setProfile((prev) => ({ ...prev, bio: newBio }));
          toast.success("Bio updated successfully!", {
                    position: "top-right",
                    autoClose: 4000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    style: {
                      border: "2px solid #d32f2f",
                      backgroundColor: "#fff",
                      color: "#d32f2f",
                      borderRadius: "10px",
                      fontWeight: "500",
                      padding: "12px 16px",
                      fontSize: "15px",
                    },
                    icon: false,
                    progressStyle: { background: "#d32f2f" },
                  });
        })
        .catch((err) => {
          toast.dismiss(toastid);
          toast.error("Failed to update bio", {
                    position: "top-right",
                    autoClose: 4000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    style: {
                      border: "2px solid #d32f2f",
                      backgroundColor: "#fff",
                      color: "#d32f2f",
                      borderRadius: "10px",
                      fontWeight: "500",
                      padding: "12px 16px",
                      fontSize: "15px",
                    },
                    icon: false,
                    progressStyle: { background: "#d32f2f" },
                  });
        });
    }
  };

  const handleLogout = () => {
    const toastid = toast.info("Logging out...", {
      position: "top-right",
      autoClose: false,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      style: {
        border: "2px solid #d32f2f",
        backgroundColor: "#fff",
        color: "#d32f2f",
        borderRadius: "10px",
        fontWeight: "500",
        padding: "12px 16px",
        fontSize: "15px",
      },
      icon: false,
      progressStyle: { background: "#d32f2f" },
    });
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
    toast.dismiss(toastid);
    toast.success("Logged out successfully!", {
      position: "top-right",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      style: {
        border: "2px solid #d32f2f",
        backgroundColor: "#fff",
        color: "#d32f2f",
        borderRadius: "10px",
        fontWeight: "500",
        padding: "12px 16px",
        fontSize: "15px",
      },
      icon: false,
      progressStyle: { background: "#d32f2f" },
    });
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
                  <td>state:</td>
                  <td>{profile.state}</td>
                </tr>
                <tr>
                  <td>district:</td>
                  <td>{profile.districtName}</td>
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
