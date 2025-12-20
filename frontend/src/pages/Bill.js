import React, { useState, useEffect, useContext } from "react";
import { NepaliDatePicker } from "nepali-datepicker-reactjs";
import "nepali-datepicker-reactjs/dist/index.css";
import NepaliDate from "nepali-date-converter";
import { AppContext } from "./AppContext";
import "./Bill.css";
import logo from "./images/logo.jpg";
import signature from "./images/signature.jpg";

export default function Bill() {
  const { products, fetchProducts, fetchWithAuth } = useContext(AppContext);
  const companyName = "ShreeMohan Enterprise";
  const companyAddress = "Biratnagar, Mahendra Chowk";
  const companySubtitle = "Sports Items";
  const phone = "9852063234";

  const today = new Date();
  const todayNepali = new NepaliDate(today);
  const todayNepaliString = todayNepali.format("YYYY-MM-DD");

  const [dateEN, setDateEN] = useState(today.toISOString().split("T")[0]);
  const [dateNP, setDateNP] = useState(todayNepaliString);
  const [buyerName, setBuyerName] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const initialRows = [{ productId: "", particulars: "", qty: "", rate: "" }];
  const [rows, setRows] = useState(initialRows);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [printTime, setPrintTime] = useState("");

  useEffect(() => {
    fetchProducts();
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

  const handleParticularsChange = (i, value) => {
    const copy = [...rows];
    copy[i].particulars = value;
    setRows(copy);
  };

  const handleQtyChange = (i, value) => {
    const copy = [...rows];
    const product = availableProducts.find((p) => p.id === parseInt(copy[i].productId));
    const qtyValue = parseInt(value) || 0;

    if (value !== "" && qtyValue === 0) {
      alert("Quantity must be greater than 0");
      return;
    }

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

  const amounts = rows.map((r) => (parseInt(r.qty) || 0) * (parseInt(r.rate) || 0));
  const subtotal = amounts.reduce((s, a) => s + a, 0);

  const handleSaveOrder = async () => {
    if (!buyerName.trim()) {
      alert("Please enter buyer name");
      return;
    }

    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(buyerName.trim())) {
      alert("Customer name can only contain letters and spaces.");
      return;
    }

    try {
      const orderItems = rows
        .filter((r) => r.productId && r.qty && r.rate && parseInt(r.qty) > 0)
        .map((r) => {
          const product = products.find((p) => p.id === parseInt(r.productId));
          const qty = parseInt(r.qty);

          if (qty <= 0) {
            throw new Error(`Quantity must be greater than 0 for ${r.particulars}.`);
          }

          if (product && qty > product.stock) {
            throw new Error(`Insufficient stock for ${product.name}.`);
          }

          return {
            product: parseInt(r.productId),
            particulars: r.particulars,
            quantity: qty,
            rate: parseInt(r.rate),
          };
        });

      if (orderItems.length === 0) {
        alert("Please select at least one product with quantity > 0 and rate");
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
    const now = new Date();
    const timeString = now.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    setPrintTime(timeString);

    document.body.classList.add("printing");

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.body.classList.remove("printing");
        setPrintTime("");
      }, 100);
    }, 50);
  };

  return (
    <div className="bill-page">
      <div className="bill-sheet">
        {printTime && <div className="print-timestamp">{printTime}</div>}

        <div className="bill-header">
          <img src={logo} alt="Logo" className="company-logo" />
          <div className="header-text">
            <h1 className="company-name">{companyName}</h1>
            <p className="company-addr">{companyAddress}</p>
            <p className="company-sub">{companySubtitle}</p>
            <p className="company-phone">Ph: {phone}</p>
          </div>
          <div className="date-section">
            <div className="date-item">
              <label>Date (EN):</label>
              <input
                type="date"
                value={dateEN}
                onChange={(e) => setDateEN(e.target.value)}
                className="date-input"
              />
            </div>
            <div className="date-item">
              <label>Date (NP):</label>
              <NepaliDatePicker
                value={dateNP}
                onChange={(val) => setDateNP(val)}
                options={{ calenderLocale: "ne", valueLocale: "en" }}
              />
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="info-section">
          <div className="info-row">
            <div className="info-item">
              <label>Customer:</label>
              <input
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Customer name"
                className="info-input"
              />
            </div>
            <div className="info-item">
              <label>Address:</label>
              <input
                value={buyerAddress}
                onChange={(e) => setBuyerAddress(e.target.value)}
                placeholder="Customer address"
                className="info-input"
              />
            </div>
          </div>
        </div>

        {availableProducts.length === 0 && (
          <div className="stock-warning">⚠️ No products in stock</div>
        )}

        {/* Table */}
        <div className="table-wrapper">
          <table className="bill-table">
            <thead>
              <tr>
                <th className="no-print th-check">☑</th>
                <th className="th-sno">SN</th>
                <th className="th-product">Product</th>
                <th className="th-desc">Description</th>
                <th className="th-qty">Qty</th>
                <th className="th-rate">Rate</th>
                <th className="th-amount">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const amt = (parseInt(r.qty) || 0) * (parseInt(r.rate) || 0);
                const selectedProduct = availableProducts.find(
                  (p) => String(p.id) === String(r.productId)
                );
                const maxQty = selectedProduct ? selectedProduct.stock : 0;

                return (
                  <tr key={i}>
                    <td className="no-print td-check">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(i)}
                        onChange={() => toggleRowSelection(i)}
                      />
                    </td>
                    <td className="td-sno">{i + 1}</td>
                    <td className="td-product">
                      <select
                        value={r.productId}
                        onChange={(e) => handleProductChange(i, e.target.value)}
                        className="product-select screen-only"
                      >
                        <option value="">--</option>
                        {availableProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.stock})
                          </option>
                        ))}
                      </select>
                      <span className="print-only product-name-print">
                        {r.particulars || "-"}
                      </span>
                    </td>
                    <td className="td-desc">
                      <input
                        type="text"
                        value={r.particulars}
                        onChange={(e) => handleParticularsChange(i, e.target.value)}
                        placeholder="Description"
                        className="desc-input"
                      />
                    </td>
                    <td className="td-qty">
                      <input
                        type="number"
                        value={r.qty}
                        min="1"
                        max={maxQty}
                        onChange={(e) => handleQtyChange(i, e.target.value)}
                        disabled={!r.productId}
                        className="qty-input"
                      />
                    </td>
                    <td className="td-rate">
                      <input
                        type="number"
                        value={r.rate}
                        min="0"
                        onChange={(e) => handleRateChange(i, e.target.value)}
                        className="rate-input"
                      />
                    </td>
                    <td className="td-amount">{amt}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Controls */}
        <div className="controls-section no-print">
          <button onClick={addRow} className="btn btn-add">+ Add Row</button>
          <button
            onClick={deleteSelectedRows}
            disabled={selectedRows.size === 0}
            className="btn btn-delete"
          >
            Delete ({selectedRows.size})
          </button>
          <button
            onClick={handleSaveOrder}
            disabled={saving || availableProducts.length === 0}
            className="btn btn-save"
          >
            {saving ? "Saving..." : "Save Order"}
          </button>
          <button onClick={handlePrint} className="btn btn-print">Print</button>
        </div>

        <div className="total-section">
          <div className="total-row">
            <span className="total-label">Grand Total:</span>
            <span className="total-amount">Rs. {subtotal}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="bill-footer">
          <div className="signature">
            <div className="signature-line"></div>
            <img src={signature} alt="Signature" className="signature-logo" />
            <p>Authorized Signature</p>
          </div>
        </div>

        <div className="thank-you">
          <p>Thank you for visiting us!</p>
        </div>
      </div>
    </div>
  );
}