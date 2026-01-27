import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import DeviceManager from './components/DeviceManager';
import AddDeviceModal from './components/AddDeviceModal';

function App() {
  const [devices, setDevices] = useState([]);
  const [stats, setStats] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    fetchDevices();
    fetchStats();
    
    // Refresh stats every 10 seconds
    const interval = setInterval(() => {
      fetchStats();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/devices');
      const data = await response.json();
      setDevices(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching devices:', error);
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleAddDevice = async (deviceData) => {
    try {
      const response = await fetch('/api/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deviceData),
      });
      
      if (response.ok) {
        await fetchDevices();
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error adding device:', error);
    }
  };

  const handleDeleteDevice = async (id) => {
    try {
      const response = await fetch(`/api/devices/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await fetchDevices();
        await fetchStats();
      }
    } catch (error) {
      console.error('Error deleting device:', error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>⚡ Sparkles Home Mining</h1>
        <nav>
          <button
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={activeTab === 'devices' ? 'active' : ''}
            onClick={() => setActiveTab('devices')}
          >
            Devices
          </button>
        </nav>
      </header>

      <main className="App-main">
        {activeTab === 'dashboard' && (
          <Dashboard
            devices={devices}
            stats={stats}
            onAddDevice={() => setShowAddModal(true)}
            loading={loading}
          />
        )}
        
        {activeTab === 'devices' && (
          <DeviceManager
            devices={devices}
            stats={stats}
            onAddDevice={() => setShowAddModal(true)}
            onDeleteDevice={handleDeleteDevice}
            loading={loading}
          />
        )}
      </main>

      {showAddModal && (
        <AddDeviceModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddDevice}
        />
      )}
    </div>
  );
}

export default App;
