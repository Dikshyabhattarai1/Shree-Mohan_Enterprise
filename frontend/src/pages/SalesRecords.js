import React, { useContext, useState } from "react";
import { AppContext } from "./AppContext";
import "./SportsItems.css";

function SportsItems() {
  const { products, fetchProducts, fetchWithAuth } = useContext(AppContext);
  const [newItemName, setNewItemName] = useState("");
  const [newItemStock, setNewItemStock] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOutOfStock, setShowOutOfStock] = useState(false);
  const [popup, setPopup] = useState({
    show: false,
    message: "",
  });
  
  const [editingId, setEditingId] = useState(null);
  const [editStock, setEditStock] = useState("");

  const sortedProducts = [...products].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const inStockProducts = sortedProducts.filter(p => p.stock > 0);
  const outOfStockProducts = sortedProducts.filter(p => p.stock === 0);
  const displayProducts = showOutOfStock ? sortedProducts : inStockProducts;

  const addItem = async () => {
    if (!newItemName || newItemStock === "" || newItemPrice === "") {
      alert("Please fill in name, stock, and price");
      return;
    }

    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(newItemName)) {
      alert("Item name should only contain letters and spaces");
      return;
    }

    if (Number(newItemStock) < 0) {
      alert("Stock cannot be negative");
      return;
    }
    if (Number(newItemPrice) < 0) {
      alert("Price cannot be negative");
      return;
    }

    setLoading(true);
    
    try {
      const payload = {
        name: newItemName,
        stock: Number(newItemStock),
        price: Number(newItemPrice),
        description: newItemDescription || "",
        image: ""
      };
      
      const response = await fetchWithAuth('/api/products/', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setNewItemName("");
        setNewItemStock("");
        setNewItemPrice("");
        setNewItemDescription("");
        await fetchProducts();
        setPopup({
          show: true,
          message: " वस्तु सफलतापूर्वक थपियो",
        });
      } else {
        const err = await response.json();
        alert("Error adding item: " + JSON.stringify(err));
      }
    } catch (error) {
      console.error("Error adding item:", error);
      alert("Failed to add item: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (id) => {
    if (editStock === "" || Number(editStock) < 0) {
      alert("Please enter a valid stock quantity");
      return;
    }

    setLoading(true);
    try {
      const product = products.find(p => p.id === id);
      const payload = {
        ...product,
        stock: Number(editStock)
      };

      const response = await fetchWithAuth(`/api/products/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await fetchProducts();
        setEditingId(null);
        setEditStock("");
        setPopup({
          show: true,
          message: " स्टक अपडेट भयो ",
        });
      } else {
        const err = await response.json();
        alert("Error updating stock: " + JSON.stringify(err));
      }
    } catch (error) {
      console.error("Error updating stock:", error);
      alert("Failed to update stock: " + error.message);
    } finally {
      setLoading(false);
    }
  };

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

  const startEditing = (id, currentStock) => {
    setEditingId(id);
    setEditStock(currentStock.toString());
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditStock("");
  };

  return (
    <div className="sports-container">
      <h2 className="sports-title">Sports Items List</h2>
      
      {popup.show && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h3>Notification</h3>
            <p>{popup.message}</p>
            <button onClick={() => setPopup({ show: false, message: "" })}>
              OK
            </button>
          </div>
        </div>
      )}

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
            if (Number(e.target.value) < 0) return;
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

      <div className="stock-summary">
        <div className="stock-card">
          <p>In Stock</p>
          <p className="in-stock-number">{inStockProducts.length}</p>
        </div>
        <div className="stock-card">
          <p>Out of Stock</p>
          <p className="out-stock-number">{outOfStockProducts.length}</p>
        </div>
        <div className="stock-checkbox">
          <label>
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
        <div className="warning-banner">
          ℹ️ {outOfStockProducts.length} out of stock items hidden.
        </div>
      )}

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
              <td colSpan="6" className="empty-state">
                {showOutOfStock
                  ? "No products found."
                  : "No products in stock. Enable 'Show out of stock items'."}
              </td>
            </tr>
          ) : (
            displayProducts.map((item, index) => (
              <tr key={item.id} className={item.stock === 0 ? 'out-of-stock' : ''}>
                <td>{index + 1}</td>
                <td>
                  {item.name}
                  {item.stock === 0 && (
                    <span className="out-stock-badge">OUT OF STOCK</span>
                  )}
                </td>
                <td>Rs. {item.price}</td>
                <td>
                  {editingId === item.id ? (
                    <input
                      type="number"
                      value={editStock}
                      min="0"
                      onChange={(e) => {
                        if (Number(e.target.value) < 0) return;
                        setEditStock(e.target.value);
                      }}
                      className="stock-input"
                    />
                  ) : (
                    item.stock
                  )}
                </td>
                <td>{item.description || "-"}</td>
                <td>
                  <div className="action-buttons">
                    {editingId === item.id ? (
                      <>
                        <button
                          onClick={() => updateStock(item.id)}
                          disabled={loading}
                          className="btn-save"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          disabled={loading}
                          className="btn-cancel"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEditing(item.id, item.stock)}
                          disabled={loading}
                          className="btn-restock"
                        >
                          Restock
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          disabled={loading}
                          className="btn-delete"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
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