# Quick Installation Guide

## Fastest Way: Community App Store

1. **Fork the Community App Store Template**
   - Go to https://github.com/getumbrel/umbrel-community-app-store
   - Click "Fork"

2. **Add Your App**
   ```bash
   git clone https://github.com/YOUR_USERNAME/umbrel-community-app-store.git
   cd umbrel-community-app-store
   ```
   - Copy your `miner-manager` folder to `apps/miner-manager`
   - Commit and push:
     ```bash
     git add apps/miner-manager
     git commit -m "Add Miner Manager"
     git push
     ```

3. **Add Store to Umbrel**
   - Open Umbrel Dashboard
   - Go to **App Store** → **Community App Stores**
   - Click **Add a Store**
   - Enter: `https://github.com/YOUR_USERNAME/umbrel-community-app-store`
   - Click **Add Store**

4. **Install**
   - Find "Miner Manager" in the App Store
   - Click **Install**

## Manual Installation (SSH)

1. **SSH into Umbrel**
   ```bash
   ssh umbrel@YOUR_UMBREL_IP
   ```

2. **Copy App Files**
   ```bash
   mkdir -p ~/umbrel/app-stores/custom-apps/miner-manager
   # Then from your local machine:
   # scp -r /path/to/miner-manager/* umbrel@IP:~/umbrel/app-stores/custom-apps/miner-manager/
   ```

3. **Install via Umbrel Dashboard**
   - Refresh Umbrel dashboard
   - App should appear for installation

## After Installation

1. Open Miner Manager from Umbrel dashboard
2. App will automatically scan for miners
3. Access dashboard to view statistics

For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)
