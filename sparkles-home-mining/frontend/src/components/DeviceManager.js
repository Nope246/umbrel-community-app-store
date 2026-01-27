import React from 'react';
import './DeviceManager.css';
import MinerCard from './MinerCard';

function DeviceManager({ devices, stats, onAddDevice, onDeleteDevice, loading }) {
  if (loading) {
    return (
      <div className="device-manager-loading">
        <div className="spinner"></div>
        <p>Loading devices...</p>
      </div>
    );
  }

  return (
    <div className="device-manager">
      <div className="device-manager-header">
        <h2>Device Management</h2>
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
        <div className="devices-list">
          {devices.map(device => {
            const deviceStats = stats.find(s => s.device.id === device.id);
            return (
              <div key={device.id} className="device-item">
                <MinerCard device={device} stats={deviceStats} />
                <button
                  className="delete-device-btn"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to remove ${device.name}?`)) {
                      onDeleteDevice(device.id);
                    }
                  }}
                >
                  Delete Device
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DeviceManager;
