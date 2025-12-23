import { createContext, useState, useEffect } from "react";

export const AppContext = createContext();

export function AppProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [salesRecords, setSalesRecords] = useState([]);
  const [combinedRecords, setCombinedRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

const BACKEND_URL = process.env.REACT_APP_API_BASE_URL;
console.log("Backend URL:", BACKEND_URL);


  // -------------------------------
  // INITIAL LOAD
  // -------------------------------
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) verifyTokenAndLoadData(token);
    else setLoading(false);
  }, []);

  // -------------------------------
  // AUTH FUNCTIONS
  // -------------------------------
  const verifyTokenAndLoadData = async (token) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/verify-token/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return logout();

      const data = await res.json();
      setIsLoggedIn(true);
      setUser(data.user);

      await Promise.all([
        loadProducts(token),
        loadOrders(token),
        loadSalesRecords(token),
        loadCombinedRecords(token),
      ]);
    } catch (err) {
      console.error("Token verification error:", err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      let data = {};
      try {
        data = await res.json(); // parse JSON safely
      } catch (err) {
        console.error("Failed to parse JSON:", err);
        return { success: false, error: "Invalid response from server" };
      }

      if (!res.ok) {
        return { success: false, error: data.error || `Login failed: ${res.status}` };
      }

      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      setIsLoggedIn(true);
      setUser(data.user);

      await Promise.all([
        loadProducts(data.access),
        loadOrders(data.access),
        loadSalesRecords(data.access),
        loadCombinedRecords(data.access),
      ]);

      return { success: true };
    } catch (err) {
      console.error("Login error:", err);
      return { success: false, error: "Network error" };
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setIsLoggedIn(false);
    setUser(null);
    setProducts([]);
    setOrders([]);
    setSalesRecords([]);
    setCombinedRecords([]);
    window.location.href = "/login";
  };

  // -------------------------------
  // UTILITY: FETCH WITH AUTH
  // -------------------------------
  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem("access_token");
    if (!token) return logout();

    const res = await fetch(`${BACKEND_URL}${url}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (res.status === 401) logout(); // token invalid or expired
    return res;
  };

  // -------------------------------
  // LOAD FUNCTIONS
  // -------------------------------
  const loadProducts = async (token) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/products/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setProducts(await res.json());
    } catch (err) {
      console.error("Load products error:", err);
    }
  };

  const loadOrders = async (token) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/orders/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setOrders(await res.json());
    } catch (err) {
      console.error("Load orders error:", err);
    }
  };

  const loadSalesRecords = async (token) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/export-records/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setSalesRecords(await res.json());
    } catch (err) {
      console.error("Load sales records error:", err);
    }
  };

  const loadCombinedRecords = async (token) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/combined-records/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setCombinedRecords(await res.json());
    } catch (err) {
      console.error("Load combined records error:", err);
    }
  };

  // -------------------------------
  // ADD PRODUCT
  // -------------------------------
  const addProduct = async (productData) => {
    try {
      const res = await fetchWithAuth("/api/products/", {
        method: "POST",
        body: JSON.stringify(productData),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error("Add product error:", text);
        return { success: false, error: text };
      }
      const newProduct = await res.json();
      setProducts((prev) => [...prev, newProduct]);
      return { success: true, product: newProduct };
    } catch (err) {
      console.error("Add product exception:", err);
      return { success: false, error: err.message };
    }
  };

  // -------------------------------
  // ADD ORDER
  // -------------------------------
  const addOrder = async (orderData) => {
    try {
      const res = await fetchWithAuth("/api/orders/", {
        method: "POST",
        body: JSON.stringify(orderData),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error("Add order error:", text);
        return { success: false, error: text };
      }

      const newOrder = await res.json();
      setOrders((prev) => [...prev, newOrder]);

      // Optimistic stock update
      orderData.items.forEach((item) => {
        setProducts((prev) =>
          prev.map((p) => (p.id === item.product ? { ...p, stock: p.stock - item.quantity } : p))
        );
      });

      // Refresh combined records & sales records
      loadCombinedRecords(localStorage.getItem("access_token"));
      loadSalesRecords(localStorage.getItem("access_token"));

      return { success: true, order: newOrder };
    } catch (err) {
      console.error("Add order exception:", err);
      return { success: false, error: err.message };
    }
  };

  // -------------------------------
  // REFRESH DATA
  // -------------------------------
  const refreshData = () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    loadProducts(token);
    loadOrders(token);
    loadSalesRecords(token);
    loadCombinedRecords(token);
  };

  // -------------------------------
  // PROVIDER VALUE
  // -------------------------------
  return (
    <AppContext.Provider
      value={{
        products,
        orders,
        salesRecords,
        combinedRecords,
        loading,
        isLoggedIn,
        user,
        login,
        logout,
        addProduct,
        addOrder,
        fetchProducts: () => loadProducts(localStorage.getItem("access_token")),
        fetchOrders: () => loadOrders(localStorage.getItem("access_token")),
        fetchSalesRecords: () => loadSalesRecords(localStorage.getItem("access_token")),
        fetchCombinedRecords: () => loadCombinedRecords(localStorage.getItem("access_token")),
        fetchWithAuth,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
