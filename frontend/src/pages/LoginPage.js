import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from './AppContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useContext(AppContext);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugLog, setDebugLog] = useState([]);

  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const addLog = (msg) => {
    console.log(msg);
    setDebugLog(prev => [...prev, msg]);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async () => {
    addLog('🔵 [1] Login button clicked');
    addLog(`🔵 [2] Username: ${formData.username}, Password: ${formData.password ? '****' : 'empty'}`);
    
    setLoading(true);
    setError('');

    if (!formData.username || !formData.password) {
      addLog('❌ [3] Username or password is empty');
      setError('Please enter both username and password');
      setLoading(false);
      return;
    }

    addLog('🔵 [4] Calling login function from context...');
    
    try {
      const result = await login(formData.username, formData.password);
      addLog(`🔵 [5] Login function returned: ${JSON.stringify(result)}`);

      if (result.success) {
        addLog('✅ [6] Login successful!');
        
        // Check localStorage
        const token = localStorage.getItem('access_token');
        addLog(`✅ [7] Token in localStorage: ${token ? 'YES ✅' : 'NO ❌'}`);
        
        if (token) {
          addLog('✅ [8] Navigating to dashboard...');
          navigate('/admin-dashboard', { replace: true });
        } else {
          addLog('❌ [8] Token not in localStorage, not navigating');
        }
      } else {
        addLog(`❌ [6] Login failed: ${result.error}`);
        setError(result.error);
      }
    } catch (err) {
      addLog(`❌ [5] Exception caught: ${err.message}`);
      setError(err.message);
    }

    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Shree Mohan Enterprise</h1>
          <p style={styles.subtitle}>Login to your account</p>
        </div>

        <div style={styles.formCard}>
          {error && <div style={styles.errorBox}>{error}</div>}

          <div style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Username *</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                style={styles.input}
                placeholder="Enter your username"
                disabled={loading}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password *</label>
              <div style={styles.passwordWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  style={styles.input}
                  placeholder="Enter your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  disabled={loading}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{ ...styles.submitButton, ...(loading ? styles.disabledButton : {}) }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </div>

        {/* DEBUG LOG */}
        {debugLog.length > 0 && (
          <div style={styles.debugBox}>
            <h3>🔍 Debug Log:</h3>
            {debugLog.map((log, i) => (
              <div key={i} style={{ fontSize: '12px', fontFamily: 'monospace', marginBottom: '4px' }}>
                {log}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  card: {
    width: '100%',
    maxWidth: '500px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#000000',
    margin: '0 0 8px 0',
  },
  subtitle: {
    color: '#666',
    margin: 0,
  },
  formCard: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '20px',
  },
  errorBox: {
    padding: '12px',
    background: '#fee2e2',
    border: '1px solid #fecaca',
    color: '#dc2626',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '16px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  passwordWrapper: {
    position: 'relative',
  },
  eyeButton: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
  },
  submitButton: {
    padding: '12px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },
  disabledButton: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  debugBox: {
    background: '#f0f0f0',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    maxHeight: '300px',
    overflowY: 'auto',
  },
};