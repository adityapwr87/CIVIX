import React from 'react';
import { FaCheckCircle } from 'react-icons/fa';

const ProfileHeader = ({ user }) => {
  return (
    <div className="profile-header">
      <div className="profile-avatar">
        {user.name?.charAt(0).toUpperCase() || 'U'}
      </div>
      <div className="profile-info">
        <h2>{user.name}</h2>
        <div className="profile-meta">
          <span className={`verification-badge ${user.isVerified ? 'verified' : ''}`}>
            <FaCheckCircle /> {user.isVerified ? 'Verified User' : 'Pending Verification'}
          </span>
          <span className="district-badge">
            District: {user.districtCode}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;