// src/App.js
import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Home from "./pages/Home";
import { AppProvider, AppContext } from "./pages/AppContext";
import AdminDashboard from "./pages/AdminDashboard";
import SalesRecords from "./pages/SalesRecords";
import Bill from "./pages/Bill";
import ProtectedRoute from "./pages/ProtectedRoute";
import "./App.css";

function App() {
  return (
    <AppProvider>
      <Router>
        <MainApp />
      </Router>
    </AppProvider>
  );
}

function MainApp() {
  const { isLoggedIn, logout, loading } = useContext(AppContext);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="app">
      {/* Navbar only shows if logged in */}
      {isLoggedIn && <Navbar onLogout={logout} />}

      <Routes>
        {/* Login page: redirect to dashboard if already logged in */}
        <Route
          path="/login"
          element={
            isLoggedIn ? (
              <Navigate to="/admin-dashboard" replace />
            ) : (
              <LoginPage />
            )
          }
        />

        <Route
          path="/"
          element={
            isLoggedIn ? (
              <Navigate to="/admin-dashboard" replace />
            ) : (
              <LoginPage />
            )
          }
        />

        {/* Protected Routes */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/salesrecords"
          element={
            <ProtectedRoute>
              <SalesRecords />
            </ProtectedRoute>
          }
        />

        <Route
          path="/bill"
          element={
            <ProtectedRoute>
              <Bill />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

// ---------------- NAVBAR ----------------
function Navbar({ onLogout }) {
  return (
    <nav className="navbar">
      <h2>ShreeMohan Enterprise</h2>
      <div className="nav-links">
        <Link to="/admin-dashboard">Dashboard</Link>
        <Link to="/home">Products</Link>
        <Link to="/salesrecords">Sales Records</Link>
        <Link to="/bill">Billing</Link>
        <button 
          onClick={onLogout}
          style={{
            marginLeft: '20px',
            padding: '8px 16px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default App;