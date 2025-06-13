const jwt = require('jsonwebtoken');

class TokenManager {
  static generateAccessToken(user) {
    const payload = {
      id: user._id,
      role: user.role,
      username: user.username || user.name,
      timestamp: Date.now()
    };

    const options = {
      expiresIn: process.env.JWT_EXPIRATION || '1h',
      algorithm: 'HS256',
      issuer: 'CIVIX-backend'
    };

    return jwt.sign(payload, process.env.JWT_SECRET, options);
  }

  static generateRefreshToken(user) {
    const payload = {
      id: user._id,
      role: user.role,
      tokenVersion: user.tokenVersion || 0
    };

    const options = {
      expiresIn: '7d',
      algorithm: 'HS256',
      issuer: 'CIVIX-backend'
    };

    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, options);
  }

  static verifyToken(token, isRefreshToken = false) {
    try {
      const secret = isRefreshToken ? 
        process.env.REFRESH_TOKEN_SECRET : 
        process.env.JWT_SECRET;

      return jwt.verify(token, secret, {
        algorithms: ['HS256'],
        issuer: 'CIVIX-backend'
      });
    } catch (error) {
      console.error(`Token verification failed: ${error.message}`);
      return null;
    }
  }

  static decodeToken(token) {
    try {
      return jwt.decode(token, { complete: true });
    } catch (error) {
      console.error(`Token decode failed: ${error.message}`);
      return null;
    }
  }
}

module.exports = TokenManager;