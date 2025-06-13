import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./components/Home1/Landing";
import Home from "./components/Homepage/Home";
import AdminDashboard from "./components/Admin_dashboard/AdminDashboard";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import Report from './components/Report/Report';
import Navbar from './components/Navbar/Navbar';
import IssueDetails from './components/IssueDetails/IssueDetails';
import UserProfile from './components/UserProfile/UserProfile';
import ChatContainer from './components/Chat/ChatContainer';
import ErrorBoundary from './components/ErrorBoundary';
import { ChatProvider } from './context/ChatContext';
import { UserProvider } from './context/UserContext';

const AuthenticatedLayout = ({ children }) => {
  // Get user data from localStorage
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  
  return (
    <>
      <Navbar username={userData.username} />
      <div className="authenticated-content">
        {children}
      </div>
    </>
  );
};

function App() {
  const PrivateRoute = ({ children }) => {
    const isAuthenticated = localStorage.getItem('token');
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  const RoleBasedRoute = ({ children }) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.role) return <Navigate to="/login" />;
    
    return user.role === 'admin' ? <AdminDashboard /> : <Home />;
  };

  return (
    <ErrorBoundary>
      <ChatProvider>
        <UserProvider>
          <Router>
            <div className="App">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route 
                  path="/dashboard" 
                  element={
                    <PrivateRoute>
                      <AuthenticatedLayout>
                        <RoleBasedRoute />
                      </AuthenticatedLayout>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/report" 
                  element={
                    <PrivateRoute>
                      <AuthenticatedLayout>
                        <Report />
                      </AuthenticatedLayout>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/chat" 
                  element={
                    <PrivateRoute>
                      <AuthenticatedLayout>
                        <ErrorBoundary>
                          <ChatContainer listMode={true} />
                        </ErrorBoundary>
                      </AuthenticatedLayout>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/issue/:issueId/chat" 
                  element={
                    <PrivateRoute>
                      <AuthenticatedLayout>
                        <ErrorBoundary>
                          <ChatContainer />
                        </ErrorBoundary>
                      </AuthenticatedLayout>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/issue/:id" 
                  element={
                    <PrivateRoute>
                      <AuthenticatedLayout>
                        <IssueDetails />
                      </AuthenticatedLayout>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/user/:userId" 
                  element={
                    <PrivateRoute>
                      <AuthenticatedLayout>
                        <UserProfile />
                      </AuthenticatedLayout>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <PrivateRoute>
                      <AuthenticatedLayout>
                        <UserProfile />
                      </AuthenticatedLayout>
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/profile/:userId" 
                  element={
                    <PrivateRoute>
                      <AuthenticatedLayout>
                        <UserProfile />
                      </AuthenticatedLayout>
                    </PrivateRoute>
                  } 
                />
              </Routes>
            </div>
          </Router>
        </UserProvider>
      </ChatProvider>
    </ErrorBoundary>
  );
}

export default App;
