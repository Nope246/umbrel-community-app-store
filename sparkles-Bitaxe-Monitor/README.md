# Bitaxe Monitor - UmbrelOS App

A privacy-focused, security-first dashboard for monitoring Bitcoin miners on your UmbrelOS node.

## Supported Miners

- **Bitaxe Gamma 601/602**
- **NerdqAxe +/++**
- **nano3S** (cgminer framework)

## Features

- 🔒 **Read-only access** - Secure monitoring without write permissions
- 📊 **Real-time charts** - 4-hour historical data visualization
- 💰 **Cost calculation** - Calculate operational costs based on power consumption
- 🎨 **Multi-theme support** - Light, dark, and custom themes
- 📱 **Screen-optimized** - Designed for display screens with large, readable fonts
- 🔐 **Privacy-focused** - All data stays local on your UmbrelOS node

## Metrics Displayed

- Hashrate (TH/s)
- Power consumption (Watts)
- Shares accepted/rejected
- Operational cost (configurable rate)
- Device comparison graphs

## Security

- Read-only API access to miners
- Input validation and sanitization
- Local-only data storage
- No external data transmission
- Encrypted configuration storage

## Installation

See [INSTALLATION.md](INSTALLATION.md) for detailed installation instructions.

Quick start:
1. Copy this app to your UmbrelOS apps directory
2. Run `docker-compose up -d --build`
3. Access the dashboard at `http://your-umbrel-ip:3000`
4. Configure miners in the Settings page
5. Set your electricity cost rate
6. Start monitoring!

**Note**: Replace `icon.png` with your app icon (recommended: 512x512px PNG).

## Development

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm start
```

## License

MIT
