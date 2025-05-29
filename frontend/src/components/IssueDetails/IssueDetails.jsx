import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaMapMarkerAlt, FaThumbsUp, FaCommentDots, FaImage, FaRegThumbsUp } from "react-icons/fa";
import Navbar from "../Navbar/Navbar";
import "./IssueDetails.css";

const IssueDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const userId = JSON.parse(localStorage.getItem('user'))._id;

  useEffect(() => {
    fetch(`http://localhost:5000/api/issues/${id}`)
      .then(res => res.json())
      .then(data => {
        setIssue(data);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (issue) {
      setHasUpvoted(issue.upvotes.includes(userId));
    }
  }, [issue, userId]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:5000/api/issues/${id}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text: comment }),
    });
    const data = await res.json();
    if (res.ok) {
      setIssue(prev => ({
        ...prev,
        comments: [...prev.comments, data.comment],
      }));
      setComment("");
    }
  };

  const handleUpvote = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/issues/${id}/upvote`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (res.ok) {
        const data = await res.json();
        setIssue(prev => ({
          ...prev,
          upvotes: hasUpvoted 
            ? prev.upvotes.filter(id => id !== userId)
            : [...prev.upvotes, userId]
        }));
        setHasUpvoted(!hasUpvoted);
      }
    } catch (error) {
      console.error("Error upvoting:", error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!issue) return <div>Issue not found</div>;

  return (
    <>
      <Navbar />
      <div className="issue-details-container">
        <div className="issue-main-card">
          <div className="issue-header-row">
            <span className={`status-badge ${issue.status}`}>{issue.status}</span>
            <span className="issue-district">{issue.location?.address?.split(",").pop()?.trim() || issue.districtCode}</span>
          </div>
          <h1 className="issue-title">{issue.title}</h1>
          <div className="issue-image-large">
            {issue.images && issue.images.length > 0 ? (
              <img src={issue.images[0]} alt={issue.title} />
            ) : (
              <div className="image-placeholder">
                <FaImage />
              </div>
            )}
          </div>
          <p className="issue-description">{issue.description}</p>
          <div className="issue-meta-row">
            <span className="meta-item">
              <FaMapMarkerAlt /> {issue.location?.address}
            </span>
            <span className="meta-item">
              <svg width="18" height="18" style={{marginRight: 4}} fill="#888"><path d="M7 10h1V7h2v3h1v2H7v-2z"/></svg>
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
                className={`upvote-button ${hasUpvoted ? 'active' : ''}`}
                onClick={handleUpvote}
              >
                {hasUpvoted ? <FaThumbsUp /> : <FaRegThumbsUp />} {issue.upvotes?.length || 0}
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
              onChange={e => setComment(e.target.value)}
              placeholder="Add a comment..."
              required
              rows={3}
            />
            <button type="submit">
              <span style={{ marginRight: 6, display: "inline-block" }}>
                <svg width="18" height="18" fill="currentColor"><path d="M2 16l14-7L2 2v5l10 2-10 2z"/></svg>
              </span>
              Post Comment
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default IssueDetails;