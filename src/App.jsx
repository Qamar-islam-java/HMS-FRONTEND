// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
// We will create these pages next
import ReceptionistBooking from './pages/Receptionist/Booking'; 
import DoctorDashboard from './pages/Doctor/Dashboard'; 
import NurseVitals from './pages/Nurse/Vitals';
import PharmacyDashboard from './pages/Pharmacy/Dashboard';

// Protected Route Component
const ProtectedRoute = ({ children, role }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" />;
  if (role && !user.role.includes(role)) return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route 
            path="/receptionist/booking" 
            element={
              <ProtectedRoute role="RECEPTIONIST">
                <ReceptionistBooking />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/doctor/dashboard" 
            element={
              <ProtectedRoute role="DOCTOR">
                 <DoctorDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/nurse/vitals" 
            element={
              <ProtectedRoute role="NURSE">
                <NurseVitals />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/pharmacy/dashboard" 
            element={
              <ProtectedRoute role="PHARMACIST">
                <PharmacyDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;