import React, { useContext, useState } from "react";
import "./SportsItems.css";
import { AppContext } from "../pages/AppContext"; // adjust path if needed

function SportsItems() {
  const { products, setProducts } = useContext(AppContext);

  const [newItemName, setNewItemName] = useState("");
  const [newItemStock, setNewItemStock] = useState("");

  // Add New Item
  const addItem = () => {
    if (!newItemName || !newItemStock) return;

    const updated = [...products, { name: newItemName, stock: Number(newItemStock) }];
    setProducts(updated);

    setNewItemName("");
    setNewItemStock("");
  };

  // Delete Item
  const deleteItem = (index) => {
    const updated = products.filter((_, i) => i !== index);
    setProducts(updated);
  };

  return (
    <div className="sports-container">

      <h2>Sports Items List</h2>

      {/* Add Item Section */}
      <div className="add-item-section">
        <input
          type="text"
          placeholder="Item name"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
        />

        <input
          type="number"
          placeholder="Stock"
          value={newItemStock}
          onChange={(e) => setNewItemStock(e.target.value)}
        />

        <button onClick={addItem}>Add Item</button>
      </div>

      {/* Table */}
      <table className="sports-table">
        <thead>
          <tr>
            <th>S.N</th>
            <th>Item Name</th>
            <th>Stock</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {products.map((item, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{item.name}</td>
              <td>{item.stock}</td>
              <td>
                <button onClick={() => deleteItem(index)} className="delete-btn">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}

export default SportsItems;
