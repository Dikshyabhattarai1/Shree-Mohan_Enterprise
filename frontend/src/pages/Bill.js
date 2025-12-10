import React, { useState, useEffect, useContext } from "react";
import { NepaliDatePicker } from "nepali-datepicker-reactjs";
import "nepali-datepicker-reactjs/dist/index.css";
import { AppContext } from "./AppContext";

export default function Bill() {
  const { products, fetchProducts } = useContext(AppContext);
  
  const companyName = "ShreeMohan Enterprise";
  const companySubtitle = "Sports Items";
  const companyAddress = "Biratnagar, Mahendra Chowk";
  const phone = "9852063234";

  const [dateEN, setDateEN] = useState(new Date().toISOString().split('T')[0]);
  const [dateNP, setDateNP] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");

  const initialRows = Array.from({ length: 10 }).map(() => ({
    productId: "",
    particulars: "",
    qty: "",
    rate: "",
  }));
  const [rows, setRows] = useState(initialRows);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addRow = () => setRows([...rows, { productId: "", particulars: "", qty: "", rate: "" }]);
  
  const toggleRowSelection = (i) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(i)) newSelected.delete(i);
    else newSelected.add(i);
    setSelectedRows(newSelected);
  };
  
  const deleteSelectedRows = () => {
    const newRows = rows.filter((_, idx) => !selectedRows.has(idx));
    setRows(newRows);
    setSelectedRows(new Set());
  };

  const updateRow = (i, field, value) => {
    const copy = [...rows];
    copy[i][field] = value;
    
    // Auto-fill from product selection
    if (field === 'productId' && value) {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        copy[i].particulars = product.name;
        copy[i].rate = product.price;
      }
    }
    
    setRows(copy);
  };

  const amounts = rows.map((r) => {
    const q = parseFloat(r.qty) || 0;
    const rt = parseFloat(r.rate) || 0;
    return q * rt;
  });
  const subtotal = amounts.reduce((s, a) => s + a, 0);

  const handleSaveOrder = async () => {
    if (!buyerName.trim()) {
      alert("Please enter buyer name");
      return;
    }

    const orderItems = rows
      .filter(r => r.particulars && r.qty && r.rate)
      .map(r => ({
        product: parseInt(r.productId) || null,
        particulars: r.particulars,
        quantity: parseInt(r.qty),
        rate: parseFloat(r.rate)
      }));

    if (orderItems.length === 0) {
      alert("Please add at least one item");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/orders/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          order_id: `ORD-${Date.now()}`,
          customer: buyerName,
          customer_address: buyerAddress,
          date: dateEN,
          date_np: dateNP,
          items: orderItems
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Order saved and completed successfully!\nOrder ID: ${data.order_id}\nStock updated and sales records created.`);
        
        // Refresh product list to show updated stock
        await fetchProducts();
        
        // Reset form
        setBuyerName("");
        setBuyerAddress("");
        setRows(initialRows);
        setSelectedRows(new Set());
      } else {
        const error = await response.json();
        alert("Error saving order: " + (error.detail || JSON.stringify(error)));
      }
    } catch (error) {
      console.error('Error:', error);
      alert("Failed to save order");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => window.print();

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ background: 'white', padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #333', paddingBottom: '20px', marginBottom: '20px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px' }}>{companyName}</h1>
            <p style={{ margin: '5px 0', fontSize: '14px' }}>{companySubtitle}</p>
            <p style={{ margin: '5px 0', fontSize: '14px' }}>{companyAddress}</p>
            <p style={{ margin: '5px 0', fontSize: '14px' }}>Phone: {phone}</p>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Date (EN)</label>
            <input 
              type="date" 
              value={dateEN} 
              onChange={(e) => setDateEN(e.target.value)}
              style={{ padding: '5px', marginBottom: '10px', display: 'block' }}
            />
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>Date (NP)</label>
            <NepaliDatePicker
              value={dateNP}
              onChange={(val) => setDateNP(val)}
              options={{ calenderLocale: "ne", valueLocale: "en" }}
            />
          </div>
        </div>

        {/* Buyer Info */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Mr./Ms.</label>
          <input 
            value={buyerName} 
            onChange={(e) => setBuyerName(e.target.value)} 
            placeholder="Buyer name"
            style={{ width: '100%', padding: '8px', marginBottom: '10px', border: '1px solid #ccc' }}
          />
          <input 
            value={buyerAddress} 
            onChange={(e) => setBuyerAddress(e.target.value)} 
            placeholder="Buyer address (optional)"
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc' }}
          />
        </div>

        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th className="no-print" style={{ padding: '10px', border: '1px solid #ddd' }}>Select</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>S.No</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Product</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Particulars</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Qty</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Rate</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const amt = (parseFloat(r.qty) || 0) * (parseFloat(r.rate) || 0);
              return (
                <tr key={i}>
                  <td className="no-print" style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedRows.has(i)}
                      onChange={() => toggleRowSelection(i)}
                    />
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{i + 1}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    <select 
                      value={r.productId}
                      onChange={(e) => updateRow(i, "productId", e.target.value)}
                      style={{ width: '100%', padding: '5px' }}
                    >
                      <option value="">Select...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    <input 
                      value={r.particulars} 
                      onChange={(e) => updateRow(i, "particulars", e.target.value)}
                      style={{ width: '100%', padding: '5px', border: 'none' }}
                    />
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    <input 
                      type="number" 
                      min="0" 
                      value={r.qty} 
                      onChange={(e) => updateRow(i, "qty", e.target.value)}
                      style={{ width: '100%', padding: '5px', border: 'none' }}
                    />
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    <input 
                      type="number" 
                      min="0" 
                      value={r.rate} 
                      onChange={(e) => updateRow(i, "rate", e.target.value)}
                      style={{ width: '100%', padding: '5px', border: 'none' }}
                    />
                  </td>
                  <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>
                    {amt.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Controls */}
        <div className="no-print" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
          <button onClick={addRow} style={{ padding: '10px 20px', background: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }}>
            + Add Row
          </button>
          <button 
            onClick={deleteSelectedRows}
            disabled={selectedRows.size === 0}
            style={{ padding: '10px 20px', background: '#f44336', color: 'white', border: 'none', cursor: selectedRows.size === 0 ? 'not-allowed' : 'pointer', opacity: selectedRows.size === 0 ? 0.5 : 1 }}
          >
            Delete Selected ({selectedRows.size})
          </button>
          <button 
            onClick={handleSaveOrder}
            disabled={saving}
            style={{ padding: '10px 20px', background: '#2196F3', color: 'white', border: 'none', cursor: saving ? 'not-allowed' : 'pointer' }}
          >
            {saving ? 'Saving...' : 'Save & Complete Order'}
          </button>
          <button onClick={handlePrint} style={{ padding: '10px 20px', background: '#FF9800', color: 'white', border: 'none', cursor: 'pointer' }}>
            Print / PDF
          </button>
        </div>

        {/* Summary */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #333', paddingTop: '20px' }}>
          <div>
            <p>Terms & Conditions: ____________________________</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h3 style={{ margin: 0 }}>Grand Total: Rs. {subtotal.toFixed(2)}</h3>
          </div>
        </div>

        {/* Signature */}
        <div style={{ marginTop: '60px', textAlign: 'right' }}>
          <p>For {companyName}</p>
          <p style={{ marginTop: '40px', borderTop: '1px solid #333', display: 'inline-block', paddingTop: '5px' }}>
            Authorised Signature
          </p>
        </div>

      </div>
      
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
      `}</style>
    </div>
  );
}

