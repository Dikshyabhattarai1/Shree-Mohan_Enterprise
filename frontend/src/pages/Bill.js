import React, { useState, useEffect, useContext } from "react";
import { NepaliDatePicker } from "nepali-datepicker-reactjs";
import "nepali-datepicker-reactjs/dist/index.css";
import NepaliDate from "nepali-date-converter";
import { AppContext } from "./AppContext";
import logo from "./images/logo.jpg";
import "./Bill.css";

export default function Bill() {
  const { products, fetchProducts, fetchWithAuth } = useContext(AppContext);

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
    // eslint-disable-next-line
  }, []);

  const availableProducts = products.filter(p => p.stock > 0);

  const addRow = () =>
    setRows([...rows, { productId: "", particulars: "", qty: "", rate: "" }]);

  const deleteSelectedRows = () => {
    setRows(rows.filter((_, idx) => !selectedRows.has(idx)));
    setSelectedRows(new Set());
  };

  // FIXED: Handle product selection
  const handleProductChange = (i, productId) => {
    const copy = [...rows];
    copy[i].productId = productId;

    if (productId) {
      const product = availableProducts.find(p => p.id === parseInt(productId));
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

  // Handle quantity change
  const handleQtyChange = (i, value) => {
    const copy = [...rows];
    copy[i].qty = value;
    setRows(copy);
  };

  // Handle rate change
  const handleRateChange = (i, value) => {
    const copy = [...rows];
    copy[i].rate = value;
    setRows(copy);
  };

  const amounts = rows.map((r) => (parseFloat(r.qty) || 0) * (parseFloat(r.rate) || 0));
  const subtotal = amounts.reduce((s, a) => s + a, 0);

  const handleSaveOrder = async () => {
    if (!buyerName.trim()) {
      alert("Please enter buyer name");
      return;
    }

    try {
      const orderItems = rows
        .filter(r => r.productId && r.qty && r.rate)
        .map(r => {
          const product = products.find(p => p.id === parseInt(r.productId));
          if (product && parseInt(r.qty) > product.stock) {
            throw new Error(`Insufficient stock for ${product.name}.`);
          }
          return {
            product: parseInt(r.productId),
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

      const payload = {
        order_id: `ORD-${Date.now()}`,
        customer: buyerName,
        customer_address: buyerAddress,
        date: dateEN,
        date_np: dateNP,
        items: orderItems
      };

      const response = await fetchWithAuth('/api/orders/', {
        method: 'POST',
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

  const handlePrint = () => window.print();

  return (
    <div className="bill-page">
      <div className="bill-sheet">

        {/* ---- MAIN HEADER WITH LOGO ---- */}
        <div className="bill-header">
          <div className="header-left">
            <img src={logo} alt="Company Logo" className="company-logo" />

            <div>
              <h1 className="company-name">{companyName}</h1>
              <p className="company-sub">{companySubtitle}</p>
              <p className="company-addr">{companyAddress}</p>
              <p className="company-phone">Phone: {phone}</p>
            </div>
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

        {/* ---- BUYER INFO ---- */}
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
              placeholder="Buyer address"
              className="buyer-input"
            />
          </div>
        </div>

        {/* ---- STOCK WARNING ---- */}
        {availableProducts.length === 0 && (
          <div className="stock-warning">
            ⚠️ No products available in stock. Please add inventory first.
          </div>
        )}

        {/* ---- BILL TABLE ---- */}
        <div className="table-wrapper">
          <table className="bill-table">
            <thead>
              <tr>
                <th className="col-sno">S.No</th>
                <th className="col-particulars">Particulars</th>
                <th className="col-qty">Qty</th>
                <th className="col-rate">Rate</th>
                <th className="col-amount">Amount</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r, i) => {
                const amt = (parseFloat(r.qty) || 0) * (parseFloat(r.rate) || 0);
                return (
                  <tr key={i}>
                    <td className="col-sno">{i + 1}</td>
                    <td className="col-particulars no-print">
                      <select
                        value={r.productId}
                        onChange={(e) => handleProductChange(i, e.target.value)}
                        className="product-select"
                        style={{
                          width: "100%",
                          padding: "6px",
                          borderRadius: "4px",
                          border: "1px solid #ddd",
                          fontSize: "14px"
                        }}
                      >
                        <option value="">-- Select Product --</option>
                        {availableProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (Stock: {p.stock})
                          </option>
                        ))}
                      </select>
                      <div className="selected-product" style={{ marginTop: "4px", fontWeight: "500" }}>
                        {r.particulars || "(None selected)"}
                      </div>
                    </td>
                    <td className="col-qty">
                      <input
                        type="number"
                        value={r.qty}
                        onChange={(e) => handleQtyChange(i, e.target.value)}
                        placeholder="0"
                        min="0"
                        style={{
                          width: "100%",
                          padding: "6px",
                          borderRadius: "4px",
                          border: "1px solid #ddd",
                          fontSize: "14px"
                        }}
                      />
                    </td>
                    <td className="col-rate">
                      <input
                        type="number"
                        value={r.rate}
                        onChange={(e) => handleRateChange(i, e.target.value)}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        style={{
                          width: "100%",
                          padding: "6px",
                          borderRadius: "4px",
                          border: "1px solid #ddd",
                          fontSize: "14px"
                        }}
                      />
                    </td>
                    <td className="col-amount">{amt.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ---- ACTION BUTTONS ---- */}
        <div className="controls-section no-print">
          <button onClick={addRow} className="btn btn-add">+ Add Row</button>
          <button
            onClick={deleteSelectedRows}
            disabled={selectedRows.size === 0}
            className="btn btn-delete"
          >
            Delete Selected
          </button>

          <button
            onClick={handleSaveOrder}
            disabled={saving || availableProducts.length === 0}
            className="btn btn-save"
          >
            {saving ? "Saving..." : "Save & Complete Order"}
          </button>

          <button onClick={handlePrint} className="btn btn-print">
            Print / PDF
          </button>
        </div>

        {/* ---- SUMMARY ---- */}
        <div className="summary-section">
          <div className="summary-left">
            <p className="terms-label">
              Terms & Conditions: ____________________________
            </p>
          </div>

          <div className="summary-right">
            <h3 className="grand-total">Grand Total: Rs. {subtotal.toFixed(2)}</h3>
          </div>
        </div>

        {/* ---- SIGNATURE ---- */}
        <div className="signature-section">
          <p>For {companyName}</p>
          <p className="signature-line">Authorised Signature</p>
        </div>

      </div>
    </div>
  );
}