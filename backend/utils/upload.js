const multer = require("multer");

const storage = multer.memoryStorage(); // Store files in memory for direct upload to S3

const upload = multer({ storage });

module.exports = upload;