// src/pages/SalesRecords.js
import React, { useState, useContext } from "react";
import "./SalesRecords.css";
import { AppContext } from "./AppContext";

function SalesRecords() {
  const { salesRecords, setSalesRecords } = useContext(AppContext);

  // Initialize with empty form
  const [form, setForm] = useState({
    product: "",
    quantity: "",
    price: "",
    date: "",
    total: ""
  });

  const handleChange = (e) => {
    const updated = { ...form, [e.target.name]: e.target.value };

    // Auto-calculate total if quantity or price changes
    if (e.target.name === "quantity" || e.target.name === "price") {
      const qty = updated.quantity ? Number(updated.quantity) : 0;
      const pr = updated.price ? Number(updated.price) : 0;
      updated.total = qty * pr;
    }

    setForm(updated);
  };

  const addRecord = () => {
    if (form.product && form.quantity && form.price && form.date) {
      setSalesRecords([...salesRecords, form]);
      setForm({ product: "", quantity: "", price: "", date: "", total: "" });
    } else {
      alert("Please fill all fields!");
    }
  };

  const updateRecord = (index, field, value) => {
    const updated = [...salesRecords];
    updated[index][field] = value;

    // Recalculate total
    if (field === "quantity" || field === "price") {
      const qty = Number(updated[index].quantity);
      const pr = Number(updated[index].price);
      updated[index].total = qty * pr;
    }

    setSalesRecords(updated);
  };

  const deleteRecord = (index) => {
    const filtered = salesRecords.filter((_, i) => i !== index);
    setSalesRecords(filtered);
  };

  return (
    <div className="sales-container">
      <h2 className="sales-title">Sales Records</h2>

      {/* Form to add new record */}
      <div className="sales-card">
        <input
          name="product"
          placeholder="Product"
          value={form.product}
          onChange={handleChange}
          className="sales-input"
        />
        <input
          name="quantity"
          placeholder="Quantity"
          value={form.quantity}
          onChange={handleChange}
          className="sales-input"
        />
        <input
          name="price"
          placeholder="Price"
          value={form.price}
          onChange={handleChange}
          className="sales-input"
        />
        <input
          name="total"
          placeholder="Total"
          value={form.total}
          readOnly
          className="sales-input"
        />
        <input
          name="date"
          type="date"
          value={form.date}
          onChange={handleChange}
          className="sales-input"
        />
        <button className="sales-btn" onClick={addRecord}>
          Add Record
        </button>
      </div>

      {/* Only show table if there are records */}
      {salesRecords.length > 0 && (
        <table className="sales-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {salesRecords.map((record, index) => (
              <tr key={index}>
                <td>
                  <input
                    value={record.product}
                    onChange={(e) =>
                      updateRecord(index, "product", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    value={record.quantity}
                    onChange={(e) =>
                      updateRecord(index, "quantity", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    value={record.price}
                    onChange={(e) =>
                      updateRecord(index, "price", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input value={record.total} readOnly />
                </td>
                <td>
                  <input
                    type="date"
                    value={record.date}
                    onChange={(e) =>
                      updateRecord(index, "date", e.target.value)
                    }
                  />
                </td>
                <td>
                  <button
                    onClick={() => deleteRecord(index)}
                    className="delete-btn"
                  >
                    X
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default SalesRecords;
