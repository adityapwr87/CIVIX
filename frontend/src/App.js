import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./components/Home1/Landing";
import Home from "./components/Homepage/Home";
import AdminDashboard from "./components/Admin_dashboard/Admindashboard";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import Report from './components/Report/Report';
import Navbar from './components/Navbar/Navbar';

const AuthenticatedLayout = ({ children }) => {
  return (
    <>
      <Navbar />
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
        </Routes>
      </div>
    </Router>
  );
}

export default App;
