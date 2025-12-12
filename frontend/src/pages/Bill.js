import React, { useState, useEffect, useContext } from "react";
import { NepaliDatePicker } from "nepali-datepicker-reactjs";
import "nepali-datepicker-reactjs/dist/index.css";
import NepaliDate from "nepali-date-converter";
import { AppContext } from "./AppContext";

import "./Bill.css";
import logo from "./images/logo.jpg";
// adjust path & extension correctly
 // exact filename

export default function Bill() {
  const { products, fetchProducts, fetchWithAuth } = useContext(AppContext);

  const companyName = "ShreeMohan Enterprise";
  const companySubtitle = "Sports Items";
  const companyAddress = "Biratnagar, Mahendra Chowk";
  const phone = "9852063234";

  const today = new Date();
  const todayNepali = new NepaliDate(today);
  const todayNepaliString = todayNepali.format("YYYY-MM-DD");

  const [dateEN, setDateEN] = useState(today.toISOString().split("T")[0]);
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

  const availableProducts = products.filter((p) => p.stock > 0);

  const addRow = () =>
    setRows([...rows, { productId: "", particulars: "", qty: "", rate: "" }]);

  const toggleRowSelection = (i) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(i)) newSelected.delete(i);
    else newSelected.add(i);
    setSelectedRows(newSelected);
  };

  const deleteSelectedRows = () => {
    setRows(rows.filter((_, idx) => !selectedRows.has(idx)));
    setSelectedRows(new Set());
  };

  const handleProductChange = (i, productId) => {
    const copy = [...rows];
    copy[i].productId = productId;

    if (productId) {
      const product = availableProducts.find((p) => p.id === parseInt(productId));
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

  const handleQtyChange = (i, value) => {
    const copy = [...rows];
    const product = availableProducts.find((p) => p.id === parseInt(copy[i].productId));
    const qtyValue = parseInt(value) || 0;
    if (product && qtyValue > product.stock) {
      alert(`Only ${product.stock} units available for ${product.name}`);
      copy[i].qty = product.stock;
    } else {
      copy[i].qty = value;
    }
    setRows(copy);
  };

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
        .filter((r) => r.productId && r.qty && r.rate)
        .map((r) => {
          const product = products.find((p) => p.id === parseInt(r.productId));
          if (product && parseInt(r.qty) > product.stock) {
            throw new Error(`Insufficient stock for ${product.name}.`);
          }
          return {
            product: parseInt(r.productId),
            particulars: product?.name || r.particulars,
            quantity: parseInt(r.qty),
            rate: parseFloat(r.rate),
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
        items: orderItems,
      };

      const response = await fetchWithAuth("/api/orders/", {
        method: "POST",
        body: JSON.stringify(payload),
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
    document.body.classList.add("printing");
    window.print();
    setTimeout(() => {
      document.body.classList.remove("printing");
    }, 100);
  };

  return (
    <div className="bill-page">
      <div className="bill-sheet">
        {/* Header */}
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
              placeholder="Buyer address"
              className="buyer-input"
            />
          </div>
        </div>

        {/* Stock warning */}
        {availableProducts.length === 0 && (
          <div className="stock-warning">
            ⚠️ No products available in stock. Please add inventory first.
          </div>
        )}

        {/* Bill Table */}
        <div className="table-wrapper">
          <table className="bill-table">
            <thead>
              <tr>
                <th>Select</th>
                <th>S.No</th>
                <th>Product</th>
                <th>Particulars</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const amt = (parseFloat(r.qty) || 0) * (parseFloat(r.rate) || 0);
                const selectedProduct = availableProducts.find(
                  (p) => String(p.id) === String(r.productId)
                );
                const maxQty = selectedProduct ? selectedProduct.stock : 0;
                return (
                  <tr key={i}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(i)}
                        onChange={() => toggleRowSelection(i)}
                      />
                    </td>
                    <td>{i + 1}</td>
                    <td>
                      <select
                        value={r.productId}
                        onChange={(e) => handleProductChange(i, e.target.value)}
                      >
                        <option value="">-- Select Product --</option>
                        {availableProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (Stock: {p.stock})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{r.particulars || "(None selected)"}</td>
                    <td>
                      <input
                        type="number"
                        value={r.qty}
                        min="0"
                        max={maxQty}
                        onChange={(e) => handleQtyChange(i, e.target.value)}
                        disabled={!r.productId}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={r.rate}
                        min="0"
                        step="0.01"
                        onChange={(e) => handleRateChange(i, e.target.value)}
                      />
                    </td>
                    <td>{amt.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Controls */}
        <div className="controls-section">
          <button onClick={addRow} className="btn btn-add">
            + Add Row
          </button>
          <button
            onClick={deleteSelectedRows}
            disabled={selectedRows.size === 0}
            className="btn btn-delete"
          >
            Delete Selected ({selectedRows.size})
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
