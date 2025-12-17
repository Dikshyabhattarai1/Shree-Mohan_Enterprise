import React, { useContext, useState } from "react";
import { AppContext } from "./AppContext";

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
  
  // State for editing stock
  const [editingId, setEditingId] = useState(null);
  const [editStock, setEditStock] = useState("");

  // Sort products alphabetically by name
  const sortedProducts = [...products].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // Filter products based on stock
  const inStockProducts = sortedProducts.filter(p => p.stock > 0);
  const outOfStockProducts = sortedProducts.filter(p => p.stock === 0);
  const displayProducts = showOutOfStock ? sortedProducts : inStockProducts;

  // Add New Item
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
    
    const token = localStorage.getItem('access_token');
    console.log("🔵 Token in localStorage:", token ? "✅ EXISTS" : "❌ MISSING");
    
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

  // Update Stock
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

  const startEditing = (id, currentStock) => {
    setEditingId(id);
    setEditStock(currentStock.toString());
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditStock("");
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px' }}>Sports Items List</h2>
      
      {popup.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            <h3>Notification</h3>
            <p>{popup.message}</p>
            <button 
              onClick={() => setPopup({ show: false, message: "" })}
              style={{
                padding: '8px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Add Item Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '10px',
        marginBottom: '20px',
        padding: '20px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px'
      }}>
        <input
          type="text"
          placeholder="Item name"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          disabled={loading}
          pattern="[a-zA-Z\s]+"
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
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
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
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
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
        />

        <input
          type="text"
          placeholder="Description (optional)"
          value={newItemDescription}
          onChange={(e) => setNewItemDescription(e.target.value)}
          disabled={loading}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
        />

        <button 
          onClick={addItem} 
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: loading ? '#9ca3af' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
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
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <thead>
          <tr style={{ backgroundColor: '#f3f4f6' }}>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>S.N</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Item Name</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Price</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Stock</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Description</th>
            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {displayProducts.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
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
                  opacity: item.stock === 0 ? 0.7 : 1,
                  borderBottom: '1px solid #e5e7eb'
                }}
              >
                <td style={{ padding: '12px' }}>{index + 1}</td>
                <td style={{ padding: '12px' }}>
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
                <td style={{ padding: '12px' }}>Rs. {item.price}</td>
                <td style={{ padding: '12px' }}>
                  {editingId === item.id ? (
                    <input
                      type="number"
                      value={editStock}
                      min="0"
                      onChange={(e) => {
                        if (Number(e.target.value) < 0) return;
                        setEditStock(e.target.value);
                      }}
                      style={{
                        width: '80px',
                        padding: '4px 8px',
                        border: '2px solid #3b82f6',
                        borderRadius: '4px'
                      }}
                    />
                  ) : (
                    item.stock
                  )}
                </td>
                <td style={{ padding: '12px' }}>{item.description || "-"}</td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {editingId === item.id ? (
                      <>
                        <button
                          onClick={() => updateStock(item.id)}
                          disabled={loading}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          disabled={loading}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#6b7280',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEditing(item.id, item.stock)}
                          disabled={loading}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Restock
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          disabled={loading}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '12px'
                          }}
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