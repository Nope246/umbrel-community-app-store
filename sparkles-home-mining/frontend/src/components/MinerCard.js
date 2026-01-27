import React from 'react';
import './MinerCard.css';

function MinerCard({ device, stats }) {
  const hasError = stats?.error;
  const minerStats = stats?.stats || {};

  const formatHashrate = (value, unit) => {
    if (!value) return '0 ' + (unit || 'GH/s');
    if (unit === 'TH/s' || value >= 1000) {
      return `${(value / 1000).toFixed(2)} TH/s`;
    }
    return `${value.toFixed(2)} ${unit || 'GH/s'}`;
  };

  const formatEfficiency = (value) => {
    if (!value) return '0 J/TH';
    return `${value.toFixed(2)} J/TH`;
  };

  const getStatusColor = () => {
    if (hasError) return '#ef5350';
    if (minerStats.status === 'mining' || minerStats.status === 'S') return '#66bb6a';
    return '#ffa726';
  };

  return (
    <div className={`miner-card ${hasError ? 'error' : ''}`}>
      <div className="miner-card-header">
        <div>
          <h3>{device.name}</h3>
          <p className="device-type">{device.deviceType.toUpperCase()}</p>
        </div>
        <div className="status-indicator" style={{ backgroundColor: getStatusColor() }}></div>
      </div>

      {hasError ? (
        <div className="miner-error">
          <p>⚠️ Unable to connect</p>
          <p className="error-message">{stats.error}</p>
          <p className="device-ip">{device.ipAddress}</p>
        </div>
      ) : (
        <>
          <div className="miner-info">
            <div className="info-row">
              <span className="info-label">Model:</span>
              <span className="info-value">{minerStats.model || 'Unknown'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Device Name:</span>
              <span className="info-value">{minerStats.deviceName || device.name}</span>
            </div>
            <div className="info-row">
              <span className="info-label">IP Address:</span>
              <span className="info-value">{device.ipAddress}</span>
            </div>
          </div>

          <div className="miner-stats-grid">
            <div className="stat-item">
              <div className="stat-icon">⚡</div>
              <div className="stat-content">
                <div className="stat-title">Power</div>
                <div className="stat-number">{minerStats.power || 0} {minerStats.powerUnit || 'W'}</div>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon">🔨</div>
              <div className="stat-content">
                <div className="stat-title">Hashrate</div>
                <div className="stat-number primary">
                  {formatHashrate(minerStats.hashrate, minerStats.hashrateUnit)}
                </div>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-title">Accepted</div>
                <div className="stat-number success">
                  {(minerStats.sharesAccepted || 0).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon">❌</div>
              <div className="stat-content">
                <div className="stat-title">Rejected</div>
                <div className="stat-number error">
                  {(minerStats.sharesRejected || 0).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon">🌡️</div>
              <div className="stat-content">
                <div className="stat-title">Temperature</div>
                <div className="stat-number">
                  {minerStats.temperature || 0} {minerStats.temperatureUnit || '°C'}
                </div>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-title">Efficiency</div>
                <div className="stat-number">{formatEfficiency(minerStats.efficiency)}</div>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon">🎯</div>
              <div className="stat-content">
                <div className="stat-title">Best Difficulty</div>
                <div className="stat-number">
                  {(minerStats.bestDifficulty || 0).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <div className="stat-title">Session Accepted</div>
                <div className="stat-number">
                  {(minerStats.sessionAccepted || 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default MinerCard;
