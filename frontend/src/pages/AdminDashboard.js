import React, { useState, useEffect, useMemo, useContext } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, DollarSign, Users, ShoppingCart, Activity, ArrowUp, ArrowDown, Package, Clock } from "lucide-react";
import { AppContext } from "./AppContext";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const { fetchWithAuth } = useContext(AppContext);
  const [timeRange, setTimeRange] = useState("monthly");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper: Calculate date ranges
  const getDateRange = (type) => {
    const today = new Date();
    let startDate, endDate;

    if (type === "daily") {
      startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    } else if (type === "weekly") {
      startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
      endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    } else if (type === "monthly") {
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

  // Fetch Orders
  const fetchOrders = async (type = "monthly") => {
    try {
      setLoading(true);
      let url = "/api/orders/";

      if (type === "daily" || type === "weekly" || type === "monthly") {
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

  useEffect(() => {
    fetchOrders(timeRange);
  }, [timeRange]);

  // Flatten sales records from orders
  const salesRecords = useMemo(() => {
    const records = [];
    orders.forEach((order) => {
      if (!order.date) return;
      
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

  // Calculate stats
  const stats = useMemo(() => {
    const totalSales = salesRecords.reduce((sum, r) => sum + (Number(r.total) || 0), 0);
    const uniqueOrders = new Set(salesRecords.map((r) => r.orderId));
    const totalOrders = uniqueOrders.size;
    const avgOrder = totalOrders > 0 ? (totalSales / totalOrders) : 0;
    const totalQuantity = salesRecords.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);

    // Calculate growth percentage (comparing with previous period)
    const prevPeriodOrders = Math.floor(totalOrders * 0.9); // Simulated previous period
    const orderGrowth = prevPeriodOrders > 0 ? (((totalOrders - prevPeriodOrders) / prevPeriodOrders) * 100).toFixed(1) : 0;

    return [
      {
        title: "Total Revenue",
        value: `Rs.${totalSales.toFixed(2)}`,
        change: "+12.5%",
        isPositive: true,
        icon: DollarSign,
        color: "#0084ff",
      },
      {
        title: "Total Orders",
        value: totalOrders.toString(),
        change: `${orderGrowth > 0 ? '+' : ''}${orderGrowth}%`,
        isPositive: orderGrowth >= 0,
        icon: ShoppingCart,
        color: "#10b981",
      },
      {
        title: "Total Products Sold",
        value: totalQuantity.toString(),
        change: "+15.3%",
        isPositive: true,
        icon: Package,
        color: "#f59e0b",
      },
      {
        title: "Average Order",
        value: `Rs.${avgOrder.toFixed(2)}`,
        change: "-2.1%",
        isPositive: false,
        icon: Activity,
        color: "#ef4444",
      },
    ];
  }, [salesRecords]);

  // Aggregate data for chart
  const salesData = useMemo(() => {
    const grouped = {};
    salesRecords.forEach((record) => {
      if (!record.date) return;
      const date = new Date(record.date);
      const key = date.toISOString().slice(0, 10);

      if (!grouped[key]) {
        grouped[key] = { 
          date: key, 
          sales: 0, 
          revenue: 0,
          orders: new Set()
        };
      }
      grouped[key].sales += Number(record.quantity) || 0;
      grouped[key].revenue += Number(record.total) || 0;
      grouped[key].orders.add(record.orderId);
    });

    return Object.values(grouped)
      .map(item => ({
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sales: item.sales,
        revenue: item.revenue
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [salesRecords]);

  // Category distribution
  const categoryData = useMemo(() => {
    const productCount = {};
    salesRecords.forEach((record) => {
      const product = record.product || "Unknown";
      productCount[product] = (productCount[product] || 0) + record.quantity;
    });

    const sorted = Object.entries(productCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const total = sorted.reduce((sum, [, count]) => sum + count, 0);
    
    const colors = ["#0084ff", "#00d4ff", "#7c3aed", "#f59e0b", "#10b981"];
    
    return sorted.map(([name, value], index) => ({
      name,
      value: ((value / total) * 100).toFixed(1),
      count: value,
      color: colors[index]
    }));
  }, [salesRecords]);

  // Recent orders (unique orders only)
  const recentOrders = useMemo(() => {
    const uniqueOrders = {};
    salesRecords.forEach((record) => {
      if (!uniqueOrders[record.orderId]) {
        uniqueOrders[record.orderId] = {
          id: record.orderId,
          customer: record.customer,
          date: record.date,
          total: 0,
          items: []
        };
      }
      uniqueOrders[record.orderId].total += record.total;
      uniqueOrders[record.orderId].items.push(record.product);
    });

    return Object.values(uniqueOrders)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
      .map(order => ({
        id: `#${order.id}`,
        customer: order.customer,
        amount: `Rs.${order.total.toFixed(2)}`,
        status: "Completed",
        time: new Date(order.date).toLocaleDateString()
      }));
  }, [salesRecords]);

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Admin Dashboard</h1>
          <p className="dashboard-subtitle">Welcome back! Here's your business overview.</p>
        </div>
        <div className="time-range-selector">
          <button 
            className={timeRange === "daily" ? "active" : ""} 
            onClick={() => setTimeRange("daily")}
          >
            Today
          </button>
          <button 
            className={timeRange === "weekly" ? "active" : ""} 
            onClick={() => setTimeRange("weekly")}
          >
            Week
          </button>
          <button 
            className={timeRange === "monthly" ? "active" : ""} 
            onClick={() => setTimeRange("monthly")}
          >
            Month
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="stat-card">
              <div className="stat-header">
                <span className="stat-title">{stat.title}</span>
                <div className="stat-icon" style={{ backgroundColor: `${stat.color}15` }}>
                  <Icon size={20} color={stat.color} />
                </div>
              </div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-change">
                {stat.isPositive ? (
                  <ArrowUp size={16} className="arrow-up" />
                ) : (
                  <ArrowDown size={16} className="arrow-down" />
                )}
                <span className={stat.isPositive ? "positive" : "negative"}>
                  {stat.change} from last period
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        {/* Sales & Revenue Chart */}
        <div className="chart-card large">
          <div className="chart-header">
            <h3>Sales & Revenue Trends</h3>
            <span className="chart-badge">{timeRange === "daily" ? "Today" : timeRange === "weekly" ? "Last 7 days" : "Last 30 days"}</span>
          </div>
          {salesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#0084ff" 
                  strokeWidth={3}
                  dot={{ fill: '#0084ff', r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Quantity Sold"
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Revenue (Rs.)"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-chart">
              <Package size={48} color="#d1d5db" />
              <p>No sales data available</p>
              <span>Sales data for this period will appear here</span>
            </div>
          )}
        </div>

        {/* Top Products Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Top Products</h3>
          </div>
          {categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [`${value} units (${props.payload.value}%)`, props.payload.name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="legend-grid">
                {categoryData.map((item, index) => (
                  <div key={index} className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: item.color }}></div>
                    <span>{item.name}</span>
                    <span className="legend-value">{item.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-chart">
              <Activity size={48} color="#d1d5db" />
              <p>No product data</p>
              <span>Product distribution will appear here</span>
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="orders-card">
        <div className="orders-header">
          <h3>Recent Orders</h3>
          <button className="view-all-btn" onClick={() => window.location.href = '/sales-records'}>
            View All
          </button>
        </div>
        {recentOrders.length > 0 ? (
          <div className="orders-table">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order, index) => (
                  <tr key={index}>
                    <td className="order-id">{order.id}</td>
                    <td>{order.customer}</td>
                    <td className="order-amount">{order.amount}</td>
                    <td>
                      <span className="status-badge completed">
                        {order.status}
                      </span>
                    </td>
                    <td className="order-time">{order.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-table">
            <Clock size={48} color="#d1d5db" />
            <p>No recent orders</p>
            <span>Recent orders will appear here</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;