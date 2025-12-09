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

  // SALES RECORDS - start empty
  const [salesRecords, setSalesRecords] = useState([]);

  // ORDERS LIST - remove dummy orders completely
  const [orders, setOrders] = useState([]);

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
