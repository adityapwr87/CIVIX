import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./components/Home1/Landing";
import Home from "./components/Homepage/Home";
import AdminDashboard from "./components/Admin/AdminDashboard";
import AdminIssueDetails from "./components/Admin/AdminIssueDetails";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import Report from "./components/Report/Report";
import IssueDetails from "./components/IssueDetails/IssueDetails";
import UserProfile from "./components/UserProfile/UserProfile";
import AboutUs from "./components/About/AboutUs";
import Chat from "./components/Chat/Chat";
import ChatHistory from "./components/Chat/ChatHistory";
import Profile from "./components/Profile/Profile";
function App() {
  const DashboardRoute = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const isAuthenticated = localStorage.getItem("token");

    if (!isAuthenticated) return <Navigate to="/login" />;
    return user.role === "admin" ? <AdminDashboard /> : <Home />;
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public routes */}
          <Route path="/about" element={<AboutUs />} />
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Role-based dashboard */}
          <Route path="/dashboard" element={<DashboardRoute />} />

          {/* Regular routes */}
          <Route path="/report" element={<Report />} />
          <Route path="/issue/:id" element={<IssueDetails />} />
          <Route path="/user/:userId" element={<UserProfile />} />
          <Route path="/admin/issue/:id" element={<AdminIssueDetails />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat-history" element={<ChatHistory />} />
          <Route path='profile' element={<Profile />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
