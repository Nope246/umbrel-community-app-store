import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import api from '../utils/api';
import './MetricsChart.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function MetricsChart({ selectedMiners, compareMode }) {
  const [metrics, setMetrics] = useState([]);
  const [miners, setMiners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metricType, setMetricType] = useState('hashrate'); // hashrate, power, shares

  useEffect(() => {
    loadMiners();
  }, []);

  useEffect(() => {
    if (selectedMiners.length > 0 && miners.length > 0) {
      loadMetrics();
      const interval = setInterval(loadMetrics, 30000);
      return () => clearInterval(interval);
    }
  }, [selectedMiners, metricType, miners]);

  const loadMiners = async () => {
    try {
      const res = await api.get('/miners');
      setMiners(res.data);
    } catch (err) {
      console.error('Error loading miners:', err);
    }
  };

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const promises = selectedMiners.map(minerId =>
        api.get(`/metrics/${minerId}`, { params: { hours: 4 } })
      );
      const responses = await Promise.all(promises);
      
      const allMetrics = [];
      responses.forEach((res, index) => {
        const minerId = selectedMiners[index];
        const miner = miners.find(m => m.id === minerId);
        res.data.forEach(metric => {
          allMetrics.push({
            ...metric,
            minerName: miner?.name || `Miner ${minerId}`
          });
        });
      });
      
      // Sort by timestamp
      allMetrics.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      setMetrics(allMetrics);
    } catch (err) {
      console.error('Error loading metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    if (metrics.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    // Group metrics by miner
    const metricsByMiner = {};
    selectedMiners.forEach(minerId => {
      const miner = miners.find(m => m.id === minerId);
      const minerName = miner?.name || `Miner ${minerId}`;
      metricsByMiner[minerId] = {
        name: minerName,
        data: metrics.filter(m => m.miner_id === minerId)
      };
    });

    // Get unique timestamps
    const timestamps = [...new Set(metrics.map(m => m.timestamp))].sort();
    const labels = timestamps.map(ts => {
      const date = new Date(ts);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    });

    // Generate colors for each miner
    const colors = [
      '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
      '#06b6d4', '#f97316', '#ec4899', '#84cc16', '#6366f1'
    ];

    const datasets = selectedMiners.map((minerId, index) => {
      const minerData = metricsByMiner[minerId];
      const color = colors[index % colors.length];
      
      const data = timestamps.map(timestamp => {
        const metric = minerData.data.find(m => m.timestamp === timestamp);
        if (!metric) return null;
        
        switch (metricType) {
          case 'hashrate':
            return metric.hashrate || 0;
          case 'power':
            return metric.power_watts || 0;
          case 'shares':
            return (metric.shares_accepted || 0) + (metric.shares_rejected || 0);
          default:
            return 0;
        }
      });

      return {
        label: minerData.name,
        data: data,
        borderColor: color,
        backgroundColor: color + '20',
        fill: compareMode,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 4
      };
    });

    return { labels, datasets };
  };

  const getYAxisLabel = () => {
    switch (metricType) {
      case 'hashrate':
        return 'Hashrate (TH/s)';
      case 'power':
        return 'Power (Watts)';
      case 'shares':
        return 'Total Shares';
      default:
        return 'Value';
    }
  };

  const chartData = getChartData();
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'var(--text-primary)',
          font: {
            size: 14
          },
          usePointStyle: true,
          padding: 15
        }
      },
      title: {
        display: true,
        text: `${getYAxisLabel()} - Last 4 Hours`,
        color: 'var(--text-primary)',
        font: {
          size: 18,
          weight: 'bold'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'var(--bg-secondary)',
        titleColor: 'var(--text-primary)',
        bodyColor: 'var(--text-primary)',
        borderColor: 'var(--border-color)',
        borderWidth: 1,
        padding: 12
      }
    },
    scales: {
      x: {
        grid: {
          color: 'var(--border-color)'
        },
        ticks: {
          color: 'var(--text-secondary)',
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        grid: {
          color: 'var(--border-color)'
        },
        ticks: {
          color: 'var(--text-secondary)'
        },
        title: {
          display: true,
          text: getYAxisLabel(),
          color: 'var(--text-primary)',
          font: {
            size: 14,
            weight: 'bold'
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  if (loading && metrics.length === 0) {
    return (
      <div className="chart-loading">
        <div className="spinner"></div>
        <p>Loading chart data...</p>
      </div>
    );
  }

  if (selectedMiners.length === 0) {
    return (
      <div className="chart-empty">
        <p>Select miners to view metrics</p>
      </div>
    );
  }

  return (
    <div className="metrics-chart">
      <div className="chart-controls">
        <div className="metric-selector">
          <button
            className={metricType === 'hashrate' ? 'active' : ''}
            onClick={() => setMetricType('hashrate')}
          >
            Hashrate
          </button>
          <button
            className={metricType === 'power' ? 'active' : ''}
            onClick={() => setMetricType('power')}
          >
            Power
          </button>
          <button
            className={metricType === 'shares' ? 'active' : ''}
            onClick={() => setMetricType('shares')}
          >
            Shares
          </button>
        </div>
      </div>
      <div className="chart-container">
        <Line data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}

export default MetricsChart;
