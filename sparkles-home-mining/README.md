# Sparkles Home Mining - UmbrelOS App

A dashboard for monitoring Home Bitcoin miners on your network. Supports Bitaxe AxeOS devices and Avakon/CGMiner compatible miners.

## Features

- **Multi-Miner Support**: Monitor Bitaxe (AxeOS) and Avakon/CGMiner compatible devices
- **Real-time Stats**: View power consumption, hashrate, shares, temperature, and efficiency
- **Aggregate Dashboard**: See combined statistics across all your miners
- **Device Management**: Easily add, remove, and manage mining devices
- **Beautiful UI**: Modern, responsive dashboard with dark theme

## Supported Miners

- **Bitaxe (AxeOS)**: Version 2.12.2 and compatible
- **Avakon Family**: nano3s and other CGMiner-compatible devices

## Pre-Upload to GitHub Checklist

Before uploading this app to GitHub for the UmbrelOS App Store, ensure the following:

### 1. Docker Configuration

- ✅ **Dockerfile** is present and properly configured
- ✅ **docker-compose.yml** is present with correct app ID prefix (`sparkles-`)
- ✅ **.dockerignore** is configured to exclude unnecessary files

### 2. Build the Docker Image - Step-by-Step Guide

Before uploading, you need to build the Docker image to test that everything works correctly. Here's a beginner-friendly guide:

#### Prerequisites
- Docker Desktop must be installed and running
- You should see the Docker whale icon in your system tray/menu bar
- Make sure Docker Desktop is started (the icon should not have a red dot)

#### Method 1: Using Docker Desktop GUI (Easiest for Beginners)

**Step 1: Open Docker Desktop**
- Launch Docker Desktop application
- Wait for it to fully start (you'll see "Docker Desktop is running" in the status)

**Step 2: Open Terminal in Docker Desktop**
- In Docker Desktop, click on the terminal icon (or go to Settings → General → check "Use Docker Compose V2")
- Alternatively, you can use your regular terminal/command prompt

**Step 3: Navigate to Your Project Folder**
- Open your terminal/command prompt
- Navigate to the project directory. You need to be **inside** the `sparkles-home-mining` folder (not just the `UmbrelOS` folder)
  
  **Check if you're in the right place:**
  - Type `ls` (Mac/Linux) or `dir` (Windows) to see files
  - You should see `Dockerfile` in the list
  - If you don't see `Dockerfile`, you're in the wrong directory!
  
  **Navigate to the correct folder:**
  ```bash
  cd /Users/brentparks/Desktop/Projects/Programing/UmbrelOS/sparkles-home-mining
  ```
  (Replace with your actual project path)
  
  **Or if you're already in the UmbrelOS folder:**
  ```bash
  cd sparkles-home-mining
  ```
  
  **Verify you're in the right place:**
  ```bash
  ls
  ```
  You should see: `Dockerfile`, `docker-compose.yml`, `package.json`, `README.md`, `server/`, `frontend/`

**Step 4: Build the Docker Image**
- In your terminal, type this command **EXACTLY** as shown (including the period at the end):
  ```bash
  docker build -t sparkles-home-mining .
  ```
  
  ⚠️ **IMPORTANT:** Make sure to include the **period (`.`)** at the very end of the command! This tells Docker to look for the Dockerfile in the current directory.
  
  - `docker build` tells Docker to build an image
  - `-t sparkles-home-mining` gives the image a name/tag
  - The **`.`** (period/dot) at the end is REQUIRED - it means "use the Dockerfile in the current directory"
  
  **Common Error:** If you forget the period, you'll get: `ERROR: docker: 'docker buildx build' requires 1 argument`
  
  **Correct:** `docker build -t sparkles-home-mining .` ✅ (with period)
  
  **Wrong:** `docker build -t sparkles-home-mining` ❌ (missing period)
  
**Step 5: Wait for Build to Complete**
- This will take several minutes the first time (5-15 minutes depending on your internet speed)
- Docker is downloading base images and installing all dependencies
- You'll see lots of output showing the build progress
- Wait until you see "Successfully tagged sparkles-home-mining:latest"

**Step 6: Verify the Image was Created**
- In Docker Desktop, click on the "Images" tab in the left sidebar
- You should see `sparkles-home-mining` in the list of images
- If you see it, the build was successful! ✅

#### Method 2: Using Command Line Only

If you prefer using the command line directly:

**Step 1: Open Terminal/Command Prompt**
- On Mac: Open Terminal app
- On Windows: Open Command Prompt or PowerShell
- On Linux: Open your terminal

**Step 2: Navigate to Project Directory**
```bash
cd /path/to/sparkles-home-mining
```
(Replace with your actual project path)

**Step 3: Build the Image**
```bash
docker build -t sparkles-home-mining .
```

⚠️ **IMPORTANT:** Don't forget the **period (`.`)** at the end! It's required.

**Step 4: Wait for Completion**
- Watch the output - it will show each step of the build
- Look for "Successfully tagged sparkles-home-mining:latest" at the end

**Step 5: Verify Build Success**
```bash
docker images
```
- This lists all your Docker images
- You should see `sparkles-home-mining` in the list

#### Troubleshooting Build Issues

**If you get "ERROR: docker: 'docker buildx build' requires 1 argument":**
- ⚠️ **You forgot the period at the end of the command!**
- Make sure your command ends with a space and then a period: `.`
- Correct: `docker build -t sparkles-home-mining .`
- Wrong: `docker build -t sparkles-home-mining` (missing the period)

**If you get "Cannot connect to Docker daemon":**
- Make sure Docker Desktop is running
- Check the Docker Desktop status in your system tray

**If you get "Dockerfile not found" or "no such file or directory":**
- ⚠️ **You're in the wrong directory!**
- You need to be **inside** the `sparkles-home-mining` folder, not just the `UmbrelOS` folder
- Type `ls` (Mac/Linux) or `dir` (Windows) to see files in current directory
- You should see `Dockerfile` in the list
- If you don't see `Dockerfile`, navigate to the correct folder:
  ```bash
  cd sparkles-home-mining
  ```
  (or use the full path to the sparkles-home-mining folder)
- Then try the build command again
- Also make sure you included the period (`.`) at the end of the build command

**If the build fails:**
- Read the error message carefully
- Common issues: network problems, disk space, or missing files
- Make sure all project files are present

#### What Happens During the Build?

The Docker build process automatically:
1. Downloads the Node.js base image
2. Installs system dependencies
3. Copies your project files
4. Installs Node.js dependencies (both root and frontend)
5. Builds the React frontend
6. Creates the final Docker image

**You don't need to run any npm commands manually** - Docker handles everything!

#### Optional: Test Run the Container

After building, you can optionally test that the container runs:

```bash
docker-compose up
```

This will start the container and you can access the app at `http://localhost:3000`

To stop it, press `Ctrl+C` in the terminal.

### 3. Verify App Structure

Ensure your app directory structure matches UmbrelOS requirements:

```
sparkles-home-mining/
├── Dockerfile
├── docker-compose.yml
├── package.json
├── README.md
├── server/
│   ├── index.js
│   └── miners/
│       ├── bitaxe.js
│       └── cgminer.js
└── frontend/
    ├── package.json
    ├── public/
    ├── src/
    └── build/  (generated automatically during Docker build)
```

### 4. UmbrelOS App Store Configuration

- ✅ **umbrel-app.yml** is present with correct app metadata
- ✅ App ID is `sparkles-home-mining` (matches directory name)
- ✅ Port is set to `3000` in both `umbrel-app.yml` and `docker-compose.yml`
- ✅ Icon path is set to `icon.png`
- ✅ App ID prefix is `sparkles-` (as required)
- ✅ Directory name matches app ID format

### 5. Environment Variables

The app uses the following environment variables (set by UmbrelOS):
- `APP_PORT`: Port for the web interface (default: 3000)
- `NODE_ENV`: Environment mode (production)

### 6. Data Persistence

Device configurations are stored in `/app/data/devices.json` which is mounted as a volume in `docker-compose.yml`.

### 7. Network Configuration

The app connects to the `umbrel` Docker network to communicate with other UmbrelOS services and access devices on your local network.

## Installation

1. Add this app to your UmbrelOS App Store repository
2. Users can install it through the UmbrelOS App Store
3. Once installed, the app will automatically open when clicked in UmbrelOS
4. Access the dashboard and add your mining devices

## Testing the App

### Testing Locally (localhost:3000)

After building and starting the Docker container:

1. **Build the image:**
   ```bash
   docker build -t sparkles-home-mining .
   ```

2. **Start the container:**
   ```bash
   docker-compose up
   ```

3. **Access the app:**
   - Open your web browser
   - Navigate to: `http://localhost:3000`
   - You should see the Sparkles Home Mining dashboard
   - The app should load and display the device management interface

### Testing in UmbrelOS

1. **Upload to your UmbrelOS App Store repository**
2. **Install the app through UmbrelOS App Store**
3. **Click the app icon** - it should automatically open in a new tab/window
4. **Verify the app loads** - you should see the dashboard with the "Add Device" button

### Troubleshooting

**If localhost:3000 shows nothing:**
- Make sure the Docker container is running: `docker ps`
- Check the container logs: `docker-compose logs`
- Verify the frontend build exists in the container: `docker exec sparkles-home-mining ls -la /app/frontend/build`
- Rebuild the image if the build directory is missing

**If the app doesn't open in UmbrelOS:**
- Verify `umbrel-app.yml` has the correct port (3000)
- Check that `docker-compose.yml` port mapping matches
- Ensure the app ID in `umbrel-app.yml` matches the directory name
- Verify the icon file exists at the root level (`icon.png`)

## Adding Devices

1. Click the "Add Device" button
2. Enter the IP address of your miner
3. Select the device type (Bitaxe or Avakon/CGMiner)
4. Optionally provide a custom name
5. Click "Add Device"

The dashboard will automatically start polling your devices every 10 seconds for updated statistics.

## API Endpoints

- `GET /api/devices` - Get all configured devices
- `POST /api/devices` - Add a new device
- `PUT /api/devices/:id` - Update a device
- `DELETE /api/devices/:id` - Remove a device
- `GET /api/stats` - Get stats for all devices
- `GET /api/stats/:id` - Get stats for a specific device

## Development - Running the App Locally

Once you've built the Docker image (see section 2 above), you can run the app locally:

### Step-by-Step: Running with Docker Compose

**Step 1: Make sure Docker Desktop is running**
- Check that Docker Desktop is started and running

**Step 2: Open Terminal**
- Open your terminal/command prompt

**Step 3: Navigate to Project Directory**
```bash
cd /path/to/sparkles-home-mining
```

**Step 4: Start the Container**
```bash
docker-compose up
```

**What this does:**
- Reads the `docker-compose.yml` file
- Starts the container with the correct settings
- Shows you the logs/output in real-time

**Step 5: Access the App**
- Open your web browser
- Go to: `http://localhost:3000`
- You should see the Sparkles Home Mining dashboard!

**Step 6: Stop the Container**
- In the terminal where it's running, press `Ctrl+C`
- Or in a new terminal, run: `docker-compose down`

### Other Useful Commands

**Build and start in one command:**
```bash
docker-compose up --build
```
(This rebuilds the image if needed, then starts it)

**Run in background (detached mode):**
```bash
docker-compose up -d
```
(The container runs in the background - you won't see logs)

**View logs when running in background:**
```bash
docker-compose logs
```

**Stop the container:**
```bash
docker-compose down
```

**Stop and remove everything (including volumes):**
```bash
docker-compose down -v
```

### Troubleshooting

**Port already in use error:**
- Another application is using port 3000
- Change the port in `docker-compose.yml` or stop the other application

**Container won't start:**
- Check Docker Desktop is running
- Make sure you built the image first (see section 2)
- Check the logs: `docker-compose logs`

**Note:** All dependencies and builds are handled automatically by Docker - no npm commands needed!

## License

MIT

## Support

For issues and questions, please open an issue on the GitHub repository.
