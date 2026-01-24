import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import ThemeContext from '../contexts/ThemeContext';
import { themes } from '../utils/theme';
import './Settings.css';

function Settings() {
  const [miners, setMiners] = useState([]);
  const [electricityRate, setElectricityRate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMiner, setEditingMiner] = useState(null);
  
  const [newMiner, setNewMiner] = useState({
    name: '',
    type: 'bitaxe',
    ip_address: '',
    port: 80,
    api_key: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [minersRes, rateRes] = await Promise.all([
        api.get('/miners'),
        api.get('/config/electricity-rate')
      ]);
      setMiners(minersRes.data);
      setElectricityRate(rateRes.data.electricity_rate || '');
    } catch (err) {
      setError('Failed to load settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveElectricityRate = async (e) => {
    e.preventDefault();
    try {
      await api.put('/config/electricity-rate', {
        electricity_rate: parseFloat(electricityRate)
      });
      setSuccess('Electricity rate saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save electricity rate');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleAddMiner = async (e) => {
    e.preventDefault();
    try {
      await api.post('/miners', newMiner);
      setSuccess('Miner added successfully');
      setShowAddForm(false);
      setNewMiner({
        name: '',
        type: 'bitaxe',
        ip_address: '',
        port: 80,
        api_key: ''
      });
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add miner');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDeleteMiner = async (id) => {
    if (!window.confirm('Are you sure you want to delete this miner?')) {
      return;
    }
    try {
      await api.delete(`/miners/${id}`);
      setSuccess('Miner deleted successfully');
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to delete miner');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleToggleMiner = async (miner) => {
    try {
      await api.put(`/miners/${miner.id}`, {
        enabled: !miner.enabled
      });
      loadData();
    } catch (err) {
      setError('Failed to update miner');
      setTimeout(() => setError(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="settings-loading">
        <div className="spinner"></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <ThemeContext.Consumer>
      {({ theme, setTheme }) => (
        <div className="settings">
          {(error || success) && (
            <div className={`message ${error ? 'error' : 'success'}`}>
              {error || success}
            </div>
          )}

          <div className="settings-section">
            <h2>Theme</h2>
            <div className="theme-selector">
              {themes.map(t => (
                <button
                  key={t.value}
                  className={`theme-button ${theme === t.value ? 'active' : ''}`}
                  onClick={() => setTheme(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-section">
            <h2>Electricity Cost</h2>
            <form onSubmit={handleSaveElectricityRate} className="settings-form">
              <div className="form-group">
                <label htmlFor="electricity-rate">
                  Cost per kWh (USD):
                </label>
                <input
                  id="electricity-rate"
                  type="number"
                  step="0.001"
                  min="0"
                  value={electricityRate}
                  onChange={(e) => setElectricityRate(e.target.value)}
                  placeholder="0.12"
                />
              </div>
              <button type="submit" className="btn-primary">
                Save Rate
              </button>
            </form>
            {electricityRate && (
              <p className="help-text">
                This rate will be used to calculate operational costs based on power consumption.
              </p>
            )}
          </div>

          <div className="settings-section">
            <div className="section-header">
              <h2>Miners</h2>
              <button
                className="btn-primary"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                {showAddForm ? 'Cancel' : 'Add Miner'}
              </button>
            </div>

            {showAddForm && (
              <form onSubmit={handleAddMiner} className="settings-form">
                <div className="form-group">
                  <label htmlFor="miner-name">Name:</label>
                  <input
                    id="miner-name"
                    type="text"
                    required
                    value={newMiner.name}
                    onChange={(e) => setNewMiner({ ...newMiner, name: e.target.value })}
                    placeholder="Miner 1"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="miner-type">Type:</label>
                  <select
                    id="miner-type"
                    value={newMiner.type}
                    onChange={(e) => setNewMiner({ ...newMiner, type: e.target.value })}
                    required
                  >
                    <option value="bitaxe">Bitaxe Gamma 601/602</option>
                    <option value="nerdaxe">NerdqAxe +</option>
                    <option value="nerdaxe+">NerdqAxe ++</option>
                    <option value="nano3s">nano3S (cgminer)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="miner-ip">IP Address:</label>
                  <input
                    id="miner-ip"
                    type="text"
                    required
                    pattern="^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$"
                    value={newMiner.ip_address}
                    onChange={(e) => setNewMiner({ ...newMiner, ip_address: e.target.value })}
                    placeholder="192.168.1.100"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="miner-port">Port:</label>
                  <input
                    id="miner-port"
                    type="number"
                    required
                    min="1"
                    max="65535"
                    value={newMiner.port}
                    onChange={(e) => setNewMiner({ ...newMiner, port: parseInt(e.target.value) })}
                    placeholder="80"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="miner-api-key">API Key (optional):</label>
                  <input
                    id="miner-api-key"
                    type="password"
                    value={newMiner.api_key}
                    onChange={(e) => setNewMiner({ ...newMiner, api_key: e.target.value })}
                    placeholder="Leave empty if not required"
                  />
                </div>

                <button type="submit" className="btn-primary">
                  Add Miner
                </button>
              </form>
            )}

            <div className="miners-list">
              {miners.length === 0 ? (
                <p className="empty-state">No miners configured</p>
              ) : (
                miners.map(miner => (
                  <div key={miner.id} className="miner-item">
                    <div className="miner-info">
                      <h3>{miner.name}</h3>
                      <p>{miner.type} - {miner.ip_address}:{miner.port}</p>
                    </div>
                    <div className="miner-actions">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={miner.enabled}
                          onChange={() => handleToggleMiner(miner)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                      <button
                        className="btn-danger"
                        onClick={() => handleDeleteMiner(miner.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </ThemeContext.Consumer>
  );
}

export default Settings;
