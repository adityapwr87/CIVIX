import React, { useState, useEffect } from 'react';
import { FaClipboardList, FaUsers, FaChartBar, FaMapMarkedAlt, FaCheck, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    usersCount: 0
  });
  const [recentIssues, setRecentIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      
      const data = await response.json();
      setStats(data.stats);
      setRecentIssues(data.recentIssues);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (issueId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/issues/${issueId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update status');
      
      // Refresh dashboard data
      fetchDashboardData();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <div className="stats-cards">
          <div className="stat-card total">
            <div className="stat-icon">
              <FaClipboardList />
            </div>
            <div className="stat-content">
              <h3>Total Issues</h3>
              <p>{stats.total}</p>
            </div>
          </div>
          <div className="stat-card pending">
            <div className="stat-icon">
              <FaExclamationTriangle />
            </div>
            <div className="stat-content">
              <h3>Pending</h3>
              <p>{stats.pending}</p>
            </div>
          </div>
          <div className="stat-card in-progress">
            <div className="stat-icon">
              <FaClock />
            </div>
            <div className="stat-content">
              <h3>In Progress</h3>
              <p>{stats.inProgress}</p>
            </div>
          </div>
          <div className="stat-card resolved">
            <div className="stat-icon">
              <FaCheck />
            </div>
            <div className="stat-content">
              <h3>Resolved</h3>
              <p>{stats.resolved}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="recent-issues">
          <h2>Recent Issues</h2>
          <div className="issues-table">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>District</th>
                  <th>Status</th>
                  <th>Reported On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentIssues.map(issue => (
                  <tr key={issue._id}>
                    <td>{issue._id.slice(-6)}</td>
                    <td>{issue.title}</td>
                    <td>{issue.districtCode}</td>
                    <td>
                      <select
                        value={issue.status}
                        onChange={(e) => handleStatusChange(issue._id, e.target.value)}
                        className={`status-select ${issue.status}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </td>
                    <td>{new Date(issue.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button 
                        onClick={() => window.location.href = `/issue/${issue._id}`}
                        className="view-button"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;