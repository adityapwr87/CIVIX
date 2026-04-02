import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { addComment } from "../../services/api";
import {
  getIssueById,
  getDistrictWorkers,
  assignIssueToWorker,
} from "../../services/api";
import { upvoteIssue } from "../../services/api";
import {
  FaMapMarkerAlt,
  FaThumbsUp,
  FaCommentDots,
  FaImage,
  FaRegThumbsUp,
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaTimes,
} from "react-icons/fa";
import Navbar from "../Navbar/Navbar";
import "./AdminIssueDetails.css";

const AdminIssueDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [filteredWorkers, setFilteredWorkers] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [assigningTo, setAssigningTo] = useState(null);
  const [deptFilter, setDeptFilter] = useState("All");

  const userId = JSON.parse(localStorage.getItem("user"))._id;

  useEffect(() => {
    const fetchIssue = async () => {
      try {
        const res = await getIssueById(id);
        setIssue(res.data);
      } catch (err) {
        console.error(
          "Failed to load issue:",
          err.response?.data || err.message,
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchIssue();
  }, [id]);
  useEffect(() => {
    if (issue) {
      setHasUpvoted(issue.upvotes.includes(userId));
    }
  }, [issue, userId]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await addComment(id, comment);
      const data = res.data;

      setIssue((prev) => ({
        ...prev,
        comments: [...prev.comments, data.comment],
      }));
      setComment("");
    } catch (err) {
      console.error(
        "Error submitting comment:",
        err.response?.data?.message || err.message,
      );
    }
  };

  const handleUpvote = async () => {
    try {
      const res = await upvoteIssue(id); // Axios sends token via interceptor

      if (res.status === 200) {
        setIssue((prev) => ({
          ...prev,
          upvotes: hasUpvoted
            ? prev.upvotes.filter((uid) => uid !== userId)
            : [...prev.upvotes, userId],
        }));
        setHasUpvoted(!hasUpvoted);
      }
    } catch (error) {
      console.error("Error upvoting:", error.response?.data || error.message);
    }
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? issue.images.length - 1 : prev - 1,
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === issue.images.length - 1 ? 0 : prev + 1,
    );
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/issues/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      if (res.ok) {
        const data = await res.json();
        setIssue((prev) => ({ ...prev, status: newStatus }));
        setShowStatusDropdown(false);
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const fetchWorkers = async () => {
    setLoadingWorkers(true);
    try {
      const res = await getDistrictWorkers();
      setWorkers(res.data);
      setFilteredWorkers(res.data);
    } catch (error) {
      console.error("Error fetching workers", error);
    } finally {
      setLoadingWorkers(false);
    }
  };

  const handleOpenAssignModal = () => {
    setShowAssignModal(true);
    fetchWorkers();
  };

  const handleAssignWorker = async (workerId, workerName) => {
    setAssigningTo(workerName);
    try {
      const res = await assignIssueToWorker(id, workerId);
      if (res.data.success) {
        setIssue(res.data.issue);
        setShowAssignModal(false);
        // show success message if needed, e.g. toast
      } else {
        alert(res.data.message || "Failed to assign issue");
      }
    } catch (error) {
      console.error("Error assigning worker:", error);
      alert("Error assigning worker.");
    } finally {
      setAssigningTo(null);
    }
  };

  useEffect(() => {
    if (deptFilter === "All") {
      setFilteredWorkers(workers);
    } else {
      setFilteredWorkers(workers.filter((w) => w.department === deptFilter));
    }
  }, [deptFilter, workers]);

  const handleViewLocation = () => {
    const coords = issue.location?.coordinates;
    if (Array.isArray(coords) && coords.length === 2) {
      const [lng, lat] = coords;
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
    } else {
      alert("Location not available.");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!issue) return <div>Issue not found</div>;
  console.log(issue);

  return (
    <>
      {" "}
      <Navbar />
      <div className="issue-details-container">
        <div className="issue-main-card">
          <div className="issue-header-row2">
            <div className="status-section2">
              <span className={`status-badge1 ${issue.status}`}>
                {issue.status}
              </span>
              <span className="meta-item department-tag">
                🏷️ {issue.department}
              </span>
              <span className="meta-item assigned-to">
                Assigned:{" "}
                {issue.assignedWorker ? (
                  <span
                    className="assigned-user"
                    onClick={() =>
                      navigate(`/user/${issue.assignedWorker._id}`)
                    }
                    style={{ cursor: "pointer", textDecoration: "underline" }}
                  >
                    {issue.assignedWorker.username}
                  </span>
                ) : (
                  "Unassigned"
                )}
              </span>

              <button
                className="view-location-btn"
                onClick={handleViewLocation}
              >
                📍 View Location
              </button>
              <button
                className="assign-worker-btn"
                onClick={handleOpenAssignModal}
              >
                👷 Assign Issue
              </button>
            </div>

            <span className="issue-district2">
              {issue.location?.address?.split(",").pop()?.trim() ||
                issue.districtCode}
            </span>
          </div>

          <h1 className="issue-title">{issue.title}</h1>
          <div className="issue-image-container issue-detail-image">
            {issue.images && issue.images.length > 0 ? (
              <>
                <div className="issue-image-large">
                  <img
                    src={issue.images[currentImageIndex]}
                    alt={issue.title}
                  />
                  {issue.images.length > 1 && (
                    <>
                      <button
                        className="image-nav-button prev"
                        onClick={handlePrevImage}
                        aria-label="Previous image"
                      >
                        <FaChevronLeft />
                      </button>
                      <button
                        className="image-nav-button next"
                        onClick={handleNextImage}
                        aria-label="Next image"
                      >
                        <FaChevronRight />
                      </button>
                    </>
                  )}
                </div>
                {issue.images.length > 1 && (
                  <div className="image-indicators">
                    {issue.images.map((_, index) => (
                      <button
                        key={index}
                        className={`indicator-dot ${
                          index === currentImageIndex ? "active" : ""
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="image-placeholder">
                <FaImage />
                <span>No image available</span>
              </div>
            )}
          </div>
          <p className="issue-description">{issue.description}</p>
          <div className="issue-meta-row">
            <span className="meta-item">
              <FaMapMarkerAlt /> {issue.location?.address}
            </span>
            <span className="meta-item">
              <svg
                width="18"
                height="18"
                style={{ marginRight: 4 }}
                fill="#888"
              >
                <path d="M7 10h1V7h2v3h1v2H7v-2z" />
              </svg>
              {new Date(issue.createdAt).toLocaleString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <hr className="issue-divider" />
          <div className="issue-footer-row">
            <div className="reporter-info">
              <div className="comment-avatar" />
              <div>
                <span
                  className="comment-user"
                  onClick={() => navigate(`/user/${issue.createdBy._id}`)}
                >
                  {issue.createdBy.username}
                </span>
                <div className="reporter-role">Reporter</div>
              </div>
            </div>
            <div className="issue-footer-stats">
              <span
                className={`upvote-button ${hasUpvoted ? "active" : ""}`}
                onClick={handleUpvote}
              >
                {hasUpvoted ? <FaThumbsUp /> : <FaRegThumbsUp />}{" "}
                {issue.upvotes?.length || 0}
              </span>
              <span>
                <FaCommentDots /> {issue.comments?.length || 0}
              </span>
            </div>
          </div>
        </div>
        <div className="issue-details-comments">
          <div className="comments-header">
            <FaCommentDots style={{ marginRight: 8 }} />
            <span>
              Comments {issue.comments ? `(${issue.comments.length})` : ""}
            </span>
          </div>
          <div className="comments-list">
            {issue.comments && issue.comments.length > 0 ? (
              issue.comments.map((c, idx) => (
                <div key={idx} className="comment-block">
                  <div className="comment-avatar" />
                  <div className="comment-content">
                    <div className="comment-meta">
                      <span
                        className="comment-user"
                        onClick={() => navigate(`/user/${c.user._id}`)}
                      >
                        {c.user.username}
                      </span>
                      <span className="comment-date">
                        {new Date(c.createdAt).toLocaleString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="comment-text">{c.text}</div>
                  </div>
                </div>
              ))
            ) : (
              <div>No comments yet.</div>
            )}
          </div>
          <form className="comment-form" onSubmit={handleCommentSubmit}>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              required
              rows={3}
            />
            <button type="submit">
              <span style={{ marginRight: 6, display: "inline-block" }}>
                <svg width="18" height="18" fill="currentColor">
                  <path d="M2 16l14-7L2 2v5l10 2-10 2z" />
                </svg>
              </span>
              Post Comment
            </button>
          </form>
        </div>
      </div>
      {showAssignModal && (
        <div className="assign-modal-overlay">
          {assigningTo ? (
            <div className="assign-modal-content loading-view">
              <div className="spinner"></div>
              <h2>Assigning issue to {assigningTo}...</h2>
            </div>
          ) : (
            <div className="assign-modal-content">
              <div className="modal-header">
                <h2>Assign Worker</h2>
                <button
                  className="close-modal-icon"
                  onClick={() => setShowAssignModal(false)}
                >
                  <FaTimes />
                </button>
              </div>
              <div className="modal-filter">
              <label>Filter by Department:</label>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
              >
                <option value="All">All Departments</option>
                {[...new Set(workers.map((w) => w.department))].map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <div className="workers-list-container">
              {loadingWorkers ? (
                <p>Loading workers...</p>
              ) : filteredWorkers.length > 0 ? (
                <div className="workers-table">
                  <div className="workers-table-header">
                    <span>Name</span>
                    <span>Department</span>
                    <span>Solved</span>
                    <span>Unsolved</span>
                    <span>Action</span>
                  </div>
                  {filteredWorkers.map((worker) => (
                    <div key={worker.id} className="worker-row">
                      <span
                        className="worker-name"
                        onClick={() => navigate(`/user/${worker.id}`)}
                      >
                        {worker.name}
                      </span>
                      <span className="worker-dept">{worker.department}</span>
                      <span className="worker-stat solved">
                        {worker.solvedIssues}
                      </span>
                      <span className="worker-stat unsolved">
                        {worker.unsolvedIssues}
                      </span>
                      <button
                        className="assign-action-btn"
                        onClick={() => handleAssignWorker(worker.id, worker.name)}
                      >
                        Assign
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No workers found.</p>
              )}
            </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default AdminIssueDetails;
