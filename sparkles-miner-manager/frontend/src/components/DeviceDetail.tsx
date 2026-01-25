import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import '../App.css';

interface DeviceStatistics {
  hashrate?: number;
  temperature?: number;
  fanSpeed?: number;
  power?: number;
  uptime?: number;
  chips?: number;
}

interface DeviceSettings {
  fanSpeed?: number;
  frequency?: number;
  voltage?: number;
  lights?: {
    enabled: boolean;
    color?: string;
    brightness?: number;
  };
}

interface FirmwareFile {
  filename: string;
  originalName: string;
  size: number;
  uploadDate: string;
  type: 'firmware' | 'web';
  version?: string;
  checksum: string;
}

const DeviceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: device, isLoading: deviceLoading } = useQuery({
    queryKey: ['device', id],
    queryFn: async () => {
      const response = await axios.get(`/api/devices/${id}`);
      return response.data.device;
    },
  });

  const { data: statistics, isLoading: statsLoading } = useQuery({
    queryKey: ['device-statistics', id],
    queryFn: async () => {
      const response = await axios.get(`/api/devices/${id}/statistics`);
      return response.data.statistics as DeviceStatistics;
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const { data: settings } = useQuery({
    queryKey: ['device-settings', id],
    queryFn: async () => {
      const response = await axios.get(`/api/devices/${id}/settings`);
      return response.data.settings as DeviceSettings;
    },
  });

  const [localSettings, setLocalSettings] = useState<DeviceSettings>(settings || {});
  const [selectedFirmware, setSelectedFirmware] = useState<{ filename: string; type: 'firmware' | 'web' } | null>(null);
  const [uploadType, setUploadType] = useState<'firmware' | 'web'>('firmware');

  const { data: firmwareFiles } = useQuery({
    queryKey: ['firmware-files'],
    queryFn: async () => {
      const response = await axios.get('/api/firmware/list');
      return response.data.files as FirmwareFile[];
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: DeviceSettings) => {
      await axios.patch(`/api/devices/${id}/settings`, newSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-settings', id] });
      alert('Settings updated successfully');
    },
    onError: () => {
      alert('Failed to update settings');
    },
  });

  const rebootMutation = useMutation({
    mutationFn: async () => {
      await axios.post(`/api/devices/${id}/reboot`);
    },
    onSuccess: () => {
      alert('Device reboot initiated');
    },
    onError: () => {
      alert('Failed to reboot device');
    },
  });

  const uploadFirmwareMutation = useMutation({
    mutationFn: async (data: { file: File; type: 'firmware' | 'web' }) => {
      const formData = new FormData();
      formData.append('firmware', data.file);
      formData.append('type', data.type);
      await axios.post('/api/firmware/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['firmware-files'] });
      alert('Firmware uploaded successfully');
    },
    onError: (error: any) => {
      alert(`Failed to upload firmware: ${error.response?.data?.error || error.message}`);
    },
  });

  const updateFirmwareMutation = useMutation({
    mutationFn: async (data: { filename: string; type: 'firmware' | 'web' | 'both' }) => {
      await axios.post(`/api/devices/${id}/firmware/update`, {
        filename: data.filename,
        type: data.type,
      });
    },
    onSuccess: () => {
      alert('Firmware update initiated. The device will reboot.');
      queryClient.invalidateQueries({ queryKey: ['device', id] });
    },
    onError: (error: any) => {
      alert(`Failed to update firmware: ${error.response?.data?.error || error.message}`);
    },
  });

  const handleUpdateSettings = () => {
    updateSettingsMutation.mutate(localSettings);
  };

  const handleReboot = () => {
    if (confirm('Are you sure you want to reboot this device?')) {
      rebootMutation.mutate();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.bin') && !file.name.endsWith('.BIN')) {
      alert('Only .bin files are allowed');
      return;
    }

    uploadFirmwareMutation.mutate({ file, type: uploadType });
  };

  const handleApplyFirmware = (filename: string, type: 'firmware' | 'web') => {
    if (!confirm(`Are you sure you want to update the ${type} on this device? The device will reboot.`)) {
      return;
    }

    updateFirmwareMutation.mutate({ filename, type });
  };

  React.useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  if (deviceLoading) {
    return <div className="loading">Loading device...</div>;
  }

  if (!device) {
    return <div className="error">Device not found</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>{device.hostname || device.ip}</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          ← Back
        </button>
      </div>

      <div className="card">
        <h2>Device Information</h2>
        <div className="device-info">
          <div className="device-info-item">
            <span className="device-info-label">Type:</span>
            <span className="device-info-value">{device.type.toUpperCase()}</span>
          </div>
          <div className="device-info-item">
            <span className="device-info-label">IP Address:</span>
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
              <span className="device-info-label">Firmware Version:</span>
              <span className="device-info-value">{device.firmwareVersion}</span>
            </div>
          )}
        </div>
      </div>

      {!statsLoading && statistics && (
        <div className="stats-grid">
          {statistics.hashrate !== undefined && (
            <div className="stat-card">
              <h3>Hashrate</h3>
              <div className="value">{statistics.hashrate.toFixed(2)} TH/s</div>
            </div>
          )}
          {statistics.temperature !== undefined && (
            <div className="stat-card">
              <h3>Temperature</h3>
              <div className="value">{statistics.temperature}°C</div>
            </div>
          )}
          {statistics.fanSpeed !== undefined && (
            <div className="stat-card">
              <h3>Fan Speed</h3>
              <div className="value">{statistics.fanSpeed} RPM</div>
            </div>
          )}
          {statistics.power !== undefined && (
            <div className="stat-card">
              <h3>Power</h3>
              <div className="value">{statistics.power} W</div>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <div className="settings-section">
          <h2>Device Settings</h2>
          
          {device.type === 'bitaxe' && (
            <>
              {localSettings.fanSpeed !== undefined && (
                <div className="form-group">
                  <label>Fan Speed (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={localSettings.fanSpeed || 0}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, fanSpeed: parseInt(e.target.value) })
                    }
                  />
                </div>
              )}

              {localSettings.frequency !== undefined && (
                <div className="form-group">
                  <label>Frequency (MHz)</label>
                  <input
                    type="number"
                    value={localSettings.frequency || 0}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, frequency: parseInt(e.target.value) })
                    }
                  />
                </div>
              )}

              {localSettings.voltage !== undefined && (
                <div className="form-group">
                  <label>Voltage (V)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={localSettings.voltage || 0}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, voltage: parseFloat(e.target.value) })
                    }
                  />
                </div>
              )}

              {localSettings.lights && (
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={localSettings.lights.enabled || false}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          lights: { ...localSettings.lights, enabled: e.target.checked },
                        })
                      }
                    />
                    Enable Lights
                  </label>
                </div>
              )}

              <div className="device-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleUpdateSettings}
                  disabled={updateSettingsMutation.isPending}
                >
                  {updateSettingsMutation.isPending ? 'Updating...' : 'Update Settings'}
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleReboot}
                  disabled={rebootMutation.isPending}
                >
                  {rebootMutation.isPending ? 'Rebooting...' : 'Reboot Device'}
                </button>
              </div>
            </>
          )}

          {device.type === 'nano3s' && (
            <div>
              <p>Note: Nano3S devices have limited API support. Settings may not be available.</p>
            </div>
          )}
        </div>
      </div>

      {device.type === 'bitaxe' && (
        <div className="card">
          <div className="settings-section">
            <h2>Firmware Management</h2>
            
            <div className="form-group">
              <label>Upload Firmware File</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value as 'firmware' | 'web')}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="firmware">Firmware (.bin)</option>
                  <option value="web">Web UI (.bin)</option>
                </select>
                <input
                  type="file"
                  accept=".bin,.BIN"
                  onChange={handleFileUpload}
                  disabled={uploadFirmwareMutation.isPending}
                  style={{ padding: '8px' }}
                />
              </div>
              {uploadFirmwareMutation.isPending && (
                <p style={{ color: '#666', marginTop: '5px' }}>Uploading...</p>
              )}
            </div>

            <div style={{ marginTop: '30px' }}>
              <h3 style={{ marginBottom: '15px' }}>Available Firmware Files</h3>
              
              {firmwareFiles && firmwareFiles.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {firmwareFiles.map((file) => (
                    <div
                      key={file.filename}
                      style={{
                        padding: '15px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '600', marginBottom: '5px' }}>
                          {file.originalName}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          Type: {file.type} | 
                          Size: {(file.size / 1024 / 1024).toFixed(2)} MB | 
                          {file.version && ` Version: ${file.version} |`}
                          Uploaded: {new Date(file.uploadDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {device.type === 'bitaxe' && (
                          <>
                            {file.type === 'firmware' && (
                              <button
                                className="btn btn-primary"
                                onClick={() => handleApplyFirmware(file.filename, 'firmware')}
                                disabled={updateFirmwareMutation.isPending}
                                style={{ fontSize: '12px', padding: '6px 12px' }}
                              >
                                Apply Firmware
                              </button>
                            )}
                            {file.type === 'web' && (
                              <button
                                className="btn btn-primary"
                                onClick={() => handleApplyFirmware(file.filename, 'web')}
                                disabled={updateFirmwareMutation.isPending}
                                style={{ fontSize: '12px', padding: '6px 12px' }}
                              >
                                Apply Web UI
                              </button>
                            )}
                            {(file.type === 'firmware' || file.type === 'web') && (
                              <button
                                className="btn btn-secondary"
                                onClick={() => handleApplyFirmware(file.filename, 'both')}
                                disabled={updateFirmwareMutation.isPending}
                                style={{ fontSize: '12px', padding: '6px 12px' }}
                              >
                                Apply Both
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#666' }}>No firmware files uploaded yet. Upload a .bin file above.</p>
              )}
            </div>

            {updateFirmwareMutation.isPending && (
              <div style={{ marginTop: '15px', padding: '10px', background: '#fff3cd', borderRadius: '4px' }}>
                Firmware update in progress... The device will reboot after the update completes.
              </div>
            )}
          </div>
        </div>
      )}

      {device.type === 'nano3s' && (
        <div className="card">
          <div className="settings-section">
            <h2>Firmware Management</h2>
            <p>Note: Nano3S firmware updates may not be available via API. Please check manufacturer documentation for update methods.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceDetail;
