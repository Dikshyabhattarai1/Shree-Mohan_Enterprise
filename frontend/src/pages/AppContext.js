import { createContext, useState, useEffect } from "react";

export const AppContext = createContext();

export function AppProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [salesRecords, setSalesRecords] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  // On mount: check if token exists in localStorage
  useEffect(() => {
    console.log("🔵 App mounting - checking for token...");
    const token = localStorage.getItem("access_token");
    console.log("   Token found:", token ? "✅ YES" : "❌ NO");

    if (token) {
      console.log("   Token exists, verifying...");
      verifyTokenAndLoadData(token);
    } else {
      console.log("   No token, setting loading to false");
      setLoading(false);
    }
  }, []);

  // Verify token and load all data
  const verifyTokenAndLoadData = async (token) => {
    try {
      const response = await fetch("/api/verify-token/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Token verified, user:", data.user);
        setIsLoggedIn(true);
        setUser(data.user);
        
        // Load all data
        await Promise.all([
          loadProducts(token),
          loadOrders(token),
          loadSalesRecords(token),
        ]);
      } else {
        console.log("❌ Token verification failed");
        logout();
      }
    } catch (error) {
      console.error("❌ Error verifying token:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (username, password) => {
    console.log("🔵 LOGIN START - username:", username);

    try {
      const response = await fetch("/api/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log("🔵 API Response status:", response.status);
      console.log("🔵 API Response data:", data);

      if (response.ok) {
        console.log("✅ Login successful - got tokens");

        // SAVE TO LOCALSTORAGE IMMEDIATELY
        console.log("🔵 Saving tokens to localStorage...");
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        console.log("✅ Tokens saved to localStorage");

        // Verify they were saved
        const savedToken = localStorage.getItem("access_token");
        console.log("✅ Verification - token in localStorage:", savedToken ? "YES" : "NO");

        // UPDATE STATE
        console.log("🔵 Updating React state...");
        setIsLoggedIn(true);
        setUser(data.user);
        console.log("✅ State updated");

        // LOAD DATA
        console.log("🔵 Loading products, orders, sales records...");
        await Promise.all([
          loadProducts(data.access),
          loadOrders(data.access),
          loadSalesRecords(data.access),
        ]);

        console.log("✅ All data loaded");
        return { success: true };
      } else {
        console.log("❌ Login API returned error:", data);
        return { success: false, error: data.error || "Login failed" };
      }
    } catch (error) {
      console.error("❌ Login exception:", error);
      return { success: false, error: "Network error" };
    }
  };

  // Logout
  const logout = () => {
    console.log("🔵 Logging out...");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setIsLoggedIn(false);
    setUser(null);
    setProducts([]);
    setSalesRecords([]);
    setOrders([]);
    console.log("✅ Logged out");
    
    // Redirect to login page
    window.location.href = "/login";
  };

  // Load functions with explicit token
  const loadProducts = async (token) => {
    try {
      const response = await fetch("/api/products/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Products loaded:", data.length, "items");
        setProducts(data);
      } else {
        console.error("❌ Failed to load products:", response.status);
      }
    } catch (error) {
      console.error("❌ Error loading products:", error);
    }
  };

  const loadOrders = async (token) => {
    try {
      const response = await fetch("/api/orders/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Orders loaded:", data.length, "items");
        setOrders(data);
      } else {
        console.error("❌ Failed to load orders:", response.status);
      }
    } catch (error) {
      console.error("❌ Error loading orders:", error);
    }
  };

  const loadSalesRecords = async (token) => {
    try {
      const response = await fetch("/api/salerecords/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Sales records loaded:", data.length, "items");
        setSalesRecords(data);
      } else {
        console.error("❌ Failed to load sales records:", response.status);
      }
    } catch (error) {
      console.error("❌ Error loading sales records:", error);
    }
  };

  // Fetch with auth - used by other components
  const fetchWithAuth = async (url, options = {}) => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      console.error("❌ No token for API call");
      logout();
      throw new Error("Not authenticated");
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (response.status === 401) {
      console.error("❌ Got 401, logging out");
      logout();
      throw new Error("Session expired");
    }

    return response;
  };

  // Public fetch functions (for refreshing data)
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