# Home Mining Monitor

A premium dashboard to monitor your home mining devices. Supports Bitaxe (AxeOS) and BraiinsOS monitoring.

## Features

- Real-time hashrate, temperature, and status monitoring
- Beautiful glassmorphism interface
- Network statistics and mining odds calculations
- Support for Bitaxe and BraiinsOS devices
- Persistent miner configuration

## Installation on UmbrelOS

1. This app is available in the UmbrelOS Community App Store
2. Search for "Home Mining Monitor" 
3. Click install and the app will be available at port 3333

## Development

### Prerequisites
- Docker
- Node.js 18+
- Python 3.11+

### Local Development

1. Clone the repository
2. Run the backend:
   ```bash
   cd app/backend
   pip install -r requirements.txt
   uvicorn main:app --reload --port 3333
   ```

3. Run the frontend (in another terminal):
   ```bash
   cd app/frontend
   npm install
   npm run dev
   ```

### Docker Build

```bash
docker build -t nope-home-mining .
docker run -p 3333:3333 nope-home-mining
```

## Configuration

Add your miners through the web interface by providing:
- IP address
- Miner type (Bitaxe or BraiinsOS)

## API Endpoints

- `GET /api/miners` - List all configured miners
- `POST /api/miners` - Add a new miner
- `DELETE /api/miners/{id}` - Remove a miner
- `GET /api/network-stats` - Bitcoin network statistics
- `GET /api/odds` - Mining probability calculations

## Support

For issues and support, please visit: https://github.com/Nope246/nope-home-mining/issues
