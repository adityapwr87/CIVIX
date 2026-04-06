import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllIssues } from "../../services/api";
import "./Home.css";
import {
  FaThumbsUp,
  FaCommentDots,
  FaMapMarkerAlt,
  FaImage,
} from "react-icons/fa";
import Navbar from "../Navbar/Navbar";

const Home = () => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
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
          (issue.location?.address || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter(
        (issue) => issue.status?.toLowerCase() === statusFilter.toLowerCase()
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
      const response = await getAllIssues();
      setIssues(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setLoading(false);
    }
  };

  const handleIssueClick = (issueId) => {
    navigate(`/issue/${issueId}`);
  };

  return (
    <div className="home-layout">
      {/* Navbar always visible */}
      <Navbar />

      <div className="home-container">
        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading community issues...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="error-container">
            <p>Error: {error}</p>
            <button onClick={fetchIssues} className="retry-btn">
              Retry
            </button>
          </div>
        )}

        {/* Main Content (Only shown when not loading & no error) */}
        {!loading && !error && (
          <section className="content">
            {/* Hero Section */}
            <div className="hero-section">
              <div className="hero-text">
                <h3>Civic Issues</h3>
                <p>Report and track community problems in your area</p>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="filters-bar">
              <div className="search-wrapper">
                <input
                  type="text"
                  placeholder="Search issues, locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="select-wrapper">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Status</option>
                  <option value="unsolved">Unsolved</option>
                  <option value="in progress">In Progress</option>
                  <option value="solved">Solved</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="filter-select"
                >
                  <option value="recent">Recent Activity</option>
                  <option value="upvotes">Most Upvoted</option>
                </select>
              </div>
            </div>

            {/* Issues Grid */}
            <div className="civix-card-layout">
  {filteredIssues.length > 0 ? (
    filteredIssues.map((issue) => (
      <div
        key={issue._id}
        className="civix-item-card"
        onClick={() => handleIssueClick(issue._id)}
      >
        <div className="civix-card-media">
          {issue.images && issue.images.length > 0 ? (
            <img
              src={issue.images[0]}
              alt={issue.title}
              className="civix-media-img"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = "none";
                e.target.parentElement.classList.add("has-error");
              }}
            />
          ) : (
            <div className="civix-media-empty">
              <FaImage />
              <span>No image available</span>
            </div>
          )}

          {/* Fallback for broken image */}
          <div className="civix-media-empty civix-media-fallback">
            <FaImage />
            <span>Image unavailable</span>
          </div>

          <span
            className={`civix-badge ${issue.status
              ?.toLowerCase()
              .replace(" ", "_")}`}
          >
            {issue.status}
          </span>
        </div>

        <div className="civix-card-body">
          <div className="civix-card-top-row">
            <span className="civix-tag-district">
              {issue.districtCode || "General"}
            </span>
            <span className="civix-tag-date">
              {new Date(issue.createdAt).toLocaleDateString()}
            </span>
          </div>

          <h3 className="civix-card-title">{issue.title}</h3>

          <p className="civix-card-desc">
            {issue.description.length > 90
              ? `${issue.description.substring(0, 90)}...`
              : issue.description}
            {issue.description.length > 90 && (
              <span className="civix-read-more">Read more</span>
            )}
          </p>

          <div className="civix-card-location">
            <FaMapMarkerAlt />
            <span>
              {issue.location?.address || "Location unavailable"}
            </span>
          </div>

          <div className="civix-card-bottom">
            <div className="civix-author-info">
              By{" "}
              <strong>
                {issue.createdBy?.username || "Unknown"}
              </strong>
            </div>
            <div className="civix-metrics">
              <span>
                <FaThumbsUp /> {issue.upvotes?.length || 0}
              </span>
              <span>
                <FaCommentDots /> {issue.comments?.length || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    ))
  ) : (
    <div className="civix-empty-state">
      <p>No issues found matching your filters.</p>
    </div>
  )}
</div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Home;
