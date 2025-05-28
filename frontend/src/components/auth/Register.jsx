import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaBuilding } from 'react-icons/fa';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    employeeId: '',
    districtCode: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      // Create request body based on role
      const requestBody = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role
      };

      // Add admin-specific fields if role is admin
      if (formData.role === 'admin') {
        requestBody.employeeId = formData.employeeId;
        requestBody.districtCode = formData.districtCode;
      }

      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to register. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create Account</h2>
        <p className="auth-subtitle">Sign up to start reporting issues</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Username field */}
          <div className="form-group">
            <div className="input-icon">
              <FaUser />
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Email field */}
          <div className="form-group">
            <div className="input-icon">
              <FaEnvelope />
              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Role selection */}
          <div className="form-group">
            <div className="input-icon">
              <FaUser />
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="role-select"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Conditional admin fields */}
          {formData.role === 'admin' && (
            <>
              <div className="form-group">
                <div className="input-icon">
                  <FaBuilding />
                  <input
                    type="text"
                    name="employeeId"
                    placeholder="Employee ID"
                    value={formData.employeeId}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="input-icon">
                  <FaBuilding />
                  <input
                    type="text"
                    name="districtCode"
                    placeholder="District Code (e.g., MH 24)"
                    value={formData.districtCode}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </>
          )}

          {/* Password fields */}
          <div className="form-group">
            <div className="input-icon">
              <FaLock />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-icon">
              <FaLock />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button type="submit" className="auth-button">
            Create Account
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;