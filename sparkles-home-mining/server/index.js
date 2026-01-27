const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { fetchBitaxeStats } = require('./miners/bitaxe');
const { fetchCgminerStats } = require('./miners/cgminer');

const app = express();
// Server always listens on port 3000 inside the container
// UmbrelOS maps APP_PORT externally to this port via docker-compose
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, '../data');
const DEVICES_FILE = path.join(DATA_DIR, 'devices.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());

// Check if frontend build exists
const buildPath = path.join(__dirname, '../frontend/build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
} else {
  console.warn('WARNING: frontend/build directory not found. Frontend will not be served.');
  console.warn('Make sure to build the frontend first or run the Docker build process.');
}

// Initialize devices file if it doesn't exist
if (!fs.existsSync(DEVICES_FILE)) {
  fs.writeFileSync(DEVICES_FILE, JSON.stringify([], null, 2));
}

// Helper function to read devices
function readDevices() {
  try {
    const data = fs.readFileSync(DEVICES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Helper function to write devices
function writeDevices(devices) {
  fs.writeFileSync(DEVICES_FILE, JSON.stringify(devices, null, 2));
}

// API Routes

// Get all devices
app.get('/api/devices', (req, res) => {
  const devices = readDevices();
  res.json(devices);
});

// Add a new device
app.post('/api/devices', (req, res) => {
  const { ipAddress, deviceType, name } = req.body;
  
  if (!ipAddress || !deviceType) {
    return res.status(400).json({ error: 'IP address and device type are required' });
  }

  const devices = readDevices();
  const newDevice = {
    id: Date.now().toString(),
    ipAddress,
    deviceType,
    name: name || `${deviceType}-${ipAddress}`,
    createdAt: new Date().toISOString()
  };
  
  devices.push(newDevice);
  writeDevices(devices);
  
  res.json(newDevice);
});

// Update a device
app.put('/api/devices/:id', (req, res) => {
  const { id } = req.params;
  const { ipAddress, deviceType, name } = req.body;
  
  const devices = readDevices();
  const deviceIndex = devices.findIndex(d => d.id === id);
  
  if (deviceIndex === -1) {
    return res.status(404).json({ error: 'Device not found' });
  }
  
  devices[deviceIndex] = {
    ...devices[deviceIndex],
    ipAddress: ipAddress || devices[deviceIndex].ipAddress,
    deviceType: deviceType || devices[deviceIndex].deviceType,
    name: name || devices[deviceIndex].name,
    updatedAt: new Date().toISOString()
  };
  
  writeDevices(devices);
  res.json(devices[deviceIndex]);
});

// Delete a device
app.delete('/api/devices/:id', (req, res) => {
  const { id } = req.params;
  
  const devices = readDevices();
  const filteredDevices = devices.filter(d => d.id !== id);
  
  if (filteredDevices.length === devices.length) {
    return res.status(404).json({ error: 'Device not found' });
  }
  
  writeDevices(filteredDevices);
  res.json({ success: true });
});

// Get stats for all devices
app.get('/api/stats', async (req, res) => {
  const devices = readDevices();
  const statsPromises = devices.map(async (device) => {
    try {
      let stats;
      if (device.deviceType === 'bitaxe') {
        stats = await fetchBitaxeStats(device.ipAddress);
      } else if (device.deviceType === 'avakon' || device.deviceType === 'cgminer') {
        stats = await fetchCgminerStats(device.ipAddress);
      } else {
        return { device, error: 'Unknown device type' };
      }
      
      return {
        device,
        stats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        device,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  });
  
  const results = await Promise.all(statsPromises);
  res.json(results);
});

// Get stats for a single device
app.get('/api/stats/:id', async (req, res) => {
  const { id } = req.params;
  const devices = readDevices();
  const device = devices.find(d => d.id === id);
  
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }
  
  try {
    let stats;
    if (device.deviceType === 'bitaxe') {
      stats = await fetchBitaxeStats(device.ipAddress);
    } else if (device.deviceType === 'avakon' || device.deviceType === 'cgminer') {
      stats = await fetchCgminerStats(device.ipAddress);
    } else {
      return res.status(400).json({ error: 'Unknown device type' });
    }
    
    res.json({
      device,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve React app for root and all other routes (SPA routing)
// This must come after all API routes
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, '../frontend/build/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(500).send(`
      <html>
        <head><title>Build Required</title></head>
        <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <h1>Frontend Build Not Found</h1>
          <p>The frontend build directory is missing. Please build the application using Docker:</p>
          <pre style="background: #f5f5f5; padding: 20px; border-radius: 5px; display: inline-block; text-align: left;">
docker build -t sparkles-home-mining .
docker-compose up
          </pre>
          <p style="margin-top: 20px; color: #666;">
            Or if running locally, build the frontend first:<br/>
            <code>cd frontend && npm install && npm run build</code>
          </p>
        </body>
      </html>
    `);
  }
});

// Catch-all route for React Router (client-side routing)
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../frontend/build/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(500).send(`
      <html>
        <head><title>Build Required</title></head>
        <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <h1>Frontend Build Not Found</h1>
          <p>The frontend build directory is missing. Please build the application using Docker:</p>
          <pre style="background: #f5f5f5; padding: 20px; border-radius: 5px; display: inline-block; text-align: left;">
docker build -t sparkles-home-mining .
docker-compose up
          </pre>
        </body>
      </html>
    `);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
