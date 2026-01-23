import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import MinerList from './MinerList';
import SummaryCards from './SummaryCards';
import MetricsChart from './MetricsChart';
import './Dashboard.css';

function Dashboard() {
  const [miners, setMiners] = useState([]);
  const [summary, setSummary] = useState(null);
  const [latestMetrics, setLatestMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMiners, setSelectedMiners] = useState([]); // For comparison mode
  const [compareMode, setCompareMode] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [minersRes, summaryRes, latestRes] = await Promise.all([
        api.get('/miners'),
        api.get('/metrics/summary'),
        api.get('/metrics/latest')
      ]);

      setMiners(minersRes.data);
      setSummary(summaryRes.data);
      setLatestMetrics(latestRes.data);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleMinerToggle = (minerId) => {
    setSelectedMiners(prev => {
      if (prev.includes(minerId)) {
        return prev.filter(id => id !== minerId);
      } else {
        return [...prev, minerId];
      }
    });
  };

  if (loading && !summary) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading miner data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <p>{error}</p>
        <button onClick={loadData}>Retry</button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-controls">
        <button
          className={`compare-toggle ${compareMode ? 'active' : ''}`}
          onClick={() => {
            setCompareMode(!compareMode);
            if (!compareMode) {
              setSelectedMiners(miners.map(m => m.id));
            } else {
              setSelectedMiners([]);
            }
          }}
        >
          {compareMode ? 'Exit Compare Mode' : 'Compare All Miners'}
        </button>
      </div>

      <SummaryCards summary={summary} latestMetrics={latestMetrics} />

      <div className="dashboard-grid">
        <div className="dashboard-section">
          <h2>Miner Status</h2>
          <MinerList
            miners={miners}
            latestMetrics={latestMetrics}
            selectedMiners={selectedMiners}
            onMinerToggle={handleMinerToggle}
            compareMode={compareMode}
          />
        </div>

        <div className="dashboard-section chart-section">
          <h2>Performance Metrics</h2>
          <MetricsChart
            selectedMiners={compareMode ? selectedMiners : (selectedMiners.length > 0 ? selectedMiners : miners.map(m => m.id))}
            compareMode={compareMode || selectedMiners.length > 0}
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
