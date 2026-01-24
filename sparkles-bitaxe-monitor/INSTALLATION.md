# Installation Guide

## Prerequisites

- UmbrelOS node running
- Docker and Docker Compose installed
- Network access to your Bitcoin miners

## Installation Steps

### 1. Copy App to UmbrelOS

Copy the entire `BitaxeMonitor` directory to your UmbrelOS apps directory:
```bash
cp -r BitaxeMonitor /path/to/umbrel/apps/
```

### 2. Build and Start Services

Navigate to the app directory and start the services:
```bash
cd /path/to/umbrel/apps/BitaxeMonitor
docker-compose up -d --build
```

### 3. Access the Dashboard

Open your browser and navigate to:
```
http://your-umbrel-ip:3000
```

### 4. Configure Miners

1. Go to the **Settings** tab
2. Click **Add Miner**
3. Fill in the miner details:
   - **Name**: A friendly name for your miner
   - **Type**: Select the miner type (Bitaxe, NerdqAxe, or nano3S)
   - **IP Address**: The local IP address of your miner
   - **Port**: The API port (default: 80)
   - **API Key**: Optional, if your miner requires authentication
4. Click **Add Miner**

### 5. Set Electricity Rate

1. In the **Settings** tab
2. Enter your electricity cost per kWh (e.g., 0.12 for $0.12/kWh)
3. Click **Save Rate**

### 6. View Dashboard

Return to the **Dashboard** tab to see:
- Summary cards with totals
- List of all miners with current metrics
- Performance charts (4-hour history)
- Cost calculations

## Miner API Endpoints

The app expects the following API endpoints:

### Bitaxe Gamma 601/602
- Stats: `GET http://<ip>:<port>/api/stats`
- Device Info: `GET http://<ip>:<port>/api/device`

### NerdqAxe +/++
- Stats: `GET http://<ip>:<port>/api/v1/stats`
- Device Info: `GET http://<ip>:<port>/api/v1/info`

### nano3S (cgminer)
- Stats: `POST http://<ip>:<port>/` with JSON-RPC:
  ```json
  {
    "command": "summary",
    "parameter": ""
  }
  ```

## Troubleshooting

### Miners Not Appearing
- Check that miners are enabled in Settings
- Verify IP addresses and ports are correct
- Check network connectivity to miners
- Review backend logs: `docker-compose logs backend`

### Charts Not Loading
- Ensure at least one miner is selected
- Check that miners have been running for data collection
- Verify backend is running: `docker-compose ps`

### Data Not Updating
- Data collection runs every 30 seconds
- Check backend logs for connection errors
- Verify miner APIs are accessible

## Updating

To update the app:
```bash
cd /path/to/umbrel/apps/BitaxeMonitor
docker-compose down
git pull  # if using git
docker-compose up -d --build
```

## Uninstallation

To remove the app:
```bash
cd /path/to/umbrel/apps/BitaxeMonitor
docker-compose down
rm -rf /path/to/umbrel/apps/BitaxeMonitor
```

Note: This will remove all configuration and historical data.
