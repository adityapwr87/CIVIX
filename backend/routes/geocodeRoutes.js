const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/authMiddleware');

router.get('/reverse-geocode', protect, async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse`,
      {
        params: {
          lat,
          lon,
          format: 'json'
        },
        headers: {
          'User-Agent': 'CIVIX/1.0'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({ message: 'Failed to get address' });
  }
});

module.exports = router;