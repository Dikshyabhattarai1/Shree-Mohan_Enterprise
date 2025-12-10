import React from "react";
import { useNavigate } from "react-router-dom";
import "./LoginSelection.css";

function LoginSelection() {
  const navigate = useNavigate();

  return (
    <div className="select-container">
      <div className="select-card">
        <h1 className="select-title">Welcome to ShreeMohan Enterprise</h1>
        <p className="select-subtitle">Choose your login type</p>

        <div className="select-buttons">
          <button
            className="select-btn user-btn"
            onClick={() => navigate("/user-login")}
          >
            User Login
          </button>

          <button
            className="select-btn admin-btn"
            onClick={() => navigate("/admin-login")}
          >
            Admin Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginSelection;
