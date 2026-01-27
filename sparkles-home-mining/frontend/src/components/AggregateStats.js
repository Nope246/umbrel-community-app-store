import React from 'react';
import './AggregateStats.css';

function AggregateStats({ stats }) {
  const formatHashrate = (value) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(2)} TH/s`;
    }
    return `${value.toFixed(2)} GH/s`;
  };

  const formatEfficiency = (value) => {
    return `${value.toFixed(2)} J/TH`;
  };

  return (
    <div className="aggregate-stats">
      <div className="stat-card">
        <div className="stat-label">Total Hashrate</div>
        <div className="stat-value primary">{formatHashrate(stats.totalHashrate)}</div>
      </div>
      
      <div className="stat-card">
        <div className="stat-label">Total Power</div>
        <div className="stat-value">{stats.totalPower.toFixed(0)} W</div>
      </div>
      
      <div className="stat-card">
        <div className="stat-label">Shares Accepted</div>
        <div className="stat-value success">{stats.totalAccepted.toLocaleString()}</div>
      </div>
      
      <div className="stat-card">
        <div className="stat-label">Shares Rejected</div>
        <div className="stat-value error">{stats.totalRejected.toLocaleString()}</div>
      </div>
      
      <div className="stat-card">
        <div className="stat-label">Avg Temperature</div>
        <div className="stat-value">{stats.avgTemperature.toFixed(1)}°C</div>
      </div>
      
      <div className="stat-card">
        <div className="stat-label">Avg Efficiency</div>
        <div className="stat-value">{formatEfficiency(stats.totalEfficiency)}</div>
      </div>
      
      <div className="stat-card">
        <div className="stat-label">Best Difficulty</div>
        <div className="stat-value">{stats.bestDifficulty.toLocaleString()}</div>
      </div>
      
      <div className="stat-card">
        <div className="stat-label">Active Devices</div>
        <div className="stat-value">{stats.deviceCount}</div>
      </div>
    </div>
  );
}

export default AggregateStats;
