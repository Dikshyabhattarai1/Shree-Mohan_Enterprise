import React, { useContext, useState } from "react";
import "./SportsItems.css";
import { AppContext } from "../pages/AppContext";

function SportsItems() {
  const { products, fetchProducts } = useContext(AppContext);
  const [newItemName, setNewItemName] = useState("");
  const [newItemStock, setNewItemStock] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOutOfStock, setShowOutOfStock] = useState(false); // ✅ Toggle to show/hide out of stock

  // ✅ Filter products based on stock
  const inStockProducts = products.filter(p => p.stock > 0);
  const outOfStockProducts = products.filter(p => p.stock === 0);
  const displayProducts = showOutOfStock ? products : inStockProducts;

  // Add New Item - POST to Django API
  const addItem = async () => {
    if (!newItemName || !newItemStock || !newItemPrice) {
      alert("Please fill in name, stock, and price");
      return;
    }

    // ✅ Validate item name - only letters and spaces
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(newItemName)) {
      alert("Item name should only contain letters (a-z, A-Z) and spaces");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/products/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: newItemName,
          stock: Number(newItemStock),
          price: Number(newItemPrice) || 0,
          description: newItemDescription || "",
          image: ""
        })
      });

      if (response.ok) {
        // Clear form
        setNewItemName("");
        setNewItemStock("");
        setNewItemPrice("");
        setNewItemDescription("");
        
        // Refresh products from backend
        await fetchProducts();
        alert("Item added successfully!");
      } else {
        const error = await response.json();
        alert("Error adding item: " + JSON.stringify(error));
      }
    } catch (error) {
      console.error('Error adding item:', error);
      alert("Failed to add item");
    } finally {
      setLoading(false);
    }
  };

  // Delete Item - DELETE from Django API
  const deleteItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/products/${id}/`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        // Refresh products from backend
        await fetchProducts();
        alert("Item deleted successfully!");
      } else {
        alert("Error deleting item");
      }
    } catch (error) {
      console.error('Error deleting item:', error);
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
          title="Only letters and spaces allowed"
        />
        <input
          type="number"
          placeholder="Stock"
          value={newItemStock}
          onChange={(e) => setNewItemStock(e.target.value)}
          disabled={loading}
        />
        <input
          type="number"
          placeholder="Price"
          value={newItemPrice}
          onChange={(e) => setNewItemPrice(e.target.value)}
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

      {/* ✅ Stock Status Summary */}
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
          <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#6b7280' }}>
            In Stock
          </p>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
            {inStockProducts.length}
          </p>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#6b7280' }}>
            Out of Stock
          </p>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
            {outOfStockProducts.length}
          </p>
        </div>
        <div style={{ flex: 2 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showOutOfStock}
              onChange={(e) => setShowOutOfStock(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>
              Show out of stock items
            </span>
          </label>
        </div>
      </div>

      {/* ✅ Warning if out of stock items are hidden */}
      {!showOutOfStock && outOfStockProducts.length > 0 && (
        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          color: '#92400e',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '15px',
          fontSize: '14px'
        }}>
          ℹ️ {outOfStockProducts.length} out of stock item(s) hidden. Check the box above to view them.
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
                  ? "No products found. Add some!" 
                  : "No products in stock. Add inventory or enable 'Show out of stock items'."}
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
                  {/* ✅ Out of stock badge */}
                  {item.stock === 0 && (
                    <span style={{
                      marginLeft: '8px',
                      padding: '2px 8px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}>
                      OUT OF STOCK
                    </span>
                  )}
                </td>
                <td>Rs. {item.price}</td>
                <td>
                  <span style={{
                    fontWeight: 'bold',
                    color: item.stock === 0 ? '#ef4444' : item.stock < 10 ? '#f59e0b' : '#10b981'
                  }}>
                    {item.stock}
                  </span>
                </td>
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