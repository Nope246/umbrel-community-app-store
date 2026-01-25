import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

interface Device {
  id: string;
  type: string;
  ip: string;
  hostname?: string;
  status: string;
  firmwareVersion?: string;
  model?: string;
  lastSeen: string;
}

const DeviceList: React.FC = () => {
  const navigate = useNavigate();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const response = await axios.get('/api/devices');
      return response.data.devices as Device[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const handleScan = async () => {
    try {
      await axios.post('/api/scan');
      refetch();
    } catch (error) {
      console.error('Scan failed:', error);
    }
  };

  if (isLoading) {
    return <div className="loading">Loading devices...</div>;
  }

  if (error) {
    return (
      <div className="error">
        Error loading devices. Please check your connection.
      </div>
    );
  }

  const devices = data || [];

  return (
    <div>
      <div className="page-header">
        <h1>Mining Devices</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            📊 Dashboard
          </button>
          <button className="btn btn-primary" onClick={handleScan}>
            🔍 Scan Network
          </button>
        </div>
      </div>

      {devices.length === 0 ? (
        <div className="card">
          <p>No devices found. Click "Scan Network" to discover devices.</p>
        </div>
      ) : (
        <div className="device-grid">
          {devices.map((device) => (
            <div
              key={device.id}
              className="device-card"
              onClick={() => navigate(`/device/${device.id}`)}
            >
              <h3>{device.hostname || device.ip}</h3>
              <div className="device-info">
                <div className="device-info-item">
                  <span className="device-info-label">Type:</span>
                  <span className="device-info-value">{device.type.toUpperCase()}</span>
                </div>
                <div className="device-info-item">
                  <span className="device-info-label">IP:</span>
                  <span className="device-info-value">{device.ip}</span>
                </div>
                <div className="device-info-item">
                  <span className="device-info-label">Status:</span>
                  <span className={`device-info-value status-${device.status}`}>
                    {device.status.toUpperCase()}
                  </span>
                </div>
                {device.firmwareVersion && (
                  <div className="device-info-item">
                    <span className="device-info-label">Firmware:</span>
                    <span className="device-info-value">{device.firmwareVersion}</span>
                  </div>
                )}
                {device.model && (
                  <div className="device-info-item">
                    <span className="device-info-label">Model:</span>
                    <span className="device-info-value">{device.model}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeviceList;
