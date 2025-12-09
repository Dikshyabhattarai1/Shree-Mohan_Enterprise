// src/context/AppContext.js
import { createContext, useState } from "react";

export const AppContext = createContext();

export function AppProvider({ children }) {

  // SHARED PRODUCTS LIST (used by AdminDashboard + SportsItems)
  const [products, setProducts] = useState([
    { id: 1, name: "Football", stock: 40 },
    { id: 2, name: "Cricket Bat", stock: 25 },
    { id: 3, name: "Badminton Racket", stock: 50 }
  ]);

  // SALES RECORDS
  const [salesRecords, setSalesRecords] = useState([]);

  // ORDERS LIST
  const [orders, setOrders] = useState([
    { id: 101, customer: "John Doe", total: 79.98, status: "Pending" },
    { id: 102, customer: "Jane Smith", total: 129.97, status: "Confirmed" },
    { id: 103, customer: "Bob Johnson", total: 49.99, status: "Shipped" }
  ]);

  return (
    <AppContext.Provider
      value={{
        products, setProducts,
        salesRecords, setSalesRecords,
        orders, setOrders
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
