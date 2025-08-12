import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
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
import AdminProfile from "./components/Profile/AdminProfile";

// Reusable Protected Route component
const ProtectedRoute = ({ children, roles }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // If not logged in → redirect to login
  if (!token) return <Navigate to="/login" replace />;

  // If roles restriction exists and user doesn't match → redirect home
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Dashboard logic
const DashboardRoute = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return user.role === "admin" ? <AdminDashboard /> : <Home />;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={["admin", "user"]}>
                <DashboardRoute />
              </ProtectedRoute>
            }
          />

          <Route
            path="/report"
            element={
              <ProtectedRoute roles={["user"]}>
                <Report />
              </ProtectedRoute>
            }
          />

          <Route
            path="/issue/:id"
            element={
              <ProtectedRoute roles={["user", "admin"]}>
                <IssueDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/user/:userId"
            element={
              <ProtectedRoute roles={["user", "admin"]}>
                <UserProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/issue/:id"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminIssueDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/chat"
            element={
              <ProtectedRoute roles={["user", "admin"]}>
                <Chat />
              </ProtectedRoute>
            }
          />

          <Route
            path="/chat-history"
            element={
              <ProtectedRoute roles={["user", "admin"]}>
                <ChatHistory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute roles={["user"]}>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminProfile />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;