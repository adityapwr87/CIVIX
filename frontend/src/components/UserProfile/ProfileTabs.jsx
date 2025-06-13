import React from 'react';
import { FaUser, FaListAlt, FaHistory } from 'react-icons/fa';

const ProfileTabs = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: <FaUser /> },
    { id: 'issues', label: 'Issues', icon: <FaListAlt /> },
    { id: 'activity', label: 'Activity', icon: <FaHistory /> }
  ];

  return (
    <div className="profile-tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ProfileTabs;