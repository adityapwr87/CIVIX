const NodeCache = require('node-cache');
const adminsCache = new NodeCache({ stdTTL: 60 }); // Cache for 60 seconds

const cacheActiveAdmins = async (req, res, next) => {
  try {
    const cachedAdmins = adminsCache.get('activeAdmins');
    if (cachedAdmins) {
      return res.json(cachedAdmins);
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { adminsCache, cacheActiveAdmins };