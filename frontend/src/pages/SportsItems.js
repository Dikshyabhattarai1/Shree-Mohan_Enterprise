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

  // Add New Item - POST to Django API
  const addItem = async () => {
    if (!newItemName || !newItemStock) {
      alert("Please fill in at least name and stock");
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
          placeholder="Price (optional)"
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
          {products.length === 0 ? (
            <tr>
              <td colSpan="6">No products found. Add some!</td>
            </tr>
          ) : (
            products.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>{item.name}</td>
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