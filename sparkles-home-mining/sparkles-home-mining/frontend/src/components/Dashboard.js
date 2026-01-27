import React from 'react';
import './Dashboard.css';
import MinerCard from './MinerCard';
import AggregateStats from './AggregateStats';

function Dashboard({ devices, stats, onAddDevice, loading }) {
  // Calculate aggregate stats
  const aggregateStats = React.useMemo(() => {
    const validStats = stats.filter(s => s.stats && !s.error);
    
    return {
      totalHashrate: validStats.reduce((sum, s) => sum + (s.stats.hashrate || 0), 0),
      totalPower: validStats.reduce((sum, s) => sum + (s.stats.power || 0), 0),
      totalAccepted: validStats.reduce((sum, s) => sum + (s.stats.sharesAccepted || 0), 0),
      totalRejected: validStats.reduce((sum, s) => sum + (s.stats.sharesRejected || 0), 0),
      avgTemperature: validStats.length > 0
        ? validStats.reduce((sum, s) => sum + (s.stats.temperature || 0), 0) / validStats.length
        : 0,
      totalEfficiency: validStats.length > 0
        ? validStats.reduce((sum, s) => sum + (s.stats.efficiency || 0), 0) / validStats.length
        : 0,
      bestDifficulty: Math.max(...validStats.map(s => s.stats.bestDifficulty || 0), 0),
      deviceCount: validStats.length
    };
  }, [stats]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading devices...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Mining Dashboard</h2>
        <button className="add-device-btn" onClick={onAddDevice}>
          + Add Device
        </button>
      </div>

      {devices.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⚡</div>
          <h3>No devices configured</h3>
          <p>Add your first mining device to get started</p>
          <button className="add-device-btn primary" onClick={onAddDevice}>
            Add Device
          </button>
        </div>
      ) : (
        <>
          <AggregateStats stats={aggregateStats} />
          
          <div className="miners-grid">
            {devices.map(device => {
              const deviceStats = stats.find(s => s.device.id === device.id);
              return (
                <MinerCard
                  key={device.id}
                  device={device}
                  stats={deviceStats}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
