import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Report.css';

const Report = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    images: [],
    coordinates: [],
    address: '',
    districtCode: ''
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // India center

  useEffect(() => {
    // Get user's location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
          handleLocationSelect([longitude, latitude]);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setError("Please enable location access to report an issue");
        }
      );
    }
  }, []);

  const handleLocationSelect = async (coords) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:5000/api/geocode/reverse-geocode?lat=${coords[1]}&lon=${coords[0]}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch address');
      const data = await response.json();

      setFormData(prev => ({
        ...prev,
        coordinates: coords,
        address: data.display_name || ''
      }));
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to get address');
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);
    setFormData(prev => ({
      ...prev,
      images: files.map(file => URL.createObjectURL(file))
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('districtCode', formData.districtCode);
      formDataToSend.append('location', JSON.stringify({
        type: 'Point',
        coordinates: formData.coordinates
      }));

      imageFiles.forEach(file => {
        formDataToSend.append('images', file);
      });

      const response = await fetch('http://localhost:5000/api/issues', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit report');
      }

      const result = await response.json();
      navigate(`/issue/${result._id}`);
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-container">
      <h2>Report an Issue</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="report-form">
        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            required
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            required
          />
        </div>

        <div className="form-group">
          <label>District Code</label>
          <input
            type="text"
            value={formData.districtCode}
            onChange={(e) => setFormData(prev => ({ ...prev, districtCode: e.target.value }))}
            required
          />
        </div>

        <div className="form-group">
          <label>Images</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
          />
          <div className="image-preview">
            {formData.images.map((url, index) => (
              <img key={index} src={url} alt={`Preview ${index + 1}`} />
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Location</label>
          <div className="map-container">
            <MapContainer
              center={mapCenter}
              zoom={13}
              style={{ height: '400px', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {formData.coordinates.length > 0 && (
                <Marker position={[formData.coordinates[1], formData.coordinates[0]]} />
              )}
              <LocationMarker onLocationSelect={handleLocationSelect} />
            </MapContainer>
          </div>
          {formData.address && (
            <div className="selected-location">
              Selected location: {formData.address}
            </div>
          )}
        </div>

        <button 
          type="submit" 
          disabled={loading || !formData.coordinates.length}
          className="submit-button"
        >
          {loading ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
};

function LocationMarker({ onLocationSelect }) {
  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onLocationSelect([lng, lat]);
    }
  });
  return null;
}

export default Report;
