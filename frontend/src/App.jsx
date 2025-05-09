import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import LeaveManagement from './pages/LeaveManagement';
import EmployeeManagement from './pages/EmployeeManagement';
import { ToastContainer } from 'react-toastify';
import PendingApprovals from './pages/PendingApprovals';
import Profile from './pages/Profile';
import Calendar from './pages/Calendar';
import Layout from './components/Layout';
import { ONLY_HR, MANAGER_DIRECTOR_HR } from './constants/constant';

// Protected Route component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/leaves"
            element={
              <ProtectedRoute>
                <Layout>
                  <LeaveManagement />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/pending-approvals"
            element={
              <ProtectedRoute allowedRoles={MANAGER_DIRECTOR_HR}>
                <Layout>
                  <PendingApprovals />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/employees"
            element={
              <ProtectedRoute allowedRoles={ONLY_HR}>
                <Layout>
                  <EmployeeManagement />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/calendar"
            element={
              <ProtectedRoute allowedRoles={MANAGER_DIRECTOR_HR}>
                <Layout>
                  <Calendar />
                </Layout>
              </ProtectedRoute>
            }
          />
          
        </Routes>
      </Router>
      <ToastContainer autoClose={3000} position='top-right' />
    </AuthProvider>
  );
};

export default App; 