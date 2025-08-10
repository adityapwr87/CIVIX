import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaExclamation, FaSpinner, FaCheck } from "react-icons/fa";
import axios from "axios";
import "./AdminDashboard.css";
import Navbar from "../Navbar/Navbar"; // Adjust the import path as necessary
const AdminDashboard = () => {
  const [issues, setIssues] = useState({
    unsolved: [],
    inProgress: [],
    solved: [],
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const fetchIssues = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `https://civix-kvyp.onrender.com/api/admin/district/${user.districtCode}/issues`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setIssues(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching issues:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.districtCode) {
      console.error("No district code found for admin");
      return;
    }
    fetchIssues();
  }, [user?.districtCode]);

  const handleIssueClick = (issueId) => {
    console.log("Navigating to issue:", issueId); // Debug log
    navigate(`/admin/issue/${issueId}`); // Updated route path
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <Navbar />
      <div className="admin-dashboard">
        <div className="stats-container">
          <div className="stat-card unsolved">
            <h3>Unsolved</h3>
            <span className="stat-number">{issues.unsolved.length}</span>
          </div>
          <div className="stat-card in-progress">
            <h3>In Progress</h3>
            <span className="stat-number">{issues.inProgress.length}</span>
          </div>
          <div className="stat-card solved">
            <h3>Solved</h3>
            <span className="stat-number">{issues.solved.length}</span>
          </div>
          <div className="stat-card total">
            <h3>Total</h3>
            <span className="stat-number">{issues.total}</span>
          </div>
        </div>

        <div className="issues-grid">
          <div className="issues-column">
            <h2>
              <FaExclamation /> Unsolved Issues
            </h2>
            <div className="issues-list">
              {issues.unsolved.map((issue) => (
                <div
                  key={issue._id}
                  className="issue-card"
                  onClick={() => handleIssueClick(issue._id)}
                >
                  <h3>{issue.title}</h3>
                  <p>{issue.description?.substring(0, 100)}...</p>
                  <div className="issue-meta">
                    <span>By: {issue.createdBy?.username}</span>
                    <span>
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="issues-column">
            <h2>
              <FaSpinner /> In Progress
            </h2>
            <div className="issues-list">
              {issues.inProgress.map((issue) => (
                <div
                  key={issue._id}
                  className="issue-card"
                  onClick={() => handleIssueClick(issue._id)}
                >
                  <h3>{issue.title}</h3>
                  <p>{issue.description?.substring(0, 100)}...</p>
                  <div className="issue-meta">
                    <span>By: {issue.createdBy?.username}</span>
                    <span>
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="issues-column">
            <h2>
              <FaCheck /> Solved Issues
            </h2>
            <div className="issues-list">
              {issues.solved.map((issue) => (
                <div
                  key={issue._id}
                  className="issue-card"
                  onClick={() => handleIssueClick(issue._id)}
                >
                  <h3>{issue.title}</h3>
                  <p>{issue.description?.substring(0, 100)}...</p>
                  <div className="issue-meta">
                    <span>By: {issue.createdBy?.username}</span>
                    <span>
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
