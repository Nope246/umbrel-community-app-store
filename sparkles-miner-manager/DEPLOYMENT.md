# Deployment Guide for UmbrelOS

This guide will walk you through deploying Miner Manager to your UmbrelOS node.

## Prerequisites

- A running UmbrelOS node
- SSH access to your Umbrel node (for manual installation)
- Git installed on your local machine

## Method 1: Install via Community App Store (Recommended for Testing)

### Step 1: Prepare Your App Package

1. Ensure all files are committed to a Git repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. Fork the [Umbrel Community App Store](https://github.com/getumbrel/umbrel-community-app-store) template

3. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/umbrel-community-app-store.git
   cd umbrel-community-app-store
   ```

4. Copy your app folder into the community app store:
   ```bash
   # Copy the entire miner-manager folder (without .git) to the store
   cp -r /path/to/miner-manager ./apps/miner-manager
   # Remove .git if copied
   rm -rf ./apps/miner-manager/.git
   ```

5. Commit and push:
   ```bash
   git add apps/miner-manager
   git commit -m "Add Miner Manager app"
   git push
   ```

### Step 2: Add Community App Store to Umbrel

1. Open your Umbrel dashboard
2. Go to **App Store** → **Community App Stores**
3. Click **Add a Store**
4. Enter your repository URL: `https://github.com/YOUR_USERNAME/umbrel-community-app-store`
5. Click **Add Store**

### Step 3: Install the App

1. In your Umbrel dashboard, go to **App Store**
2. Find **Miner Manager** in the list
3. Click **Install**
4. Wait for the installation to complete

## Method 2: Manual Installation via SSH

### Step 1: SSH into Your Umbrel Node

```bash
ssh umbrel@<your-umbrel-ip>
```

### Step 2: Navigate to the App Store Directory

```bash
cd ~/umbrel/app-stores
```

### Step 3: Create a Directory for Your App

```bash
mkdir -p custom-apps/miner-manager
cd custom-apps/miner-manager
```

### Step 4: Transfer App Files

From your local machine, use `scp` or `rsync`:

```bash
# From your local machine
scp -r /path/to/miner-manager/* umbrel@<your-umbrel-ip>:~/umbrel/app-stores/custom-apps/miner-manager/
```

Or using `rsync`:
```bash
rsync -avz --exclude='node_modules' --exclude='.git' \
  /path/to/miner-manager/ \
  umbrel@<your-umbrel-ip>:~/umbrel/app-stores/custom-apps/miner-manager/
```

### Step 5: Build and Install

Back on your Umbrel node:

```bash
cd ~/umbrel/app-stores/custom-apps/miner-manager

# Umbrel will handle the build and installation
# The app should appear in your Umbrel dashboard after a refresh
```

### Step 6: Install via Umbrel UI

1. Open your Umbrel dashboard
2. The app should appear in the App Store or you can install it manually
3. Click **Install**

## Method 3: Development Installation (Using umbrel-dev)

For development and testing:

### Step 1: Clone Umbrel Repository

```bash
git clone https://github.com/getumbrel/umbrel.git
cd umbrel
```

### Step 2: Add Your App

```bash
cp -r /path/to/miner-manager ./app-store/miner-manager
```

### Step 3: Run Development Environment

Follow Umbrel's development setup instructions to run `umbrel-dev`

## File Structure Required for Umbrel

Your app directory must contain:

```
miner-manager/
├── umbrel-app.yml      # App manifest (required)
├── docker-compose.yml  # Docker configuration (required)
├── Dockerfile          # Build instructions (required)
├── package.json        # Node.js dependencies
├── tsconfig.json       # TypeScript configuration
├── src/                # Source code
├── frontend/           # Frontend source
└── README.md           # Documentation
```

## Important Notes

1. **Network Access**: The app requires `network_mode: host` to scan your local network for miners. This is configured in `docker-compose.yml`.

2. **Persistent Storage**: Data is stored in volumes:
   - `/data` - Database and device information
   - `/app/logs` - Application logs
   - `/app/firmware` - Uploaded firmware files

3. **Port**: The app runs on port 3000, which Umbrel will proxy through its own interface.

4. **Environment Variables**: You can customize:
   - `SCAN_NETWORK_RANGE` - Network range to scan (default: auto-detected)
   - `SCAN_INTERVAL` - Scan interval in minutes (default: 5)
   - `POWER_COST_PER_KWH` - Electricity cost for profitability calculations

## Troubleshooting

### App Not Showing in Store

- Ensure `umbrel-app.yml` is properly formatted (YAML syntax)
- Check that the app ID is unique and lowercase
- Verify all required files are present

### Build Failures

- Check Docker logs: `docker logs miner-manager`
- Ensure all dependencies in `package.json` are correct
- Verify TypeScript compilation with `npm run build:backend`

### Network Scanning Not Working

- Verify `network_mode: host` is set in `docker-compose.yml`
- Check firewall rules on your Umbrel node
- Ensure miners are on the same network as Umbrel

### Access Issues

- The app is accessible through Umbrel's UI proxy
- No need to access port 3000 directly
- Check Umbrel's app logs in the dashboard

## Updating the App

### Via Community App Store

1. Update your app repository
2. Increment version in `umbrel-app.yml`
3. Push changes
4. In Umbrel, click **Update** on the app

### Via Manual Installation

1. Update files on your Umbrel node
2. Increment version in `umbrel-app.yml`
3. Rebuild the container:
   ```bash
   cd ~/umbrel/app-stores/custom-apps/miner-manager
   docker-compose down
   docker-compose up -d --build
   ```

## Getting Help

- Check [Umbrel Community Forum](https://community.getumbrel.com)
- Review [Umbrel Apps Documentation](https://github.com/getumbrel/umbrel-apps)
- Check app logs in Umbrel dashboard
- Review Docker logs: `docker logs miner-manager`

## Next Steps

Once installed:

1. Access Miner Manager from your Umbrel dashboard
2. The app will automatically scan your network for miners
3. Configure settings if needed
4. Start managing your mining devices!
