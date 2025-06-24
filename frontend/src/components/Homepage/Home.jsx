import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import {
  FaThumbsUp,
  FaCommentDots,
  FaMapMarkerAlt,
  FaImage,
} from "react-icons/fa";

import Navbar from "../Navbar/Navbar";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [filteredIssues, setFilteredIssues] = useState([]);

  useEffect(() => {
    fetchIssues();
  }, []);

  useEffect(() => {
    let result = [...issues];

    // Search filter
    if (searchTerm) {
      result = result.filter(
        (issue) =>
          issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          issue.location.address
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter(
        (issue) => issue.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Sort
    result = result.sort((a, b) => {
      if (sortBy === "recent") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === "upvotes") {
        return (b.upvotes?.length || 0) - (a.upvotes?.length || 0);
      }
      return 0;
    });

    setFilteredIssues(result);
  }, [issues, searchTerm, statusFilter, sortBy]);

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
    <div className="home-layout">
      <Navbar />
      <div className="home-container">
        <section className="content">
          <div className="hero-section">
            <div className="hero-text">
              <h3>Civic Issues</h3>
              <p>Report and track community problems in your area</p>
            </div>
          </div>

          <div className="filters">
            <input
              type="text"
              placeholder="Search issues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="reported">Reported</option>
              <option value="in progress">In Progress</option>
              <option value="solved">Solved</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="recent">Recent Activity</option>
              <option value="upvotes">Most Upvoted</option>
            </select>
          </div>

          <div className="issues-grid">
            {filteredIssues.map((issue) => (
              <div
                key={issue._id}
                className="issue-card"
                onClick={() => handleIssueClick(issue._id)}
                style={{ cursor: "pointer" }}
              >
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
                <span className="status-badge reported">{issue.status}</span>

                <h3 className="issue-title">{issue.title}</h3>
                <p className="issue-description">
                  {issue.description.length > 100
                    ? `${issue.description.substring(0, 100)}`
                    : issue.description}...Read more
                </p>
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
    </div>
  );
};

export default Home;
