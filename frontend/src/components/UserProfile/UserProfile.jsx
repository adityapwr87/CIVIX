import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import ProfileHeader from './ProfileHeader';
import ProfileTabs from './ProfileTabs';
import ProfileContent from './ProfileContent';
import './UserProfile.css';

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useUser();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const targetUserId = userId || JSON.parse(localStorage.getItem('user'))?.id;

        if (!targetUserId) {
          throw new Error('No user ID available');
        }

        const response = await fetch(`http://localhost:5000/api/users/${targetUserId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('User not found');
          }
          throw new Error(`Server error: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Server returned invalid response format');
        }

        const userData = await response.json();

        const issuesResponse = await fetch(`http://localhost:5000/api/issues/user/${targetUserId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        let issuesData = [];
        if (issuesResponse.ok) {
          issuesData = await issuesResponse.json();
        } else {
          console.warn('Failed to fetch user issues:', issuesResponse.statusText);
        }

        setProfileData({
          user: {
            ...userData,
            id: targetUserId
          },
          issues: issuesData,
          activities: issuesData?.map(issue => ({
            type: 'issue',
            title: issue.title,
            status: issue.status,
            timestamp: issue.createdAt
          })) || []
        });
      } catch (error) {
        console.error('Profile fetch error:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userId, navigate, currentUser]);

  if (loading) return <div className="profile-loading">Loading profile...</div>;
  if (error) return <div className="profile-error">{error}</div>;
  if (!profileData) return <div className="profile-error">Profile not found</div>;

  return (
    <div className="profile-container">
      <ProfileHeader user={profileData.user} />
      <ProfileTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      <ProfileContent 
        activeTab={activeTab}
        user={profileData.user}
        issues={profileData.issues}
        activities={profileData.activities}
      />
    </div>
  );
};

export default UserProfile;