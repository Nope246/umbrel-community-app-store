import React, { useState } from 'react';
import './AddDeviceModal.css';

const DEVICE_TYPES = [
  { value: 'bitaxe', label: 'Bitaxe (AxeOS)' },
  { value: 'avakon', label: 'Avakon (CGMiner)' },
  { value: 'cgminer', label: 'CGMiner Compatible' }
];

function AddDeviceModal({ onClose, onAdd }) {
  const [formData, setFormData] = useState({
    ipAddress: '',
    deviceType: 'bitaxe',
    name: ''
  });
  const [errors, setErrors] = useState({});

  const validateIP = (ip) => {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = {};
    
    if (!formData.ipAddress.trim()) {
      newErrors.ipAddress = 'IP address is required';
    } else if (!validateIP(formData.ipAddress)) {
      newErrors.ipAddress = 'Please enter a valid IP address';
    }
    
    if (!formData.deviceType) {
      newErrors.deviceType = 'Device type is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onAdd({
      ipAddress: formData.ipAddress.trim(),
      deviceType: formData.deviceType,
      name: formData.name.trim() || undefined
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Mining Device</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="add-device-form">
          <div className="form-group">
            <label htmlFor="ipAddress">IP Address *</label>
            <input
              type="text"
              id="ipAddress"
              name="ipAddress"
              value={formData.ipAddress}
              onChange={handleChange}
              placeholder="192.168.1.100"
              className={errors.ipAddress ? 'error' : ''}
            />
            {errors.ipAddress && (
              <span className="error-message">{errors.ipAddress}</span>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="deviceType">Device Type *</label>
            <select
              id="deviceType"
              name="deviceType"
              value={formData.deviceType}
              onChange={handleChange}
              className={errors.deviceType ? 'error' : ''}
            >
              {DEVICE_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.deviceType && (
              <span className="error-message">{errors.deviceType}</span>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="name">Device Name (Optional)</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="My Bitaxe Miner"
            />
            <span className="form-hint">Leave empty to auto-generate</span>
          </div>
          
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              Add Device
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddDeviceModal;
