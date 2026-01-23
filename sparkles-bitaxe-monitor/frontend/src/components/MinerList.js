import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import './MinerList.css';

function MinerList({ miners, latestMetrics, selectedMiners, onMinerToggle, compareMode }) {
  const [electricityRate, setElectricityRate] = useState(0);

  useEffect(() => {
    loadElectricityRate();
  }, []);

  const loadElectricityRate = async () => {
    try {
      const res = await api.get('/config/electricity-rate');
      setElectricityRate(res.data.electricity_rate || 0);
    } catch (err) {
      console.error('Error loading electricity rate:', err);
    }
  };

  const getMinerMetrics = (minerId) => {
    return latestMetrics.find(m => m.miner_id === minerId);
  };

  const formatHashrate = (th) => {
    if (!th) return '0 TH/s';
    if (th >= 1000) {
      return `${(th / 1000).toFixed(2)} PH/s`;
    }
    return `${th.toFixed(2)} TH/s`;
  };

  const formatPower = (watts) => {
    if (!watts) return '0 W';
    if (watts >= 1000) {
      return `${(watts / 1000).toFixed(2)} kW`;
    }
    return `${watts.toFixed(0)} W`;
  };

  const calculateCost = (powerWatts) => {
    if (!powerWatts || !electricityRate) return 0;
    return (powerWatts / 1000) * electricityRate * 24; // Daily cost
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusColor = (metrics) => {
    if (!metrics) return 'unknown';
    // Simple status based on recent data
    return 'active';
  };

  if (miners.length === 0) {
    return (
      <div className="miner-list-empty">
        <p>No miners configured. Add miners in Settings.</p>
      </div>
    );
  }

  return (
    <div className="miner-list">
      {miners.map(miner => {
        const metrics = getMinerMetrics(miner.id);
        const isSelected = selectedMiners.includes(miner.id);
        const status = getStatusColor(metrics);
        const dailyCost = calculateCost(metrics?.power_watts || 0);

        return (
          <div
            key={miner.id}
            className={`miner-card ${isSelected ? 'selected' : ''} ${compareMode ? 'compare-mode' : ''}`}
            onClick={() => compareMode && onMinerToggle(miner.id)}
          >
            {compareMode && (
              <div className="miner-checkbox">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onMinerToggle(miner.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            
            <div className="miner-header">
              <h3>{miner.name}</h3>
              <span className={`status-badge status-${status}`}>
                {status}
              </span>
            </div>

            <div className="miner-type">{miner.type}</div>

            <div className="miner-metrics">
              <div className="metric-item">
                <span className="metric-label">Hashrate:</span>
                <span className="metric-value">{formatHashrate(metrics?.hashrate || 0)}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Power:</span>
                <span className="metric-value">{formatPower(metrics?.power_watts || 0)}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Shares Accepted:</span>
                <span className="metric-value">{metrics?.shares_accepted || 0}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Shares Rejected:</span>
                <span className="metric-value">{metrics?.shares_rejected || 0}</span>
              </div>
              {electricityRate > 0 && (
                <div className="metric-item">
                  <span className="metric-label">Daily Cost:</span>
                  <span className="metric-value cost">{formatCurrency(dailyCost)}</span>
                </div>
              )}
              {metrics?.temperature && (
                <div className="metric-item">
                  <span className="metric-label">Temperature:</span>
                  <span className="metric-value">{metrics.temperature.toFixed(1)}°C</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default MinerList;
