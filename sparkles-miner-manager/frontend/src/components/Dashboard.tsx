import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

interface Dashboard {
  bitcoin: {
    price: number;
    priceChange24h: number;
    lastUpdated: Date;
    network: {
      difficulty: number;
      blockHeight: number;
      blockReward: number;
      hashRate: number;
      blocksUntilHalving: number;
      nextHalvingDate: Date;
    };
  };
  mining: {
    totalHashRate: number;
    totalPower: number;
    deviceCount: number;
    activeDevices: number;
    averageTemperature: number;
  };
  shares: {
    allTime: { total: number; approved: number; rejected: number };
    today: { total: number; approved: number; rejected: number };
    thisMonth: { total: number; approved: number; rejected: number };
    thisYear: { total: number; approved: number; rejected: number };
  };
  blockEstimate: {
    estimatedDays: number;
    estimatedHours: number;
    probability: number;
    estimatedDate: Date;
  };
  profitability: {
    dailyBTC: number;
    dailyUSD: number;
    monthlyBTC: number;
    monthlyUSD: number;
    yearlyBTC: number;
    yearlyUSD: number;
    powerCostDailyUSD: number;
    powerCostMonthlyUSD: number;
    powerCostYearlyUSD: number;
    profitDailyUSD: number;
    profitMonthlyUSD: number;
    profitYearlyUSD: number;
  };
  devices: Array<{
    id: string;
    type: string;
    ip: string;
    hostname?: string;
    status: string;
    statistics: any;
  }>;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await axios.get('/api/dashboard');
      return response.data.dashboard as Dashboard;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const formatNumber = (num: number, decimals: number = 2): string => {
    if (num === Infinity || isNaN(num)) return 'N/A';
    if (num >= 1e9) return (num / 1e9).toFixed(decimals) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(decimals) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(decimals) + 'K';
    return num.toFixed(decimals);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatBTC = (btc: number): string => {
    if (btc < 0.00001) return btc.toExponential(2) + ' BTC';
    return btc.toFixed(8) + ' BTC';
  };

  const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  if (isLoading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error || !data) {
    return <div className="error">Error loading dashboard data</div>;
  }

  const { bitcoin, mining, shares, blockEstimate, profitability } = data;

  return (
    <div>
      <div className="page-header">
        <h1>Mining Dashboard</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/devices')}>
          View Devices
        </button>
      </div>

      {/* Bitcoin Price Section */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h2 style={{ marginBottom: '15px' }}>Bitcoin Price</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>
              {formatCurrency(bitcoin.price)}
            </div>
            <div style={{ color: bitcoin.priceChange24h >= 0 ? '#28a745' : '#dc3545', marginTop: '5px' }}>
              {bitcoin.priceChange24h >= 0 ? '↑' : '↓'} {Math.abs(bitcoin.priceChange24h).toFixed(2)}%
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              Updated: {formatDate(bitcoin.lastUpdated)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Network Hash Rate</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
              {formatNumber(bitcoin.network.hashRate)} EH/s
            </div>
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Difficulty</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
              {formatNumber(bitcoin.network.difficulty / 1e12, 2)}T
            </div>
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Block Reward</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
              {bitcoin.network.blockReward.toFixed(4)} BTC
            </div>
          </div>
        </div>
      </div>

      {/* Mining Statistics */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <h3>Total Hash Rate</h3>
          <div className="value">{mining.totalHashRate.toFixed(2)} TH/s</div>
          <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.9 }}>
            {((mining.totalHashRate / bitcoin.network.hashRate) * 100).toFixed(6)}% of network
          </div>
        </div>
        <div className="stat-card">
          <h3>Total Power</h3>
          <div className="value">{mining.totalPower.toFixed(0)} W</div>
          <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.9 }}>
            {(mining.totalPower / 1000).toFixed(2)} kW
          </div>
        </div>
        <div className="stat-card">
          <h3>Active Devices</h3>
          <div className="value">{mining.activeDevices} / {mining.deviceCount}</div>
        </div>
        <div className="stat-card">
          <h3>Avg Temperature</h3>
          <div className="value">{mining.averageTemperature.toFixed(1)}°C</div>
        </div>
      </div>

      {/* Share Statistics */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h2 style={{ marginBottom: '15px' }}>Share Statistics</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Today</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {shares.today.approved} / {shares.today.total}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {shares.today.total > 0 
                ? ((shares.today.rejected / shares.today.total) * 100).toFixed(2) + '% rejected'
                : 'No shares'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>This Month</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {shares.thisMonth.approved} / {shares.thisMonth.total}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {shares.thisMonth.total > 0
                ? ((shares.thisMonth.rejected / shares.thisMonth.total) * 100).toFixed(2) + '% rejected'
                : 'No shares'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>This Year</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {shares.thisYear.approved} / {shares.thisYear.total}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {shares.thisYear.total > 0
                ? ((shares.thisYear.rejected / shares.thisYear.total) * 100).toFixed(2) + '% rejected'
                : 'No shares'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>All Time</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {shares.allTime.approved} / {shares.allTime.total}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {shares.allTime.total > 0
                ? ((shares.allTime.rejected / shares.allTime.total) * 100).toFixed(2) + '% rejected'
                : 'No shares'}
            </div>
          </div>
        </div>
      </div>

      {/* Block Estimate */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h2 style={{ marginBottom: '15px' }}>Block Finding Estimate</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Estimated Time</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
              {blockEstimate.estimatedDays === Infinity 
                ? 'N/A'
                : blockEstimate.estimatedDays < 1
                  ? `${Math.round(blockEstimate.estimatedHours)} hours`
                  : `${Math.round(blockEstimate.estimatedDays)} days`}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Estimated Date</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
              {formatDate(blockEstimate.estimatedDate)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>24h Probability</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
              {blockEstimate.probability.toFixed(4)}%
            </div>
          </div>
        </div>
      </div>

      {/* Profitability */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h2 style={{ marginBottom: '15px' }}>Estimated Profitability</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Daily Revenue</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#28a745' }}>
              {formatCurrency(profitability.dailyUSD)}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {formatBTC(profitability.dailyBTC)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Monthly Revenue</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#28a745' }}>
              {formatCurrency(profitability.monthlyUSD)}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {formatBTC(profitability.monthlyBTC)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Yearly Revenue</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#28a745' }}>
              {formatCurrency(profitability.yearlyUSD)}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {formatBTC(profitability.yearlyBTC)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Daily Power Cost</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#dc3545' }}>
              {formatCurrency(profitability.powerCostDailyUSD)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Daily Profit</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: profitability.profitDailyUSD >= 0 ? '#28a745' : '#dc3545' }}>
              {formatCurrency(profitability.profitDailyUSD)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Monthly Profit</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: profitability.profitMonthlyUSD >= 0 ? '#28a745' : '#dc3545' }}>
              {formatCurrency(profitability.profitMonthlyUSD)}
            </div>
          </div>
        </div>
      </div>

      {/* Devices List */}
      <div className="card">
        <h2 style={{ marginBottom: '15px' }}>Mining Devices</h2>
        <div className="device-grid">
          {data.devices.map((device) => (
            <div
              key={device.id}
              className="device-card"
              onClick={() => navigate(`/device/${device.id}`)}
            >
              <h3>{device.hostname || device.ip}</h3>
              <div className="device-info">
                <div className="device-info-item">
                  <span className="device-info-label">Type:</span>
                  <span className="device-info-value">{device.type.toUpperCase()}</span>
                </div>
                <div className="device-info-item">
                  <span className="device-info-label">Status:</span>
                  <span className={`device-info-value status-${device.status}`}>
                    {device.status.toUpperCase()}
                  </span>
                </div>
                {device.statistics?.hashrate && (
                  <div className="device-info-item">
                    <span className="device-info-label">Hash Rate:</span>
                    <span className="device-info-value">{device.statistics.hashrate.toFixed(2)} TH/s</span>
                  </div>
                )}
                {device.statistics?.temperature && (
                  <div className="device-info-item">
                    <span className="device-info-label">Temperature:</span>
                    <span className="device-info-value">{device.statistics.temperature}°C</span>
                  </div>
                )}
                {device.statistics?.power && (
                  <div className="device-info-item">
                    <span className="device-info-label">Power:</span>
                    <span className="device-info-value">{device.statistics.power} W</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
