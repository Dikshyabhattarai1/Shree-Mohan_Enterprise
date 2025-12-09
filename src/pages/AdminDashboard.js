/* --- FULL FIXED FILE BELOW --- */

// src/pages/AdminDashboard.js
import React, { useContext, useState } from "react";
import "./AdminDashboard.css";
import { AppContext } from "./AppContext";

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
  const { orders, setOrders, salesRecords, setSalesRecords } =
    useContext(AppContext);

  const [newOrder, setNewOrder] = useState({
    id: "",
    customer: "",
    total: "",
    status: "Pending",
  });

  const [showAddOrder, setShowAddOrder] = useState(false);

  // ------------------- UPDATE ORDER -------------------
  const updateOrderField = (index, field, value) => {
    const updated = [...orders];

    const previousStatus = updated[index].status;
    updated[index][field] = value;
    setOrders(updated);

    // SALES COUNT AUTO UPDATE
    if (field === "status" && value === "Shipped" && previousStatus !== "Shipped") {
      const newSale = {
        productName: "Order " + updated[index].id,
        quantity: 1,
        price: updated[index].total,
        total: updated[index].total,
        date: new Date().toISOString().split("T")[0],
      };
      setSalesRecords([...salesRecords, newSale]);
    }
  };

  // ------------------- ADD NEW ORDER -------------------
  const addNewOrder = () => {
    if (!newOrder.id || !newOrder.customer || !newOrder.total) {
      alert("Please fill all fields!");
      return;
    }

    setOrders([...orders, newOrder]);
    setNewOrder({ id: "", customer: "", total: "", status: "Pending" });
    setShowAddOrder(false);
  };

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

      {/* ---- TOP STATS ---- */}
      <div className="stats-container">
        <div className="stat-box">Total Orders: {orders.length}</div>
        <div className="stat-box">Sales Count: {salesRecords.length}</div>
      </div>

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

      {/* ---- ORDERS SECTION ---- */}
      <div className="box table-box">
        <h3>Orders</h3>

        <button
          className="add-order-btn"
          onClick={() => setShowAddOrder(!showAddOrder)}
        >
          {showAddOrder ? "Close" : "Add Order"}
        </button>

        {/* ADD ORDER FORM */}
        {showAddOrder && (
          <div className="add-order-form">
            <input
              type="text"
              placeholder="Order ID"
              value={newOrder.id}
              onChange={(e) => setNewOrder({ ...newOrder, id: e.target.value })}
            />
            <input
              type="text"
              placeholder="Customer"
              value={newOrder.customer}
              onChange={(e) =>
                setNewOrder({ ...newOrder, customer: e.target.value })
              }
            />
            <input
              type="number"
              placeholder="Total Amount"
              value={newOrder.total}
              onChange={(e) =>
                setNewOrder({ ...newOrder, total: e.target.value })
              }
            />
            <select
              value={newOrder.status}
              onChange={(e) =>
                setNewOrder({ ...newOrder, status: e.target.value })
              }
            >
              <option>Pending</option>
              <option>Confirmed</option>
              <option>Shipped</option>
              <option>Cancelled</option>
            </select>

            <button className="save-btn" onClick={addNewOrder}>
              Save Order
            </button>
          </div>
        )}

        {/* ---- ORDERS TABLE ---- */}
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((o, index) => (
              <tr key={index}>
                <td>
                  <input
                    value={o.id}
                    onChange={(e) => updateOrderField(index, "id", e.target.value)}
                  />
                </td>

                <td>
                  <input
                    value={o.customer}
                    onChange={(e) =>
                      updateOrderField(index, "customer", e.target.value)
                    }
                  />
                </td>

                <td>
                  <input
                    value={o.total}
                    onChange={(e) =>
                      updateOrderField(index, "total", e.target.value)
                    }
                  />
                </td>

                <td>
                  <select
                    value={o.status}
                    onChange={(e) =>
                      updateOrderField(index, "status", e.target.value)
                    }
                  >
                    <option>Pending</option>
                    <option>Confirmed</option>
                    <option>Shipped</option>
                    <option>Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---- SALES RECORDS (UPDATED) ---- */}
      <div className="box table-box">
        <h3>Sales Records</h3>

        {salesRecords.length === 0 ? (
          <p>No sales yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {salesRecords.map((s, index) => (
                <tr key={index}>
                  <td>{s.productName}</td>
                  <td>{s.quantity}</td>
                  <td>{s.price}</td>
                  <td>{s.total}</td>
                  <td>{s.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};

export default AdminDashboard;
