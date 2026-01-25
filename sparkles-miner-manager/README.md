# Miner Manager for UmbrelOS

A comprehensive management application for Bitaxe and Nano3S Bitcoin miners that runs on UmbrelOS.

## Features

- **Network Scanning**: Automatically scans your local network to discover Bitaxe and Nano3S miners
- **Device Management**: Full management interface for each discovered device
- **Firmware Management**: Upload, store, and apply firmware and web UI (web.bin) files for Bitaxe devices
- **Firmware Updates**: Update firmware and web UI (web.bin) for Bitaxe devices directly from the web interface
- **Device Control**: Adjust fan speed, frequency, voltage, and LED lights (when supported)
- **Real-time Statistics**: Monitor hashrate, temperature, fan speed, and power consumption
- **Web Interface**: Modern React-based web UI accessible through UmbrelOS

## Supported Devices

### Bitaxe Miners
- Full API support via ESP-Miner/AxeOS
- Firmware updates (OTA)
- Web UI updates (OTAWWW)
- Fan control
- Frequency and voltage adjustment
- LED light control

### Nano3S Miners
- Limited API support (varies by firmware)
- Basic statistics monitoring
- Note: Some features may not be available due to API limitations

## Installation

### For UmbrelOS

**Quick Start:** See [INSTALL.md](./INSTALL.md) for the fastest installation method.

**Detailed Guide:** See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

**Methods:**
1. **Community App Store** (Recommended) - Add via Umbrel's Community App Store feature
2. **Manual Installation** - Install directly via SSH
3. **Development** - Use umbrel-dev for testing

See the installation guides above for step-by-step instructions.

### Local Development

1. Install dependencies:
   ```bash
   npm install
   cd frontend && npm install && cd ..
   ```

2. Build the application:
   ```bash
   npm run build
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. For development with hot-reload:
   ```bash
   npm run dev
   ```

## Configuration

Environment variables:

- `PORT`: Server port (default: 3000)
- `SCAN_NETWORK_RANGE`: Network range to scan (default: auto-detected from host interface)
- `SCAN_INTERVAL`: Scan interval in minutes (default: 5)
- `DATABASE_PATH`: Path to SQLite database file

## Docker Build

Build the Docker image:

```bash
docker build -t miner-manager:latest .
```

Run with docker-compose:

```bash
docker-compose up -d
```

## API Endpoints

### Devices
- `GET /api/devices` - List all devices
- `GET /api/devices/:id` - Get device details
- `GET /api/devices/:id/statistics` - Get device statistics
- `GET /api/devices/:id/settings` - Get device settings
- `PATCH /api/devices/:id/settings` - Update device settings
- `POST /api/devices/:id/reboot` - Reboot device
- `POST /api/devices/:id/firmware/update` - Update firmware
- `GET /api/devices/:id/updates` - Check for available updates

### Network Scanning
- `POST /api/scan` - Trigger manual network scan
- `POST /api/scan/:ip` - Scan specific IP address

### Firmware Management
- `POST /api/firmware/upload` - Upload firmware file (.bin)
- `GET /api/firmware/list` - List all uploaded firmware files
- `GET /api/firmware/:filename` - Get firmware file information
- `DELETE /api/firmware/:filename` - Delete firmware file

## Network Requirements

The application requires network access to:
- Scan your local network for devices
- Communicate with discovered miners via HTTP

For UmbrelOS, the container uses `network_mode: host` to enable network scanning.

## Limitations

- **Nano3S**: Limited API support. Some features may not work depending on firmware version.
- **Network Scanning**: Requires access to the local network. Firewall rules may need adjustment.
- **Firmware Updates**: Bitaxe supports OTA updates. Nano3S updates may require manufacturer tools.

## Troubleshooting

### Devices not being discovered
- Ensure miners are on the same network as UmbrelOS
- Check firewall settings
- Verify miners are powered on and connected

### Settings not applying
- For Bitaxe: Ensure firmware supports the feature
- For Nano3S: API may not support remote settings changes

### Firmware update fails
- Ensure firmware file is valid (.bin format)
- Check device has sufficient storage
- Verify network connection is stable
- Make sure the firmware file is compatible with your device model

### Firmware file upload issues
- Only .bin files are accepted
- Maximum file size is 50MB
- Ensure the firmware directory has write permissions

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Support

For issues related to:
- **Bitaxe**: Check [ESP-Miner documentation](https://github.com/johnny9/ESP-Miner)
- **Nano3S**: Refer to manufacturer documentation
- **UmbrelOS**: Check [Umbrel documentation](https://github.com/getumbrel/umbrel)
