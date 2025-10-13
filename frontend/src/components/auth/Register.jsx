import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaBuilding,
  FaArrowLeft,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { register } from "../../services/api";
import { statesAndDistricts } from "../../utils/statesAndDistricts"; // <-- import your utils
import "./Auth.css";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
    employeeId: "",
    state: "",
    districtName: "",
  });

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // When admin changes state, reset district
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "state" ? { districtName: "" } : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      // Base request
      const requestBody = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      // Admin fields
      if (formData.role === "admin") {
        requestBody.employeeId = formData.employeeId;
        requestBody.state = formData.state;
        requestBody.districtName = formData.districtName;
      }

      const response = await register(requestBody);
      const data = response.data;

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("details", JSON.stringify(data.details));
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to register. Please try again."
      );
    }
  };

  return (
    <div className="auth-container">
      <button onClick={() => navigate("/")} className="back-home">
        <FaArrowLeft /> Back to Home
      </button>
      <div className="auth-card">
        <h2>Create Account</h2>
        <p className="auth-subtitle">Sign up to start reporting issues</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Username */}
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

          {/* Email */}
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

          {/* Admin fields */}
          {formData.role === "admin" && (
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

              {/* State dropdown */}
              <div className="form-group">
                <div className="input-icon">
                  <FaBuilding />
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select State</option>
                    {Object.keys(statesAndDistricts).map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* District dropdown */}
              {formData.state && (
                <div className="form-group">
                  <div className="input-icon">
                    <FaBuilding />
                    <select
                      name="districtName"
                      value={formData.districtName}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select District</option>
                      {statesAndDistricts[formData.state].map((district) => (
                        <option key={district} value={district}>
                          {district}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Password */}
          <div className="form-group">
            <div className="input-icon">
              <FaLock />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <div className="input-icon">
              <FaLock />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex="-1"
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-button">
            Create Account
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
