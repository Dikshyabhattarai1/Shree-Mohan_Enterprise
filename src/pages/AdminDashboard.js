// src/pages/AdminDashboard.js
import React from "react";
import "./AdminDashboard.css";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const AdminDashboard = () => {

  // ------------------- GRAPH DATA -------------------
  const chartData = [
    { month: "Jan", sales: 200 },
    { month: "Feb", sales: 350 },
    { month: "Mar", sales: 300 },
    { month: "Apr", sales: 500 },
    { month: "May", sales: 450 },
  ];

  return (
    <div className="admin-dashboard">

      <h2 className="main-title">Admin Dashboard</h2>

      {/* ---- GRAPH ---- */}
      <div className="chart-box">
        <h3>Sales Overview</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <Line type="monotone" dataKey="sales" stroke="#0084ff" strokeWidth={3} />
            <CartesianGrid stroke="#ccc" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};

export default AdminDashboard;
