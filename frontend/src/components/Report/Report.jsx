import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { FaMapMarkerAlt } from "react-icons/fa";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./Report.css";
import Navbar from "../Navbar/Navbar";
// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

function MapCenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center);
    }
  }, [center, map]);
  return null;
}

function LocationMarker({ defaultLocation, onLocationSelect }) {
  const [position, setPosition] = useState(null);
  const map = useMap();

  // Function to get address from coordinates
  const getAddressFromCoordinates = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await response.json();
      return data.display_name;
    } catch (error) {
      console.error("Error fetching address:", error);
      return "";
    }
  };

  useEffect(() => {
    if (defaultLocation) {
      const newPos = [defaultLocation.lat, defaultLocation.lng];
      setPosition(newPos);
      map.setView(newPos, 15);

      // Get and set initial address
      getAddressFromCoordinates(defaultLocation.lat, defaultLocation.lng).then(
        (address) =>
          onLocationSelect([defaultLocation.lng, defaultLocation.lat], address)
      );
    }
  }, [defaultLocation, map]);

  useMap().on("click", async (e) => {
    const newPosition = [e.latlng.lat, e.latlng.lng];
    setPosition(newPosition);

    // Get address when location is clicked
    const address = await getAddressFromCoordinates(e.latlng.lat, e.latlng.lng);
    onLocationSelect([e.latlng.lng, e.latlng.lat], address);
  });

  return position ? <Marker position={position} /> : null;
}

const Report = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    images: [],
    coordinates: [],
    address: "",
    districtCode: "",
  });

  const [imageFiles, setImageFiles] = useState([]); // <-- Add this
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [defaultLocation, setDefaultLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([18.5204, 73.8567]); // Default to Pune
  const mapRef = useRef(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = { lat: latitude, lng: longitude };
          setDefaultLocation(newLocation);
          setMapCenter([latitude, longitude]);
          setFormData((prev) => ({
            ...prev,
            coordinates: [longitude, latitude],
          }));
        },
        (error) => {
          console.error("Error getting location:", error);
          setDefaultLocation({ lat: 18.5204, lng: 73.8567 }); // Default to Pune
        }
      );
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Update handleLocationSelect to accept address
  const handleLocationSelect = (coordinates, address) => {
    setFormData((prev) => ({
      ...prev,
      coordinates,
      address: address || prev.address, // Update address if provided
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files); // Save files for submission
    setFormData((prev) => ({
      ...prev,
      images: files.map((file) => URL.createObjectURL(file)), // For preview only
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");

      if (
        !formData.title ||
        !formData.description ||
        !formData.coordinates ||
        !formData.districtCode
      ) {
        throw new Error("Please fill all required fields");
      }

      // Use FormData for file upload
      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("coordinates", JSON.stringify(formData.coordinates));
      data.append("address", formData.address);
      data.append("districtCode", formData.districtCode);
      imageFiles.forEach((file) => data.append("images", file));

      const response = await fetch("http://localhost:5000/api/issues", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: data,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to submit issue");
      }

      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-page">
      <Navbar />
      <div className="report-page-container">
        <div className="report-page-content">
          <h1 className="report-page-title">Report an Issue</h1>
          <p className="report-page-subtitle">
            Help improve your community by reporting local problems
          </p>

          <form onSubmit={handleSubmit} className="report-page-form">
            <div className="report-page-section">
              <h2 className="report-section-title">Issue Details</h2>

              <div className="report-input-group">
                <label htmlFor="title">Issue Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Brief description of the problem"
                  required
                />
              </div>

              <div className="report-input-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Provide detailed information about the issue"
                  rows="4"
                  required
                />
              </div>

              <div className="report-input-group">
                <label htmlFor="districtCode">District Code *</label>
                <input
                  type="text"
                  id="districtCode"
                  name="districtCode"
                  value={formData.districtCode}
                  onChange={handleInputChange}
                  placeholder="Enter district code (e.g. MH 24)"
                  required
                />
              </div>

              <div className="report-input-group">
                <label htmlFor="address">Location *</label>
                <div className="report-location-wrapper">
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Select location on map"
                    readOnly
                    required
                  />
                  <button
                    type="button"
                    className="report-map-toggle"
                    onClick={() => setShowMap(!showMap)}
                  >
                    <FaMapMarkerAlt /> Pick Location on Map
                  </button>
                </div>
                {showMap && (
                  <div className="report-map-wrapper">
                    <MapContainer
                      center={mapCenter}
                      zoom={15}
                      style={{ height: "400px", width: "100%" }}
                      ref={mapRef}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <LocationMarker
                        defaultLocation={defaultLocation}
                        onLocationSelect={handleLocationSelect}
                      />
                    </MapContainer>
                  </div>
                )}
              </div>

              <div className="report-input-group">
                <label htmlFor="images">Images</label>
                <input
                  type="file"
                  id="images"
                  name="images"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="report-file-input"
                />
                <small className="report-helper-text">
                  You can upload multiple images (optional)
                </small>
                <div className="report-image-preview">
                  {formData.images?.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`preview-${idx}`}
                      className="report-preview-image"
                    />
                  ))}
                </div>
              </div>
            </div>

            {error && <div className="report-error">{error}</div>}

            <div className="report-actions">
              <button
                type="submit"
                className="report-submit"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Report;
