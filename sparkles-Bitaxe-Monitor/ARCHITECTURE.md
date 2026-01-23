# Architecture Overview

## System Architecture

Bitaxe Monitor is built as a containerized application with a clear separation between backend and frontend services.

```
┌─────────────────────────────────────────────────────────┐
│                    UmbrelOS Node                         │
│                                                           │
│  ┌──────────────┐         ┌──────────────┐             │
│  │   Frontend   │────────▶│   Backend    │             │
│  │  (React)     │  HTTP   │  (Node.js)   │             │
│  │  Port 3000   │         │  Port 3001   │             │
│  └──────────────┘         └──────────────┘             │
│                                 │                        │
│                                 │ SQLite                 │
│                                 ▼                        │
│                          ┌──────────────┐               │
│                          │   Database   │               │
│                          │  (SQLite)    │               │
│                          └──────────────┘               │
│                                                          │
└──────────────────────────────────────────────────────────┘
                              │
                              │ HTTP (Read-Only)
                              ▼
                    ┌─────────────────┐
                    │  Bitcoin Miners │
                    │                 │
                    │  • Bitaxe       │
                    │  • NerdqAxe     │
                    │  • nano3S       │
                    └─────────────────┘
```

## Components

### Backend (`/backend`)

**Technology Stack:**
- Node.js with Express
- SQLite for time-series data storage
- Axios for HTTP requests to miners

**Key Modules:**
- `server.js` - Main Express server with security middleware
- `database.js` - SQLite database management with 4-hour retention
- `miners/collector.js` - Data collection service (runs every 30 seconds)
- `miners/base.js` - Base miner class with common functionality
- `miners/bitaxe.js` - Bitaxe Gamma implementation
- `miners/nerdaxe.js` - NerdqAxe implementation
- `miners/nano3s.js` - nano3S (cgminer) implementation
- `routes/miners.js` - Miner CRUD operations
- `routes/metrics.js` - Metrics query endpoints
- `routes/config.js` - Configuration management

**Security Features:**
- Helmet.js for security headers
- Rate limiting (100 req/15min)
- Input validation with express-validator
- CORS restrictions
- Read-only miner access

### Frontend (`/frontend`)

**Technology Stack:**
- React 18
- Chart.js for data visualization
- Axios for API communication
- CSS Variables for theming

**Key Components:**
- `App.js` - Main application with routing
- `Dashboard.js` - Main dashboard view
- `SummaryCards.js` - Summary statistics cards
- `MinerList.js` - List of miners with metrics
- `MetricsChart.js` - Time-series charts
- `Settings.js` - Configuration interface

**Features:**
- Multi-theme support (light, dark, high-contrast)
- Responsive design
- Screen-optimized for displays
- Real-time data updates (30-second refresh)

## Data Flow

1. **Data Collection:**
   - Collector service polls each miner every 30 seconds
   - Data is normalized and stored in SQLite
   - Old data (>4 hours) is automatically cleaned up

2. **Data Retrieval:**
   - Frontend requests data via REST API
   - Backend queries SQLite database
   - Data is returned as JSON

3. **Visualization:**
   - Chart.js renders time-series data
   - Multiple miners can be compared
   - Metrics can be filtered (hashrate, power, shares)

## Database Schema

### `miners` Table
- `id` - Primary key
- `name` - Friendly name
- `type` - Miner type (bitaxe, nerdaxe, nano3s)
- `ip_address` - Miner IP
- `port` - API port
- `api_key` - Optional API key
- `enabled` - Active status
- `created_at`, `updated_at` - Timestamps

### `metrics` Table
- `id` - Primary key
- `miner_id` - Foreign key to miners
- `timestamp` - Data collection time
- `hashrate` - Hashrate in TH/s
- `power_watts` - Power consumption
- `shares_accepted` - Accepted shares count
- `shares_rejected` - Rejected shares count
- `temperature` - Device temperature (optional)

### `config` Table
- `key` - Configuration key (primary key)
- `value` - Configuration value (JSON or string)
- `updated_at` - Last update timestamp

## API Endpoints

### Miners
- `GET /api/miners` - List all miners
- `GET /api/miners/:id` - Get specific miner
- `POST /api/miners` - Add new miner
- `PUT /api/miners/:id` - Update miner
- `DELETE /api/miners/:id` - Delete miner

### Metrics
- `GET /api/metrics` - Get metrics (optional: ?miner_id=X&hours=4)
- `GET /api/metrics/summary` - Get summary statistics
- `GET /api/metrics/latest` - Get latest metrics for all miners
- `GET /api/metrics/:minerId` - Get metrics for specific miner

### Configuration
- `GET /api/config` - Get all configuration
- `GET /api/config/:key` - Get specific config value
- `PUT /api/config/:key` - Update config value
- `GET /api/config/electricity-rate` - Get electricity rate
- `PUT /api/config/electricity-rate` - Set electricity rate

## Security Architecture

### Read-Only Design
- All miner API calls are read-only
- No write operations to miners
- Future write operations will require separate permission layer

### Input Validation
- All inputs validated server-side
- IP address format validation
- Port range validation
- SQL injection prevention via parameterized queries

### Network Security
- Rate limiting on all API endpoints
- CORS restricted to frontend URL
- Security headers via Helmet
- Local network communication only

### Data Privacy
- All data stored locally
- No external data transmission
- Automatic data cleanup (4-hour retention)
- Encrypted configuration storage

## Deployment

The application is containerized using Docker Compose:
- Backend: Node.js Alpine image
- Frontend: Nginx serving React build
- Data: Persistent volume for SQLite database
- Network: Internal bridge network for service communication

## Future Enhancements

- Write operations with permission system
- Alerting system
- Extended data retention options
- Export functionality
- Mobile-responsive improvements
- Additional miner types support
