import React, { useContext, useState } from "react";
import "./SportsItems.css";
import { AppContext } from "./AppContext";

function SportsItems() {
  const { products, fetchProducts, fetchWithAuth } = useContext(AppContext);
  const [newItemName, setNewItemName] = useState("");
  const [newItemStock, setNewItemStock] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOutOfStock, setShowOutOfStock] = useState(false);

  // Filter products based on stock
  const inStockProducts = products.filter(p => p.stock > 0);
  const outOfStockProducts = products.filter(p => p.stock === 0);
  const displayProducts = showOutOfStock ? products : inStockProducts;

  // Add New Item
  const addItem = async () => {
    if (!newItemName || newItemStock === "" || newItemPrice === "") {
      alert("Please fill in name, stock, and price");
      return;
    }

    // Only letters & spaces for name
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(newItemName)) {
      alert("Item name should only contain letters and spaces");
      return;
    }

    // Validation: prevent negative stock/price
    if (Number(newItemStock) < 0) {
      alert("Stock cannot be negative");
      return;
    }
    if (Number(newItemPrice) < 0) {
      alert("Price cannot be negative");
      return;
    }

    setLoading(true);
    
    // 🔵 DEBUG: Check token
    const token = localStorage.getItem('access_token');
    console.log("🔵 Token in localStorage:", token ? "✅ EXISTS" : "❌ MISSING");
    console.log("🔵 Token value:", token);
    
    try {
      const payload = {
        name: newItemName,
        stock: Number(newItemStock),
        price: Number(newItemPrice),
        description: newItemDescription || "",
        image: ""
      };
      
      console.log("🔵 Sending payload:", payload);
      
      const response = await fetchWithAuth('/api/products/', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      console.log("🔵 Response status:", response.status);
      console.log("🔵 Response ok:", response.ok);

      if (response.ok) {
        console.log("✅ Item added successfully!");
        setNewItemName("");
        setNewItemStock("");
        setNewItemPrice("");
        setNewItemDescription("");
        await fetchProducts();
        alert("Item added successfully!");
      } else {
        const err = await response.json();
        console.log("❌ Error response:", err);
        alert("Error adding item: " + JSON.stringify(err));
      }
    } catch (error) {
      console.error("❌ Error adding item:", error);
      alert("Failed to add item: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete Item
  const deleteItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetchWithAuth(`/api/products/${id}/`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchProducts();
        alert("Item deleted successfully!");
      } else {
        alert("Error deleting item");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Failed to delete item");
    } finally {
      setLoading(false);
    }
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
          disabled={loading}
          pattern="[a-zA-Z\s]+"
        />

        <input
          type="number"
          placeholder="Stock"
          value={newItemStock}
          min="0"
          onChange={(e) => {
            if (Number(e.target.value) < 0) return; // Prevent negative typing
            setNewItemStock(e.target.value);
          }}
          disabled={loading}
        />

        <input
          type="number"
          placeholder="Price"
          value={newItemPrice}
          min="0"
          onChange={(e) => {
            if (Number(e.target.value) < 0) return;
            setNewItemPrice(e.target.value);
          }}
          disabled={loading}
        />

        <input
          type="text"
          placeholder="Description (optional)"
          value={newItemDescription}
          onChange={(e) => setNewItemDescription(e.target.value)}
          disabled={loading}
        />

        <button onClick={addItem} disabled={loading}>
          {loading ? "Adding..." : "Add Item"}
        </button>
      </div>

      {/* Stock Summary */}
      <div style={{
        display: 'flex',
        gap: '20px',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#f3f4f6',
        borderRadius: '8px'
      }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>In Stock</p>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
            {inStockProducts.length}
          </p>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Out of Stock</p>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
            {outOfStockProducts.length}
          </p>
        </div>
        <div style={{ flex: 2 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={showOutOfStock}
              onChange={(e) => setShowOutOfStock(e.target.checked)}
            />
            <span>Show out of stock items</span>
          </label>
        </div>
      </div>

      {!showOutOfStock && outOfStockProducts.length > 0 && (
        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '15px'
        }}>
          ℹ️ {outOfStockProducts.length} out of stock items hidden.
        </div>
      )}

      {/* Table */}
      <table className="sports-table">
        <thead>
          <tr>
            <th>S.N</th>
            <th>Item Name</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {displayProducts.length === 0 ? (
            <tr>
              <td colSpan="6">
                {showOutOfStock
                  ? "No products found."
                  : "No products in stock. Enable 'Show out of stock items'."}
              </td>
            </tr>
          ) : (
            displayProducts.map((item, index) => (
              <tr
                key={item.id}
                style={{
                  backgroundColor: item.stock === 0 ? '#fee2e2' : 'transparent',
                  opacity: item.stock === 0 ? 0.7 : 1
                }}
              >
                <td>{index + 1}</td>
                <td>
                  {item.name}
                  {item.stock === 0 && (
                    <span style={{
                      marginLeft: '8px',
                      padding: '2px 8px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '10px'
                    }}>
                      OUT OF STOCK
                    </span>
                  )}
                </td>
                <td>Rs. {item.price}</td>
                <td>{item.stock}</td>
                <td>{item.description || "-"}</td>
                <td>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="delete-btn"
                    disabled={loading}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default SportsItems;