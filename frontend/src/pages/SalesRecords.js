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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const itemsPerPage = 10;

  /* ------------------------------------
     Helper: Calculate date ranges
  ------------------------------------ */
  const getDateRange = (type) => {
    const today = new Date();
    let startDate, endDate;

    if (type === "daily") {
      // Today only - same date for start and end
      startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    } else if (type === "weekly") {
      // Last 7 days (6 days before + today)
      startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
      endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    } else if (type === "monthly") {
      // Last 30 days (29 days before + today)
      startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29);
      endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    }

    return { startDate, endDate };
  };

  const formatDateForAPI = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  /* ------------------------------------
     Fetch Orders with date filtering
  ------------------------------------ */
  const fetchOrders = async (type = null) => {
    try {
      setLoading(true);
      let url = "/api/orders/";

      if (type && (type === "daily" || type === "weekly" || type === "monthly")) {
        const { startDate, endDate } = getDateRange(type);
        const startStr = formatDateForAPI(startDate);
        const endStr = formatDateForAPI(endDate);
        url = `/api/orders/?start=${encodeURIComponent(startStr)}&end=${encodeURIComponent(endStr)}`;
      }

      const response = await fetchWithAuth(url);
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
     Initial load with monthly filter
  ------------------------------------ */
  useEffect(() => {
    fetchOrders("monthly");
    // eslint-disable-next-line
  }, []);

  /* ------------------------------------
     Handle filter type change
  ------------------------------------ */
  const handleFilterChange = (type) => {
    setFilterType(type);
    setShowCustomRange(false);
    setCurrentPage(1);
    setStartDate("");
    setEndDate("");
    fetchOrders(type);
  };

  /* ------------------------------------
     Apply custom date range filter
  ------------------------------------ */
  const applyDateFilter = async () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      alert("Start date cannot be after end date");
      return;
    }

    try {
      setLoading(true);

      const url = `/api/orders/?start=${encodeURIComponent(startDate)}&end=${encodeURIComponent(endDate)}`;

      const response = await fetchWithAuth(url);
      if (response.ok) {
        const data = await response.json();
        setOrders(Array.isArray(data) ? data : data.records || []);
        setCurrentPage(1);
        setShowCustomRange(true);
        setFilterType("custom");
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
     Clear date filter and reset to monthly
  ------------------------------------ */
  const clearDateFilter = async () => {
    setStartDate("");
    setEndDate("");
    setShowCustomRange(false);
    setFilterType("monthly");
    setCurrentPage(1);
    await fetchOrders("monthly");
  };

  /* ------------------------------------
     Flatten Records with client-side date filtering
  ------------------------------------ */
  const salesRecords = useMemo(() => {
    const records = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    orders.forEach((order) => {
      if (!order.date) return;
      
      const orderDate = new Date(order.date);
      orderDate.setHours(0, 0, 0, 0);
      let shouldInclude = true;
      
      // Client-side date filtering for extra safety
      if (filterType === "daily") {
        const todayStr = formatDateForAPI(today);
        const orderDateStr = order.date.split('T')[0];
        shouldInclude = (orderDateStr === todayStr);
      } else if (filterType === "weekly") {
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 6);
        weekAgo.setHours(0, 0, 0, 0);
        shouldInclude = (orderDate >= weekAgo && orderDate <= today);
      } else if (filterType === "monthly") {
        const monthAgo = new Date(today);
        monthAgo.setDate(today.getDate() - 29);
        monthAgo.setHours(0, 0, 0, 0);
        shouldInclude = (orderDate >= monthAgo && orderDate <= today);
      } else if (filterType === "custom" && startDate && endDate) {
        const customStart = new Date(startDate);
        customStart.setHours(0, 0, 0, 0);
        const customEnd = new Date(endDate);
        customEnd.setHours(23, 59, 59, 999);
        shouldInclude = (orderDate >= customStart && orderDate <= customEnd);
      }
      
      if (!shouldInclude) return;
      
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
  }, [orders, filterType, startDate, endDate]);

  /* ------------------------------------
     Aggregation for chart
  ------------------------------------ */
  const aggregatedData = useMemo(() => {
    const grouped = {};
    const source = salesRecords;

    source.forEach((record) => {
      if (!record.date) return;
      const date = new Date(record.date);
      let key;

      if (filterType === "daily") {
        key = date.toISOString().slice(0, 10);
      } else if (filterType === "weekly") {
        key = date.toISOString().slice(0, 10);
      } else {
        key = date.toISOString().slice(0, 10);
      }

      if (!grouped[key]) grouped[key] = { period: key, total: 0 };
      grouped[key].total += Number(record.total) || 0;
    });

    return Object.values(grouped).sort((a, b) => new Date(a.period) - new Date(b.period));
  }, [salesRecords, filterType]);

  /* ------------------------------------
     Metrics
  ------------------------------------ */
  const metrics = useMemo(() => {
    const totalSales = salesRecords.reduce((sum, r) => sum + (Number(r.total) || 0), 0);
    const uniqueOrders = new Set(salesRecords.map((r) => r.orderId));
    const totalOrders = uniqueOrders.size;
    const avgOrder = totalOrders > 0 ? (totalSales / totalOrders).toFixed(2) : "0.00";
    const totalQuantity = salesRecords.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);

    return { totalSales, totalOrders, avgOrder, totalQuantity };
  }, [salesRecords]);

  /* ------------------------------------
     Pagination
  ------------------------------------ */
  const sortedRecords = useMemo(() => {
    return [...salesRecords].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [salesRecords]);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedRecords.slice(start, start + itemsPerPage);
  }, [currentPage, sortedRecords]);

  const totalPages = Math.max(1, Math.ceil(salesRecords.length / itemsPerPage));

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
        if (filterType === "custom") {
          await applyDateFilter();
        } else {
          await fetchOrders(filterType);
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
     Get filter display text
  ------------------------------------ */
  const getFilterDisplayText = () => {
    if (filterType === "daily") {
      return "Today's Sales";
    } else if (filterType === "weekly") {
      return "Last 7 Days";
    } else if (filterType === "monthly") {
      return "Last 30 Days";
    } else if (filterType === "custom" && startDate && endDate) {
      return `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;
    }
    return "";
  };

  /* ------------------------------------
     Date select options
  ------------------------------------ */
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const isDateFilterActive = startDate && endDate;

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

      <button className="sales-btn" onClick={() => handleFilterChange("monthly")}>
        🔄 Refresh Data
      </button>

      {/* FILTERS */}
      <div className="filter-section">
        <h3>Filter By:</h3>

        <div className="filter-buttons">
          {["daily", "weekly", "monthly"].map((type) => (
            <button
              key={type}
              className={`filter-btn ${filterType === type ? "active" : ""}`}
              onClick={() => handleFilterChange(type)}
            >
              {type === "daily" ? "TODAY" : type === "weekly" ? "LAST 7 DAYS" : "LAST 30 DAYS"}
            </button>
          ))}

          <button
            className={`filter-btn ${showCustomRange ? "active" : ""}`}
            onClick={() => {
              setShowCustomRange((v) => !v);
              if (!showCustomRange) {
                setFilterType("custom");
              }
            }}
          >
            CUSTOM RANGE
          </button>
        </div>

        {showCustomRange && (
          <div className="custom-range-box">
            <h4>📅 Select Date Range</h4>

            <div className="custom-range-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="date-input-group">
                <label htmlFor="start-date" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Start Date (YYYY-MM-DD)
                </label>
                <input
                  id="start-date"
                  type="date"
                  className="sales-input date-input"
                  value={startDate}
                  max={getTodayDate()}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="YYYY-MM-DD"
                  style={{ width: '100%', padding: '10px', fontSize: '14px' }}
                />
              </div>

              <div className="date-input-group">
                <label htmlFor="end-date" style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  End Date (YYYY-MM-DD)
                </label>
                <input
                  id="end-date"
                  type="date"
                  className="sales-input date-input"
                  value={endDate}
                  max={getTodayDate()}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="YYYY-MM-DD"
                  style={{ width: '100%', padding: '10px', fontSize: '14px' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '6px', fontSize: '13px', color: '#0369a1' }}>
              💡 <strong>Tip:</strong> Click on the calendar icon to select a date, or type manually in YYYY-MM-DD format (e.g., 2025-11-01)
            </div>

            <div className="custom-range-actions">
              <button
                className="sales-btn"
                onClick={applyDateFilter}
                disabled={!isDateFilterActive}
              >
                Apply Filter
              </button>

              <button
                className="clear-btn"
                onClick={clearDateFilter}
              >
                Clear Filter
              </button>
            </div>

            {isDateFilterActive && (
              <div className="date-range-info">
                📊 Selected range: {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
              </div>
            )}
          </div>
        )}

        {filterType && (
          <div className="date-range-info">
            📊 Showing: {getFilterDisplayText()}
          </div>
        )}
      </div>

      {salesRecords.length === 0 ? (
        <div className="empty-state">
          <p>No sales records found for the selected period.</p>
        </div>
      ) : (
        <>
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
                      <td>Rs.{record.price}</td>
                      <td><strong>Rs.{record.total}</strong></td>
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
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, salesRecords.length)} - {Math.min(currentPage * itemsPerPage, salesRecords.length)} of {salesRecords.length} records
              </span>

              <button
                className="pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
            
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default SalesRecords;