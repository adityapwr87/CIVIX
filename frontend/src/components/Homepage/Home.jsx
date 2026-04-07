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
import { statesAndDistricts } from "../../utils/statesAndDistricts";

const Home = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filteredIssues, setFilteredIssues] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [districtOptions, setDistrictOptions] = useState([]);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const toKey = (value) => (value || "").trim().toLowerCase();

  useEffect(() => {
    detectAndSetLocation();
  }, []);

  useEffect(() => {
    if (!selectedState) {
      setDistrictOptions([]);
      setSelectedDistrict("");
      return;
    }

    const stateData = statesAndDistricts.find(
      (entry) => entry.state === selectedState,
    );
    const nextDistricts = stateData?.districts || [];
    setDistrictOptions(nextDistricts);

    if (selectedDistrict && !nextDistricts.includes(selectedDistrict)) {
      setSelectedDistrict("");
    }
  }, [selectedState]);

  const detectAndSetLocation = () => {
    if (!navigator.geolocation) {
      fetchIssues();
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
          );
          const data = await response.json();
          const address = data?.address || {};

          const detectedStateRaw =
            address.state ||
            address["ISO3166-2-lvl4"] ||
            address.union_territory ||
            "";
          const detectedDistrictRaw =
            address.county ||
            address.state_district ||
            address.city_district ||
            address.city ||
            "";

          const matchedState = statesAndDistricts.find(
            (entry) => toKey(entry.state) === toKey(detectedStateRaw),
          );

          if (matchedState) {
            const matchedDistrict = matchedState.districts.find(
              (district) => toKey(district) === toKey(detectedDistrictRaw),
            );

            setSelectedState(matchedState.state);
            setSelectedDistrict(matchedDistrict || "");
            fetchIssues(matchedState.state, matchedDistrict || "");
          } else {
            fetchIssues();
          }
        } catch (locationError) {
          console.error("Failed to detect location:", locationError);
          fetchIssues();
        } finally {
          setDetectingLocation(false);
        }
      },
      () => {
        setDetectingLocation(false);
        fetchIssues();
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const fetchIssues = async (state = "", districtName = "") => {
    try {
      setLoading(true);
      setError(null);

      const response = await getAllIssues({
        state,
        districtName,
      });
      setFilteredIssues(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setLoading(false);
    }
  };

  const handleManualSearch = () => {
    fetchIssues(selectedState, selectedDistrict);
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
            <button
              onClick={() => fetchIssues(selectedState, selectedDistrict)}
              className="retry-btn"
            >
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

            {/* Location Search */}
            <div className="filters-bar">
              <div className="search-wrapper" style={{ minWidth: "100%" }}>
                <h4 style={{ marginBottom: "10px", color: "#1f2937" }}>
                  Search issues at your location
                </h4>
                {detectingLocation && (
                  <p style={{ marginBottom: "10px", color: "#6b7280" }}>
                    Detecting your location...
                  </p>
                )}
              </div>

              <div className="select-wrapper">
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="filter-select"
                >
                  <option value="">Select State</option>
                  {statesAndDistricts.map((entry) => (
                    <option key={entry.state} value={entry.state}>
                      {entry.state}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="filter-select"
                  disabled={!selectedState}
                >
                  <option value="">Select District</option>
                  {districtOptions.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>

                <button className="retry-btn" onClick={handleManualSearch}>
                  Search
                </button>
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
