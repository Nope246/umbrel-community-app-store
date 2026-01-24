import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import './SummaryCards.css';

function SummaryCards({ summary, latestMetrics }) {
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

  const calculateCost = (powerWatts) => {
    if (!powerWatts || !electricityRate) return 0;
    // Cost per hour = (Watts / 1000) * rate per kWh
    return (powerWatts / 1000) * electricityRate;
  };

  const calculateDailyCost = (powerWatts) => {
    return calculateCost(powerWatts) * 24;
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const totals = summary?.totals || {};
  const totalPower = totals.total_power || 0;
  const totalHashrate = totals.total_hashrate || 0;
  const hourlyCost = calculateCost(totalPower);
  const dailyCost = calculateDailyCost(totalPower);

  return (
    <div className="summary-cards">
      <div className="summary-card">
        <div className="card-icon hashrate">⚡</div>
        <div className="card-content">
          <div className="card-label">Total Hashrate</div>
          <div className="card-value">{formatHashrate(totalHashrate)}</div>
        </div>
      </div>

      <div className="summary-card">
        <div className="card-icon power">🔌</div>
        <div className="card-content">
          <div className="card-label">Total Power</div>
          <div className="card-value">{formatPower(totalPower)}</div>
        </div>
      </div>

      <div className="summary-card">
        <div className="card-icon shares">✅</div>
        <div className="card-content">
          <div className="card-label">Shares Accepted</div>
          <div className="card-value">{totals.total_shares_accepted || 0}</div>
        </div>
      </div>

      <div className="summary-card">
        <div className="card-icon shares-rejected">❌</div>
        <div className="card-content">
          <div className="card-label">Shares Rejected</div>
          <div className="card-value">{totals.total_shares_rejected || 0}</div>
        </div>
      </div>

      {electricityRate > 0 && (
        <>
          <div className="summary-card">
            <div className="card-icon cost">💰</div>
            <div className="card-content">
              <div className="card-label">Hourly Cost</div>
              <div className="card-value">{formatCurrency(hourlyCost)}</div>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon cost">💵</div>
            <div className="card-content">
              <div className="card-label">Daily Cost</div>
              <div className="card-value">{formatCurrency(dailyCost)}</div>
            </div>
          </div>
        </>
      )}

      <div className="summary-card">
        <div className="card-icon miners">🏭</div>
        <div className="card-content">
          <div className="card-label">Active Miners</div>
          <div className="card-value">{totals.miner_count || 0}</div>
        </div>
      </div>
    </div>
  );
}

export default SummaryCards;
