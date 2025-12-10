// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

// GLOBAL STATE
import { AppProvider } from "./pages/AppContext";

// PAGES
import AdminDashboard from "./pages/AdminDashboard";
import SalesRecords from "./pages/SalesRecords";
import Home from "./pages/Home";
import Bill from "./pages/Bill";

// CSS
import "./App.css";

function App() {
  const role = "admin"; // your static role system

  return (
    <AppProvider>
      <Router>
        <div className="app">
          <Navbar role={role} />

          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/home" element={<Home />} />
            <Route path="/salesrecords" element={<SalesRecords />} />
            <Route path="/bill" element={<Bill />} />
          </Routes>
        </div>
      </Router>
    </AppProvider>
  );
}

// ---------------- NAVBAR ----------------
function Navbar({ role }) {
  return (
    <nav className="navbar">
      <h2>ShreeMohan Enterprise</h2>

      {role === "admin" && (
        <div className="nav-links">
          <Link to="/admin-dashboard">Dashboard</Link>
          <Link to="/home">Products</Link>
          <Link to="/salesrecords">Sales Records</Link>
          <Link to="/bill">Billing</Link>
        </div>
      )}
    </nav>
  );
}

export default App;
