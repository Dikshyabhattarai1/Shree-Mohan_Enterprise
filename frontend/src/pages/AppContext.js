import { createContext, useState, useEffect } from "react";

export const AppContext = createContext();

export function AppProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [salesRecords, setSalesRecords] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const BACKEND_URL = "http://127.0.0.1:8000";

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) verifyTokenAndLoadData(token);
    else setLoading(false);
  }, []);

  // Verify token & load data
  const verifyTokenAndLoadData = async (token) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/verify-token/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setIsLoggedIn(true);
        setUser(data.user);
        await Promise.all([loadProducts(token), loadOrders(token), loadSalesRecords(token)]);
      } else logout();
    } catch (error) {
      console.error("Error verifying token:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Login
  const login = async (username, password) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        setIsLoggedIn(true);
        setUser(data.user);
        await Promise.all([loadProducts(data.access), loadOrders(data.access), loadSalesRecords(data.access)]);
        return { success: true };
      } else {
        return { success: false, error: data.error || "Login failed" };
      }
    } catch (error) {
      console.error("Login exception:", error);
      return { success: false, error: "Network error" };
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setIsLoggedIn(false);
    setUser(null);
    setProducts([]);
    setSalesRecords([]);
    setOrders([]);
    window.location.href = "/login";
  };

  // Load functions
  const loadProducts = async (token) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/products/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const loadOrders = async (token) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/orders/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
    }
  };

  const loadSalesRecords = async (token) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/salerecords/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSalesRecords(data);
      }
    } catch (error) {
      console.error("Error loading sales records:", error);
    }
  };

  // Public fetch functions
  const fetchProducts = () => {
    const token = localStorage.getItem("access_token");
    if (token) loadProducts(token);
  };

  const fetchOrders = () => {
    const token = localStorage.getItem("access_token");
    if (token) loadOrders(token);
  };

  const fetchSalesRecords = () => {
    const token = localStorage.getItem("access_token");
    if (token) loadSalesRecords(token);
  };

  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      logout();
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${BACKEND_URL}${url}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (response.status === 401) {
      logout();
      throw new Error("Session expired");
    }

    return response;
  };

  // Refresh all data
  const refreshData = () => {
    fetchProducts();
    fetchOrders();
    fetchSalesRecords();
  };

  return (
    <AppContext.Provider
      value={{
        products,
        salesRecords,
        orders,
        loading,
        isLoggedIn,
        user,
        login,
        logout,
        fetchProducts,
        fetchOrders,
        fetchSalesRecords,
        fetchWithAuth,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
