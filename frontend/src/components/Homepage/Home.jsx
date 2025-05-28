import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import {
  FaThumbsUp,
  FaCommentDots,
  FaMapMarkerAlt,
  FaImage,
} from "react-icons/fa";

const statusColors = {
  reported: "red",
  "in progress": "goldenrod",
  resolved: "green",
};

const Home = () => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/issues/all", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch issues");
      }

      const data = await response.json();
      setIssues(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleIssueClick = (issueId) => {
    navigate(`/issue/${issueId}`);
  };

  const handleReportClick = () => {
    navigate("/report");
  };

  if (loading) {
    return <div className="loading">Loading issues...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="home-container">
      <section className="content">
        <div className="hero-section">
          <div className="hero-text">
            <h3>Civic Issues</h3>
            <p>Report and track community problems in your area</p>
          </div>
        </div>

        <div className="filters">
          <input type="text" placeholder="Search issues..." />
          <select>
            <option>All Status</option>
            <option>Reported</option>
            <option>In Progress</option>
            <option>Resolved</option>
          </select>
          <select>
            <option>Recent Activity</option>
            <option>Most Upvoted</option>
          </select>
        </div>

        <div className="issues-grid">
          {issues.map((issue) => (
            <div key={issue._id} className="issue-card">
              <span className="status-badge reported">{issue.status}</span>

              <div className="issue-image-container">
                {issue.images && issue.images.length > 0 ? (
                  <img
                    src={issue.images[0]}
                    alt={issue.title}
                    className="issue-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = "none";
                      e.target.parentElement.innerHTML = `
                        <div class="image-placeholder">
                          <div class="image-placeholder-content">
                            <FaImage />
                            <span>No image available</span>
                          </div>
                        </div>
                      `;
                    }}
                  />
                ) : (
                  <div className="image-placeholder">
                    <div className="image-placeholder-content">
                      <FaImage />
                      <span>No image available</span>
                    </div>
                  </div>
                )}
              </div>

              <h3 className="issue-title">{issue.title}</h3>
              <p>{issue.description}</p>
              <p className="location">
                <FaMapMarkerAlt /> {issue.location.address}
              </p>
              <p className="user">{issue.createdBy.username}</p>
              <div className="card-footer">
                <span>
                  <FaThumbsUp /> {issue.upvotes?.length || 0}
                </span>
                <span>
                  <FaCommentDots /> {issue.comments?.length || 0}
                </span>
              </div>
              <div className="district">{issue.districtCode}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
