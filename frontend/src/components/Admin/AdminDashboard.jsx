import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaExclamation, FaSpinner, FaCheck } from "react-icons/fa";
import axios from "axios";
import "./AdminDashboard.css";
import Navbar from "../Navbar/Navbar";

const AdminDashboard = () => {
  const [issues, setIssues] = useState({
    unsolved: [],
    inProgress: [],
    solved: [],
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("unsolved");

  const navigate = useNavigate();

  const fetchIssues = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/district/issues`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setIssues(response.data.data);
      } else {
        setError(response.data.message || "Failed to fetch issues");
      }
    } catch (err) {
      console.error("Error fetching issues:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const handleIssueClick = (issueId) => {
    navigate(`/admin/issue/${issueId}`);
  };

  const CircularProgress = ({ percentage, color, label, count, total }) => {
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="circular-progress-container">
        <svg className="circular-progress" width="180" height="180">
          <circle
            className="circle-bg"
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="12"
          />
          <circle
            className="circle-progress"
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 90 90)"
          />
          <text
            x="90"
            y="80"
            textAnchor="middle"
            className="progress-count"
            fill={color}
          >
            {count}
          </text>
          <text
            x="90"
            y="105"
            textAnchor="middle"
            className="progress-total"
            fill="#6b7280"
          >
            of {total}
          </text>
        </svg>
        <p className="progress-label" style={{ color }}>
          {label}
        </p>
      </div>
    );
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="dashboard-container">
          <div className="loading-state">
            <FaSpinner className="spin-icon" />
            <p>Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navbar />
        <div className="dashboard-container">
          <div className="error-state">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const unsolvedPercentage =
    issues.total > 0 ? (issues.unsolved.length / issues.total) * 100 : 0;
  const inProgressPercentage =
    issues.total > 0 ? (issues.inProgress.length / issues.total) * 100 : 0;
  const solvedPercentage =
    issues.total > 0 ? (issues.solved.length / issues.total) * 100 : 0;

  const currentIssues =
    activeTab === "unsolved"
      ? issues.unsolved
      : activeTab === "inProgress"
      ? issues.inProgress
      : issues.solved;

  return (
    <div>
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <p className="total-issues">
            Total Issues: <strong>{issues.total}</strong>
          </p>
        </div>

        <div className="statistics-section">
          <CircularProgress
            percentage={unsolvedPercentage}
            color="#ef4444"
            label="Unsolved"
            count={issues.unsolved.length}
            total={issues.total}
          />
          <CircularProgress
            percentage={inProgressPercentage}
            color="#f59e0b"
            label="In Progress"
            count={issues.inProgress.length}
            total={issues.total}
          />
          <CircularProgress
            percentage={solvedPercentage}
            color="#10b981"
            label="Solved"
            count={issues.solved.length}
            total={issues.total}
          />
        </div>

        <div className="issues-section">
          <div className="tabs-container">
            <button
              className={`tab-button ${
                activeTab === "unsolved" ? "active" : ""
              }`}
              onClick={() => setActiveTab("unsolved")}
            >
              <FaExclamation />
              <span>Unsolved ({issues.unsolved.length})</span>
            </button>
            <button
              className={`tab-button ${
                activeTab === "inProgress" ? "active" : ""
              }`}
              onClick={() => setActiveTab("inProgress")}
            >
              <FaSpinner />
              <span>In Progress ({issues.inProgress.length})</span>
            </button>
            <button
              className={`tab-button ${activeTab === "solved" ? "active" : ""}`}
              onClick={() => setActiveTab("solved")}
            >
              <FaCheck />
              <span>Solved ({issues.solved.length})</span>
            </button>
          </div>

          <div className="issues-content">
            {currentIssues.length === 0 ? (
              <div className="empty-state">
                <p>
                  No {activeTab === "inProgress" ? "in progress" : activeTab}{" "}
                  issues
                </p>
              </div>
            ) : (
              <div className="issues-grid">
                {currentIssues.map((issue, index) => (
                  <div
                    key={issue._id}
                    className="issue-card"
                    onClick={() => handleIssueClick(issue._id)}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="issue-header">
                      <h3>{issue.title}</h3>
                      <span className={`status-badge ${activeTab}`}>
                        {activeTab === "inProgress" ? "In Progress" : activeTab}
                      </span>
                    </div>
                    <p className="issue-description">
                      {issue.description?.substring(0, 150)}...
                    </p>
                    <div className="issue-footer">
                      <span className="issue-author">
                        By: {issue.createdBy?.username || "Unknown"}
                      </span>
                      <span className="issue-date">
                        {new Date(issue.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
