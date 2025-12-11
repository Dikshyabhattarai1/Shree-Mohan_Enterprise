import React, { useState, useEffect, useMemo } from "react";
import "./SalesRecords.css";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

function SalesRecords() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("monthly");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch orders from API
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/orders/', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched orders:', data);
        setOrders(data);
      } else {
        console.error('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Transform orders into flat records for display
  const salesRecords = useMemo(() => {
    const records = [];
    orders.forEach(order => {
      order.items.forEach(item => {
        records.push({
          orderId: order.order_id,
          date: order.date,
          customer: order.customer,
          product: item.product_name || item.particulars, // ✅ Use product_name
          quantity: item.quantity,
          price: item.rate,
          total: item.quantity * item.rate
        });
      });
    });
    return records;
  }, [orders]);

  const deleteOrder = async (orderId) => {
    if (!window.confirm('Delete this entire order?')) return;
    
    try {
      const response = await fetch(`/api/orders/${orderId}/`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        alert('Order deleted successfully');
        fetchOrders(); // Refresh
      } else {
        alert('Failed to delete order');
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Error deleting order');
    }
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
    const totalOrders = orders.length;
    const avgOrder = totalOrders > 0 ? (totalSales / totalOrders).toFixed(2) : 0;
    const totalQuantity = salesRecords.reduce((sum, record) => sum + (Number(record.quantity) || 0), 0);

    return { totalSales, totalOrders, avgOrder, totalQuantity };
  }, [salesRecords, orders]);

  // Paginated records (sorted by date, newest first)
  const sortedRecords = useMemo(() => {
    return [...salesRecords].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [salesRecords]);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedRecords.slice(start, start + itemsPerPage);
  }, [currentPage, sortedRecords]);

  const totalPages = Math.ceil(salesRecords.length / itemsPerPage);

  if (loading) {
    return <div className="sales-container"><p>Loading sales records...</p></div>;
  }

  return (
    <div className="sales-container">
      <h2 className="sales-title">Sales Records Dashboard</h2>

      <button onClick={fetchOrders} className="sales-btn refresh-btn" style={{marginBottom: '20px'}}>
        🔄 Refresh Data
      </button>

      {/* Only show dashboard if there are records */}
      {salesRecords.length > 0 ? (
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
                  <Tooltip formatter={(value) => `Rs.${value.toFixed(2)}`} />
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
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Amount</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRecords.map((record, index) => (
                    <tr key={index}>
                      <td>{record.orderId}</td>
                      <td>{new Date(record.date).toLocaleDateString()}</td>
                      <td>{record.customer}</td>
                      <td><strong>{record.product}</strong></td>
                      <td>{record.quantity}</td>
                      <td>Rs.{record.price.toFixed(2)}</td>
                      <td><strong>Rs.{record.total.toFixed(2)}</strong></td>
                      <td>
                        <button
                          onClick={() => deleteOrder(record.orderId)}
                          className="delete-btn"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
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
      ) : (
        <div className="empty-state">
          <p>No sales records yet. Create an order in the Bill page to get started!</p>
        </div>
      )}
    </div>
  );
}

export default SalesRecords;