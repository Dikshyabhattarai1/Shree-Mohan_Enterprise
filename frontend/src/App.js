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
  const { isLoggedIn, setIsLoggedIn } = useContext(AppContext);

  return (
    <div className="app">
      {/* Navbar only shows if logged in */}
      {isLoggedIn && <Navbar />}

      <Routes>
        {/* Login page: redirect to dashboard if already logged in */}
        <Route
          path="/login"
          element={
            isLoggedIn ? (
              <Navigate to="/admin-dashboard" replace />
            ) : (
              <LoginPage onLoginSuccess={() => setIsLoggedIn(true)} />
            )
          }
        />
        <Route
          path="/"
          element={
            isLoggedIn ? (
              <Navigate to="/admin-dashboard" replace />
            ) : (
              <LoginPage onLoginSuccess={() => setIsLoggedIn(true)} />
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
function Navbar() {
  return (
    <nav className="navbar">
      <h2>ShreeMohan Enterprise</h2>
      <div className="nav-links">
        <Link to="/admin-dashboard">Dashboard</Link>
        <Link to="/home">Products</Link>
        <Link to="/salesrecords">Sales Records</Link>
        <Link to="/bill">Billing</Link>
      </div>
    </nav>
  );
}

export default App;
