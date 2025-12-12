import React, { useState, useEffect, useMemo, useContext } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { AppContext } from "./AppContext";
import "./SalesRecords.css";

function SalesRecords() {
  const { fetchWithAuth } = useContext(AppContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("monthly");
  const [currentPage, setCurrentPage] = useState(1);
  const [showCustomRange, setShowCustomRange] = useState(false);

  // date range states (custom range)
  const [startMonth, setStartMonth] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [endYear, setEndYear] = useState("");

  const itemsPerPage = 10;

  /* ------------------------------------
     Fetch Orders (unfiltered)
  ------------------------------------ */
  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth("/api/orders/");
      if (response.ok) {
        const data = await response.json();
        setOrders(Array.isArray(data) ? data : data.records || []);
      } else {
        console.error("Failed to fetch orders");
      }
    } catch (e) {
      console.error("Error fetching orders:", e);
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------
     Apply date filter
  ------------------------------------ */
  const applyDateFilter = async () => {
    if (!startYear || !startMonth || !endYear || !endMonth) return;

    try {
      setLoading(true);

      const startStr = `${startYear}-${startMonth}-01`;
      const endDay = new Date(parseInt(endYear, 10), parseInt(endMonth, 10), 0).getDate();
      const endStr = `${endYear}-${endMonth}-${String(endDay).padStart(2, "0")}`;

      const url = `/api/orders/?start=${encodeURIComponent(startStr)}&end=${encodeURIComponent(endStr)}`;

      const response = await fetchWithAuth(url);
      if (response.ok) {
        const data = await response.json();
        setOrders(Array.isArray(data) ? data : data.records || []);
        setCurrentPage(1);
        setShowCustomRange(true);
        setFilterType("");
      } else {
        console.error("Failed to fetch filtered orders");
      }
    } catch (e) {
      console.error("Error applying date filter:", e);
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------
     Clear date filter
  ------------------------------------ */
  const clearDateFilter = async () => {
    setStartMonth("");
    setStartYear("");
    setEndMonth("");
    setEndYear("");
    setShowCustomRange(false);
    setFilterType("monthly");
    setCurrentPage(1);
    await fetchOrders();
  };

  /* ------------------------------------
     Flatten Records
  ------------------------------------ */
  const salesRecords = useMemo(() => {
    const records = [];
    orders.forEach((order) => {
      const items = order.items || order.order_items || [];
      items.forEach((item) => {
        records.push({
          orderId: order.order_id || order.id || order.pk,
          date: order.date,
          customer: order.customer || order.customer_name || order.buyer,
          product: item.product_name || item.particulars || item.name,
          quantity: Number(item.quantity || item.qty || 0),
          price: Number(item.rate || item.price || 0),
          total: Number(item.quantity || item.qty || 0) * Number(item.rate || item.price || 0)
        });
      });
    });
    return records;
  }, [orders]);

  /* ------------------------------------
     Client-side fallback filter
  ------------------------------------ */
  const filteredRecords = useMemo(() => {
    if (!startYear || !startMonth || !endYear || !endMonth) {
      return salesRecords;
    }

    const startDate = new Date(parseInt(startYear, 10), parseInt(startMonth, 10) - 1, 1);
    const endDay = new Date(parseInt(endYear, 10), parseInt(endMonth, 10), 0).getDate();
    const endDate = new Date(parseInt(endYear, 10), parseInt(endMonth, 10) - 1, endDay);

    return salesRecords.filter((record) => {
      if (!record.date) return false;
      const recDate = new Date(record.date);
      return recDate >= startDate && recDate <= endDate;
    });
  }, [salesRecords, startYear, startMonth, endYear, endMonth]);

  /* ------------------------------------
     Aggregation
  ------------------------------------ */
  const aggregatedData = useMemo(() => {
    const grouped = {};
    const source = filteredRecords;

    source.forEach((record) => {
      if (!record.date) return;
      const date = new Date(record.date);
      let key;

      if (filterType === "daily") {
        key = date.toISOString().slice(0, 10);
      } else if (filterType === "weekly") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = `Week of ${weekStart.toISOString().slice(0, 10)}`;
      } else {
        key = date.toISOString().slice(0, 7);
      }

      if (!grouped[key]) grouped[key] = { period: key, total: 0 };
      grouped[key].total += Number(record.total) || 0;
    });

    return Object.values(grouped).sort((a, b) => new Date(a.period) - new Date(b.period));
  }, [filteredRecords, filterType]);

  /* ------------------------------------
     Metrics
  ------------------------------------ */
  const metrics = useMemo(() => {
    const totalSales = filteredRecords.reduce((sum, r) => sum + (Number(r.total) || 0), 0);
    const uniqueOrders = new Set(filteredRecords.map((r) => r.orderId));
    const totalOrders = uniqueOrders.size;
    const avgOrder = totalOrders > 0 ? (totalSales / totalOrders).toFixed(2) : "0.00";
    const totalQuantity = filteredRecords.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);

    return { totalSales, totalOrders, avgOrder, totalQuantity };
  }, [filteredRecords]);

  /* ------------------------------------
     Pagination
  ------------------------------------ */
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [filteredRecords]);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedRecords.slice(start, start + itemsPerPage);
  }, [currentPage, sortedRecords]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / itemsPerPage));

  /* ------------------------------------
     Delete Order
  ------------------------------------ */
  const deleteOrder = async (orderId) => {
    if (!window.confirm("Delete this entire order?")) return;

    try {
      const response = await fetchWithAuth(`/api/orders/${orderId}/`, {
        method: "DELETE"
      });

      if (response.ok) {
        if (startYear && startMonth && endYear && endMonth) {
          await applyDateFilter();
        } else {
          await fetchOrders();
        }
      } else {
        alert("Failed to delete order");
      }
    } catch (e) {
      console.error("Error deleting order:", e);
      alert("Error deleting order");
    }
  };

  /* ------------------------------------
     Date select options
  ------------------------------------ */
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" }
  ];

  const isDateFilterActive = startYear && startMonth && endYear && endMonth;

  if (loading) {
    return (
      <div className="sales-container">
        <p>Loading sales records...</p>
      </div>
    );
  }

  return (
    <div className="sales-container">
      <h2 className="sales-title">Sales Records Dashboard</h2>

      <button className="sales-btn" onClick={() => { setFilterType("monthly"); setShowCustomRange(false); fetchOrders(); }}>
        🔄 Refresh Data
      </button>

      {salesRecords.length === 0 ? (
        <div className="empty-state">
          <p>No sales records yet. Create an order to get started!</p>
        </div>
      ) : (
        <>
          {/* FILTERS */}
          <div className="filter-section">
            <h3>Filter By:</h3>

            <div className="filter-buttons">
              {["daily", "weekly", "monthly"].map((type) => (
                <button
                  key={type}
                  className={`filter-btn ${filterType === type ? "active" : ""}`}
                  onClick={() => {
                    setFilterType(type);
                    setShowCustomRange(false);
                    setCurrentPage(1);
                  }}
                >
                  {type.toUpperCase()}
                </button>
              ))}

              <button
                className={`filter-btn ${showCustomRange ? "active" : ""}`}
                onClick={() => {
                  setShowCustomRange((v) => !v);
                  setFilterType("");
                }}
              >
                CUSTOM RANGE
              </button>
            </div>

            {showCustomRange && (
              <div className="custom-range-box">
                <h4>📅 Select Date Range</h4>

                <div className="custom-range-grid">
                  <select
                    className="sales-input"
                    value={startMonth}
                    onChange={(e) => setStartMonth(e.target.value)}
                  >
                    <option value="">Start Month</option>
                    {months.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>

                  <select
                    className="sales-input"
                    value={startYear}
                    onChange={(e) => setStartYear(e.target.value)}
                  >
                    <option value="">Start Year</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>

                  <select
                    className="sales-input"
                    value={endMonth}
                    onChange={(e) => setEndMonth(e.target.value)}
                  >
                    <option value="">End Month</option>
                    {months.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>

                  <select
                    className="sales-input"
                    value={endYear}
                    onChange={(e) => setEndYear(e.target.value)}
                  >
                    <option value="">End Year</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="custom-range-actions">
                  <button
                    className="sales-btn"
                    onClick={applyDateFilter}
                    disabled={!isDateFilterActive}
                  >
                    Apply
                  </button>

                  <button
                    className="clear-btn"
                    onClick={clearDateFilter}
                  >
                    Clear
                  </button>
                </div>

                {isDateFilterActive && (
                  <div className="date-range-info">
                    📊 Showing data from{" "}
                    {months[parseInt(startMonth, 10) - 1]?.label} {startYear} to{" "}
                    {months[parseInt(endMonth, 10) - 1]?.label} {endYear}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* METRICS */}
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

          {/* CHART */}
          <div className="chart-section">
            <h3>Sales Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={aggregatedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value) => `Rs.${Number(value).toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Sales Total" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* TABLE */}
          <div className="table-section">
            <h3>Detailed Records</h3>

            <div className="table-wrapper">
              <table className="sales-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Amount</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedRecords.map((record, index) => (
                    <tr key={index}>
                      <td>{record.orderId}</td>
                      <td>{record.date ? new Date(record.date).toLocaleDateString() : "-"}</td>
                      <td>{record.customer}</td>
                      <td><strong>{record.product}</strong></td>
                      <td>{record.quantity}</td>
                      <td>Rs.{record.price.toFixed(2)}</td>
                      <td><strong>Rs.{record.total.toFixed(2)}</strong></td>
                      <td>
                        <button className="delete-btn" onClick={() => deleteOrder(record.orderId)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <div className="pagination-section">
              <button
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                ← Previous
              </button>

              <span className="pagination-info">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredRecords.length)} - {Math.min(currentPage * itemsPerPage, filteredRecords.length)} of {filteredRecords.length} records
              </span>

              <button
                className="pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default SalesRecords;