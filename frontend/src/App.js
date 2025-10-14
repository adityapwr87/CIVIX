import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
<<<<<<< HEAD
} from "react-router-dom";
=======
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

>>>>>>> 03c33b1d7f5bf1dd44c178c7709544e34bb80594
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
<<<<<<< HEAD

// Reusable Protected Route component
=======
import Notifications from "./components/Notification/Notifications";

import { socket } from "./socket";

// ----------------------
// Protected Route
// ----------------------
>>>>>>> 03c33b1d7f5bf1dd44c178c7709544e34bb80594
const ProtectedRoute = ({ children, roles }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

<<<<<<< HEAD
  // If not logged in → redirect to login
  if (!token) return <Navigate to="/login" replace />;

  // If roles restriction exists and user doesn't match → redirect home
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
=======
  if (!token) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
>>>>>>> 03c33b1d7f5bf1dd44c178c7709544e34bb80594

  return children;
};

<<<<<<< HEAD
// Dashboard logic
=======
// ----------------------
// Dashboard Route
// ----------------------
>>>>>>> 03c33b1d7f5bf1dd44c178c7709544e34bb80594
const DashboardRoute = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return user.role === "admin" ? <AdminDashboard /> : <Home />;
};

<<<<<<< HEAD
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
=======
// ----------------------
// Main App Content
// ----------------------
function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    socket.on("new_chat_message", (data) => {
      const isOnChatPage = location.pathname.startsWith("/chat");

      if (!isOnChatPage) {
        toast.info(`New message from ${data.senderName}`, {
          position: "top-right",
          autoClose: 4000,
          hideProgressBar: false, // ✅ show progress bar
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          style: {
            border: "2px solid #d32f2f", // red border
            backgroundColor: "#fff",
            color: "#d32f2f",
            fontWeight: "500",
            borderRadius: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            padding: "12px 16px",
            fontSize: "15px",
          },
          icon: false,
          progressStyle: { background: "#d32f2f" }, // ✅ red progress bar
          onClick: () =>
  navigate("/chat", {
    state: {
      currentUser: JSON.parse(localStorage.getItem("user")),
      receiverUser: { _id: data.sender, username: data.senderName },
    },
  }),
        });

      }
    });

    return () => socket.off("new_chat_message");
  }, [location, navigate]);

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
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
          path="/notifications"
          element={
            <ProtectedRoute roles={["user", "admin"]}>
              <Notifications />
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

      {/* ✅ Toast Container */}
      <ToastContainer
        position="top-right"
        theme="light"
        hideProgressBar
        newestOnTop
        closeOnClick
        draggable
        pauseOnHover
      />
    </>
  );
}

// ----------------------
// Main App Wrapper
// ----------------------
export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
>>>>>>> 03c33b1d7f5bf1dd44c178c7709544e34bb80594
