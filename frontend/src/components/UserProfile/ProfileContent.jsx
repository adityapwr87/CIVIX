import React from 'react';
import { FaEnvelope, FaPhone, FaCalendar } from 'react-icons/fa';

const ProfileContent = ({ activeTab, user, issues, activities }) => {
  const renderPersonalInfo = () => (
    <div className="personal-info">
      <div className="info-card">
        <h3>Personal Details</h3>
        <div className="info-item">
          <FaEnvelope />
          <span>{user.email}</span>
        </div>
        <div className="info-item">
          <FaPhone />
          <span>{user.phone || 'No phone number added'}</span>
        </div>
        <div className="info-item">
          <FaCalendar />
          <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );

  const renderIssues = () => (
    <div className="user-issues">
      <div className="issues-grid">
        {issues?.map(issue => (
          <div key={issue._id} className="issue-card">
            <span className={`status-badge ${issue.status}`}>
              {issue.status}
            </span>
            <h4>{issue.title}</h4>
            <p>{issue.description}</p>
            <div className="issue-footer">
              <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
        {!issues?.length && (
          <p className="no-data">No issues reported yet</p>
        )}
      </div>
    </div>
  );

  const renderActivity = () => (
    <div className="activity-log">
      <div className="timeline">
        {activities?.map((activity, index) => (
          <div key={index} className="timeline-item">
            <div className="timeline-date">
              {new Date(activity.timestamp).toLocaleDateString()}
            </div>
            <div className="timeline-content">
              <h4>{activity.title}</h4>
              <p>{activity.description}</p>
            </div>
          </div>
        ))}
        {!activities?.length && (
          <p className="no-data">No recent activity</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="profile-content">
      {activeTab === 'personal' && renderPersonalInfo()}
      {activeTab === 'issues' && renderIssues()}
      {activeTab === 'activity' && renderActivity()}
    </div>
  );
};

export default ProfileContent;