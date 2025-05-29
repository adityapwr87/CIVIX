require("dotenv").config(); // <-- Move this to the very top

const http = require("http");
const connectDB = require("./config/db");
const app = require("./app");

connectDB();

const server = http.createServer(app);

// Later you'll add socket.io logic here

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
