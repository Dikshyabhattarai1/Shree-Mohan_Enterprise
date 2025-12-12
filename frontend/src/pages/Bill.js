import React, { useState, useEffect, useContext } from "react";
import { NepaliDatePicker } from "nepali-datepicker-reactjs";
import "nepali-datepicker-reactjs/dist/index.css";
import NepaliDate from "nepali-date-converter";
import { AppContext } from "./AppContext";
import "./Bill.css";
import logo from "./images/logo.png.jpg"; // exact filename

export default function Bill() {
  const { products, fetchProducts } = useContext(AppContext);

  const companyName = "ShreeMohan Enterprise";
  const companySubtitle = "Sports Items";
  const companyAddress = "Biratnagar, Mahendra Chowk";
  const phone = "9852063234";

  const today = new Date();
  const todayNepali = new NepaliDate(today);
  const todayNepaliString = todayNepali.format("YYYY-MM-DD");

  const [dateEN, setDateEN] = useState(today.toISOString().split('T')[0]);
  const [dateNP, setDateNP] = useState(todayNepaliString);
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
  }, []);

  const availableProducts = products.filter(p => p.stock > 0);

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

  const handleProductChange = (i, value) => {
    const copy = [...rows];
    copy[i].productId = value;

    if (value) {
      const product = availableProducts.find(p => String(p.id) === String(value));
      if (product) {
        copy[i].particulars = product.name;
        copy[i].rate = product.price;
      }
    } else {
      copy[i].particulars = "";
      copy[i].rate = "";
      copy[i].qty = "";
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
      .filter(r => r.productId && r.qty && r.rate)
      .map(r => {
        const product = products.find(p => p.id === parseInt(r.productId));
        if (product && parseInt(r.qty) > product.stock) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${r.qty}`);
        }
        return {
          product: parseInt(r.productId),
          product_name: product?.name || r.particulars,
          particulars: product?.name || r.particulars,
          quantity: parseInt(r.qty),
          rate: parseFloat(r.rate)
        };
      });

    if (orderItems.length === 0) {
      alert("Please select at least one product and fill quantity & rate");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        order_id: `ORD-${Date.now()}`,
        customer: buyerName,
        customer_address: buyerAddress,
        date: dateEN,
        date_np: dateNP,
        items: orderItems
      };

      const response = await fetch('/api/orders/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Order saved successfully!\nOrder ID: ${data.order_id}`);
        await fetchProducts();
        setBuyerName("");
        setBuyerAddress("");
        setRows(initialRows);
        setSelectedRows(new Set());
      } else {
        const error = await response.json();
        alert("Error: " + (error.detail || JSON.stringify(error)));
      }
    } catch (error) {
      alert("Failed to save order: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    document.body.classList.add('printing');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing');
    }, 100);
  };

  return (
    <div className="bill-page">
      <div className="bill-sheet">

        {/* Header */}
        <div className="bill-header">
          <div className="header-logo">
            <img src={logo} alt="Company Logo" className="company-logo" />
          </div>

          <div className="header-left">
            <h1 className="company-name">{companyName}</h1>
            <p className="company-sub">{companySubtitle}</p>
            <p className="company-addr">{companyAddress}</p>
            <p className="company-phone">Phone: {phone}</p>
          </div>

          <div className="header-right">
            <div className="date-section">
              <label className="date-label">Date (EN)</label>
              <input
                type="date"
                value={dateEN}
                onChange={(e) => setDateEN(e.target.value)}
                className="date-input"
              />
            </div>
            <div className="date-section">
              <label className="date-label">Date (NP)</label>
              <NepaliDatePicker
                value={dateNP}
                onChange={(val) => setDateNP(val)}
                options={{ calenderLocale: "ne", valueLocale: "en" }}
              />
            </div>
          </div>
        </div>

        {/* Buyer Info */}
        <div className="buyer-section">
          <div className="buyer-field">
            <label className="buyer-label">Mr./Ms.</label>
            <input
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="Buyer name"
              className="buyer-input"
            />
          </div>
          <div className="buyer-field">
            <label className="buyer-label">Address</label>
            <input
              value={buyerAddress}
              onChange={(e) => setBuyerAddress(e.target.value)}
              placeholder="Buyer address (optional)"
              className="buyer-input"
            />
          </div>
        </div>

        {/* Stock warning */}
        {availableProducts.length === 0 && (
          <div className="no-print" style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #ef4444',
            color: '#991b1b',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            ⚠️ No products available in stock. Please add inventory first.
          </div>
        )}

        {/* Table */}
        <div className="table-wrapper">
          <table className="bill-table">
            <thead>
              <tr>
                <th className="no-print col-select">Select</th>
                <th className="col-sno">S.No</th>
                <th className="no-print col-product">Product</th>
                <th className="col-particulars">Particulars</th>
                <th className="col-qty">Qty</th>
                <th className="col-rate">Rate</th>
                <th className="col-amount">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const amt = (parseFloat(r.qty) || 0) * (parseFloat(r.rate) || 0);
                const selectedProduct = availableProducts.find(p => String(p.id) === String(r.productId));
                const maxQty = selectedProduct ? selectedProduct.stock : 0;
                const hasData = r.particulars && r.particulars.trim() && r.particulars !== "(Select product)";

                return (
                  <tr key={i} className={!hasData ? 'no-print-empty' : ''}>
                    <td className="no-print col-select">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(i)}
                        onChange={() => toggleRowSelection(i)}
                      />
                    </td>
                    <td className="col-sno">{i + 1}</td>
                    <td className="no-print col-product">
                      <select
                        value={r.productId}
                        onChange={(e) => handleProductChange(i, e.target.value)}
                        className="product-select"
                      >
                        <option value="">Select Product...</option>
                        {availableProducts.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} (Stock: {p.stock})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="col-particulars">
                      <span>{r.particulars && r.particulars.trim() ? r.particulars : "(Select product)"}</span>
                    </td>
                    <td className="col-qty">
                      <input
                        type="number"
                        min="0"
                        max={maxQty}
                        value={r.qty}
                        onChange={(e) => {
                          const copy = [...rows];
                          const enteredQty = parseInt(e.target.value) || 0;
                          if (selectedProduct && enteredQty > selectedProduct.stock) {
                            alert(`Only ${selectedProduct.stock} units available for ${selectedProduct.name}`);
                            copy[i].qty = selectedProduct.stock;
                          } else {
                            copy[i].qty = e.target.value;
                          }
                          setRows(copy);
                        }}
                        className="qty-input"
                        disabled={!r.productId}
                      />
                    </td>
                    <td className="col-rate">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={r.rate}
                        onChange={(e) => {
                          const copy = [...rows];
                          copy[i].rate = e.target.value;
                          setRows(copy);
                        }}
                        className="rate-input"
                      />
                    </td>
                    <td className="col-amount">{amt.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Controls */}
        <div className="controls-section no-print">
          <button onClick={addRow} className="btn btn-add">+ Add Row</button>
          <button onClick={deleteSelectedRows} disabled={selectedRows.size === 0} className="btn btn-delete">
            Delete Selected ({selectedRows.size})
          </button>
          <button onClick={handleSaveOrder} disabled={saving || availableProducts.length === 0} className="btn btn-save">
            {saving ? 'Saving...' : 'Save & Complete Order'}
          </button>
          <button onClick={handlePrint} className="btn btn-print">Print / PDF</button>
        </div>

        {/* Summary */}
        <div className="summary-section">
          <div className="summary-left">
            <p className="terms-label">Terms & Conditions: ____________________________</p>
          </div>
          <div className="summary-right">
            <h3 className="grand-total">Grand Total: Rs. {subtotal.toFixed(2)}</h3>
          </div>
        </div>

        {/* Signature */}
        <div className="signature-section">
          <p>For {companyName}</p>
          <p className="signature-line">Authorised Signature</p>
        </div>

      </div>
    </div>
  );
}
