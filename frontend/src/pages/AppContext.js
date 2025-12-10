// src/context/AppContext.js
// src/pages/AppContext.js
import { createContext, useState, useEffect } from "react";

export const AppContext = createContext();

export function AppProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [salesRecords, setSalesRecords] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch products from Django API
  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchSalesRecords();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products/');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders/');
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchSalesRecords = async () => {
    try {
      const response = await fetch('/api/salerecords/');
      if (response.ok) {
        const data = await response.json();
        setSalesRecords(data);
      }
    } catch (error) {
      console.error('Error fetching sales records:', error);
    }
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
        setProducts,
        salesRecords,
        setSalesRecords,
        orders,
        setOrders,
        loading,
        refreshData,
        fetchProducts,
        fetchOrders,
        fetchSalesRecords
      }}
    >
      {children}
    </AppContext.Provider>
  );
}