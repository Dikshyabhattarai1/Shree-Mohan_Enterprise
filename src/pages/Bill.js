import React, { useState } from "react";
import { NepaliDatePicker } from "nepali-datepicker-reactjs"; // optional - install if you want Nepali picker
import "nepali-datepicker-reactjs/dist/index.css";
import "./Bill.css";
import Logo from "./images/logo.png.jpg";

export default function Bill() {
  // Header / company
  const [companyName, setCompanyName] = useState("ShreeMahendra Enterprise");
  const [companySubtitle, setCompanySubtitle] = useState("Sports Items");
  const [companyAddress, setCompanyAddress] = useState("Biratnagar, Mahendra Chowk");
  const [phone, setPhone] = useState("9852063234");

  // Dates & buyer info
  const [dateEN, setDateEN] = useState("");
  const [dateNP, setDateNP] = useState("");
  const [buyerName, setBuyerName] = useState("");

  // Table rows (start with 17 rows like the sample)
  const initialRows = Array.from({ length: 10 }).map(() => ({
    particulars: "",
    qty: "",
    rate: "",
  }));
  const [rows, setRows] = useState(initialRows);

  // Add and remove rows
  const addRow = () => setRows([...rows, { particulars: "", qty: "", rate: "" }]);
  const removeRow = (i) => setRows(rows.filter((_, idx) => idx !== i));

  // Update a row and auto-calc amount
  const updateRow = (i, field, value) => {
    const copy = [...rows];
    copy[i][field] = value;
    setRows(copy);
  };

  // Derived amounts
  const amounts = rows.map((r) => {
    const q = parseFloat(r.qty) || 0;
    const rt = parseFloat(r.rate) || 0;
    return q * rt;
  });
  const subtotal = amounts.reduce((s, a) => s + a, 0);

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="app-wrapper">
      <div className="bill-page">
        <div className="bill-sheet">

          {/* Top header */}
          <div className="top-row">
            <div className="logo-col">
              {/* FIXED: using imported Logo */}
              <img src={Logo} alt="logo" className="logo-img" />
            </div>

            <div className="title-col">
              <input className="company-input company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              <input className="company-input company-sub" value={companySubtitle} onChange={(e) => setCompanySubtitle(e.target.value)} />
              <input className="company-input company-addr" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} />
              <input className="company-input company-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            <div className="date-col">
              <label className="small-label">Date (EN)</label>
              <input type="date" className="date-input" value={dateEN} onChange={(e) => setDateEN(e.target.value)} />
              <label className="small-label">Date (NP)</label>

              <div className="np-picker">
                <NepaliDatePicker
                  value={dateNP}
                  onChange={(val) => setDateNP(val)}
                  options={{ calenderLocale: "ne", valueLocale: "en" }}
                />
              </div>
            </div>
          </div>

          {/* Buyer & small boxes */}
          <div className="meta-row">
            <div className="ms-box">
              <label className="ms-label">M/s</label>
              <input className="ms-input" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Buyer name and address" />
            </div>

            <div className="billno-empty"></div>
          </div>

          {/* Table */}
          <div className="table-wrap">
            <table className="bill-table">
              <thead>
                <tr>
                  <th className="col-sno">S.No</th>
                  <th className="col-part">Particulars</th>
                  <th className="col-qty">Qty</th>
                  <th className="col-rate">Rate</th>
                  <th className="col-amt">Amount</th>
                  <th className="no-print col-act">Action</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r, i) => {
                  const q = parseFloat(r.qty) || 0;
                  const rt = parseFloat(r.rate) || 0;
                  const amt = q * rt;
                  return (
                    <tr key={i}>
                      <td className="td-center">{i + 1}</td>
                      <td>
                        <input className="td-input part-input" value={r.particulars} onChange={(e) => updateRow(i, "particulars", e.target.value)} />
                      </td>
                      <td>
                        <input className="td-input small" type="number" value={r.qty} onChange={(e) => updateRow(i, "qty", e.target.value)} />
                      </td>
                      <td>
                        <input className="td-input small" type="number" value={r.rate} onChange={(e) => updateRow(i, "rate", e.target.value)} />
                      </td>
                      <td className="td-center amt-cell">{amt.toFixed(2)}</td>
                      <td className="no-print td-center">
                        <button className="remove-btn" onClick={() => removeRow(i)}>Remove</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Controls */}
          <div className="controls no-print">
            <button className="add-btn" onClick={addRow}>+ Add Row</button>
            <button className="print-btn" onClick={handlePrint}>Print / Save PDF</button>
          </div>

          {/* Summary */}
          <div className="summary-row">
            <div className="left-foot">
              <div className="terms">Terms & Conditions: ____________________________</div>
            </div>

            <div className="summary-box">
              <div className="summary-line"><span>Subtotal</span><span>Rs. {subtotal.toFixed(2)}</span></div>
              <div className="summary-line grand"><span>Grand Total</span><span>Rs. {subtotal.toFixed(2)}</span></div>
            </div>
          </div>

          {/* Signature */}
          <div className="sign-row">
            <div className="sign-left"></div>
            <div className="sign-right">
              <div className="auth">For {companyName}</div>
              <div className="sig-space">Authorised Signature</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
