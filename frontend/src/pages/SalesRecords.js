// src/pages/SalesRecords.js
import React, { useState, useContext, useMemo } from "react";
import "./SalesRecords.css";
import { AppContext } from "./AppContext";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

function SalesRecords() {
  const { salesRecords, setSalesRecords } = useContext(AppContext);
  const [filterType, setFilterType] = useState("monthly"); // daily, weekly, monthly
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Initialize with empty form
  const [form, setForm] = useState({
    product: "",
    quantity: "",
    price: "",
    date: "",
    customer: "",
    total: ""
  });

  const handleChange = (e) => {
    const updated = { ...form, [e.target.name]: e.target.value };

    // Auto-calculate total if quantity or price changes
    if (e.target.name === "quantity" || e.target.name === "price") {
      const qty = updated.quantity ? Number(updated.quantity) : 0;
      const pr = updated.price ? Number(updated.price) : 0;
      updated.total = qty * pr;
    }

    setForm(updated);
  };

  const addRecord = () => {
    if (form.product && form.quantity && form.price && form.date && form.customer) {
      setSalesRecords([...salesRecords, form]);
      setForm({ product: "", quantity: "", price: "", date: "", customer: "", total: "" });
    } else {
      alert("Please fill all fields!");
    }
  };

  const updateRecord = (index, field, value) => {
    const updated = [...salesRecords];
    updated[index][field] = value;

    // Recalculate total
    if (field === "quantity" || field === "price") {
      const qty = Number(updated[index].quantity);
      const pr = Number(updated[index].price);
      updated[index].total = qty * pr;
    }

    setSalesRecords(updated);
  };

  const deleteRecord = (index) => {
    const filtered = salesRecords.filter((_, i) => i !== index);
    setSalesRecords(filtered);
  };

  // Aggregate data based on filter type
  const aggregatedData = useMemo(() => {
    const grouped = {};

    salesRecords.forEach(record => {
      if (!record.date) return;

      let key;
      const date = new Date(record.date);

      if (filterType === "daily") {
        key = record.date;
      } else if (filterType === "weekly") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = `Week of ${weekStart.toISOString().split('T')[0]}`;
      } else {
        key = date.toISOString().slice(0, 7); // YYYY-MM
      }

      if (!grouped[key]) {
        grouped[key] = { period: key, total: 0, count: 0 };
      }
      grouped[key].total += Number(record.total) || 0;
      grouped[key].count += 1;
    });

    return Object.values(grouped).sort((a, b) => 
      new Date(b.period) - new Date(a.period)
    );
  }, [salesRecords, filterType]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalSales = salesRecords.reduce((sum, record) => sum + (Number(record.total) || 0), 0);
    const totalOrders = salesRecords.length;
    const avgOrder = totalOrders > 0 ? (totalSales / totalOrders).toFixed(2) : 0;
    const totalQuantity = salesRecords.reduce((sum, record) => sum + (Number(record.quantity) || 0), 0);

    return { totalSales, totalOrders, avgOrder, totalQuantity };
  }, [salesRecords]);

  // Paginated records (sorted by date, newest first)
  const sortedRecords = useMemo(() => {
    return [...salesRecords].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [salesRecords]);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedRecords.slice(start, start + itemsPerPage);
  }, [currentPage, sortedRecords]);

  const totalPages = Math.ceil(salesRecords.length / itemsPerPage);

  return (
    <div className="sales-container">
      <h2 className="sales-title">Sales Records Dashboard</h2>

      {/* Form to add new record */}
      <div className="sales-card form-section">
        <h3 className="form-title">Add New Sale</h3>
        <div className="form-grid">
          <input
            name="product"
            placeholder="Product"
            value={form.product}
            onChange={handleChange}
            className="sales-input"
          />
          <input
            name="customer"
            placeholder="Customer"
            value={form.customer}
            onChange={handleChange}
            className="sales-input"
          />
          <input
            name="quantity"
            placeholder="Quantity"
            type="number"
            value={form.quantity}
            onChange={handleChange}
            className="sales-input"
          />
          <input
            name="price"
            placeholder="Price"
            type="number"
            value={form.price}
            onChange={handleChange}
            className="sales-input"
          />
          <input
            name="total"
            placeholder="Total (Auto)"
            value={form.total}
            readOnly
            className="sales-input total-input"
          />
          <input
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            className="sales-input"
          />
          <button className="sales-btn" onClick={addRecord}>
            Add Record
          </button>
        </div>
      </div>

      {/* Only show dashboard if there are records */}
      {salesRecords.length > 0 && (
        <>
          {/* Filter Buttons */}
          <div className="filter-section">
            <h3>Filter By:</h3>
            <div className="filter-buttons">
              {['daily', 'weekly', 'monthly'].map(type => (
                <button
                  key={type}
                  onClick={() => {
                    setFilterType(type);
                    setCurrentPage(1);
                  }}
                  className={`filter-btn ${filterType === type ? 'active' : ''}`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="metrics-section">
            <div className="metric-card">
              <p className="metric-label">Total Sales</p>
              <p className="metric-value">Rs.{metrics.totalSales.toFixed(2)}</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Total Orders</p>
              <p className="metric-value">{metrics.totalOrders}</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Average Order</p>
              <p className="metric-value">Rs.{metrics.avgOrder}</p>
            </div>
            <div className="metric-card">
              <p className="metric-label">Total Quantity</p>
              <p className="metric-value">{metrics.totalQuantity}</p>
            </div>
          </div>

          {/* Chart */}
          {aggregatedData.length > 0 && (
            <div className="chart-section">
              <h3>Sales Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={aggregatedData.slice(0, 30).reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Sales Total"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Detailed Records Table */}
          <div className="table-section">
            <h3>Detailed Records (Page {currentPage} of {totalPages})</h3>
            <div className="table-wrapper">
              <table className="sales-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Product</th>
                    <th>Customer</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Amount</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRecords.map((record, index) => {
                    const originalIndex = sortedRecords.indexOf(record);
                    return (
                      <tr key={originalIndex}>
                        <td>
                          <input
                            type="date"
                            value={record.date}
                            onChange={(e) =>
                              updateRecord(originalIndex, "date", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            value={record.product}
                            onChange={(e) =>
                              updateRecord(originalIndex, "product", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            value={record.customer}
                            onChange={(e) =>
                              updateRecord(originalIndex, "customer", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={record.quantity}
                            onChange={(e) =>
                              updateRecord(originalIndex, "quantity", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={record.price}
                            onChange={(e) =>
                              updateRecord(originalIndex, "price", e.target.value)
                            }
                          />
                        </td>
                        <td className="amount-cell">
                          <input value={record.total.toFixed(2)} readOnly />
                        </td>
                        <td>
                          <button
                            onClick={() => deleteRecord(originalIndex)}
                            className="delete-btn"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="pagination-section">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                ← Previous
              </button>
              <span className="pagination-info">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, salesRecords.length)} - {Math.min(currentPage * itemsPerPage, salesRecords.length)} of {salesRecords.length} records
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}

      {salesRecords.length === 0 && (
        <div className="empty-state">
          <p>No sales records yet. Add one above to get started!</p>
        </div>
      )}
    </div>
  );
}

export default SalesRecords;