import React, { useState, useEffect } from 'react';
import { Activity, Thermometer, Zap, Plus, Trash2, Server, Bitcoin, Clock, Database, Trophy, TrendingUp } from 'lucide-react';

function App() {
    const [miners, setMiners] = useState([]);
    const [network, setNetwork] = useState(null);
    const [odds, setOdds] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newMinerIp, setNewMinerIp] = useState('');
    const [newMinerType, setNewMinerType] = useState('bitaxe');

    const fetchData = async () => {
        try {
            const [mRes, nRes, oRes] = await Promise.all([
                fetch('/api/miners'),
                fetch('/api/network-stats'),
                fetch('/api/odds')
            ]);
            setMiners(await mRes.json());
            setNetwork(await nRes.json());
            setOdds(await oRes.json());
        } catch (err) {
            console.error("Fetch error", err);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleAddMiner = async (e) => {
        e.preventDefault();
        try {
            await fetch('/api/miners', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ip: newMinerIp, type: newMinerType })
            });
            setIsAddModalOpen(false);
            setNewMinerIp('');
            fetchData();
        } catch (err) {
            alert("Failed to add miner");
        }
    };

    const handleDeleteMiner = async (id) => {
        if (!confirm("Are you sure?")) return;
        await fetch(`/api/miners/${id}`, { method: 'DELETE' });
        fetchData();
    };

    // Aggregations
    const totalHashrate = miners.reduce((acc, m) => acc + (m.stats?.hashrate || 0), 0); // MH/s
    const totalPower = miners.reduce((acc, m) => acc + (m.stats?.power || 0), 0);
    const efficiency = totalHashrate > 0 ? (totalPower / (totalHashrate / 1e6)).toFixed(1) : 0;

    const formatHashrate = (mh) => {
        if (mh > 1000000) return (mh / 1000000).toFixed(2) + ' EH/s';
        if (mh > 1000) return (mh / 1000).toFixed(2) + ' GH/s';
        return mh.toFixed(2) + ' MH/s';
    };

    const formatTime = (seconds) => {
        if (!seconds || seconds === Infinity) return "∞";
        const years = Math.floor(seconds / 31536000);
        if (years > 1000) return "> 1000 Years";
        if (years >= 1) return `~${years} Years`;
        const days = Math.floor(seconds / 86400);
        return `~${days} Days`;
    };

    const formatProb = (p) => {
        if (!p) return "0%";
        if (p < 0.000001) return "< 0.0001%";
        return (p * 100).toFixed(6) + "%";
    };

    return (
        <div className="app-container">
            <header style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="text-gradient" style={{ margin: 0, fontSize: '2.5rem' }}>Home Miner</h1>
                        <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0' }}>Monitor & Analytics Dashboard</p>
                    </div>
                    <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>
                        <Plus size={16} style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} />
                        Add Device
                    </button>
                </div>
            </header>

            {/* Network Stats Row */}
            <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text-secondary)' }}>Bitcoin Network</h3>
            <div className="stats-grid">
                <div className="glass-card stat-card">
                    <div className="label"><Bitcoin size={16} /> Price</div>
                    <div className="value">${network?.price_usd.toLocaleString() || '...'}</div>
                </div>
                <div className="glass-card stat-card">
                    <div className="label"><Database size={16} /> Block Height</div>
                    <div className="value">{network?.block_height.toLocaleString() || '...'}</div>
                </div>
                <div className="glass-card stat-card">
                    <div className="label"><TrendingUp size={16} /> Fees (Sat/vB)</div>
                    <div className="value" style={{ fontSize: '1.2rem' }}>
                        LP: <span style={{ color: 'var(--neon-green)' }}>{network?.fees?.hourFee}</span> &nbsp;
                        MP: <span style={{ color: 'var(--neon-blue)' }}>{network?.fees?.halfHourFee}</span> &nbsp;
                        HP: <span style={{ color: 'var(--neon-red)' }}>{network?.fees?.fastestFee}</span>
                    </div>
                </div>
                <div className="glass-card stat-card">
                    <div className="label"><Activity size={16} /> Mempool Tx</div>
                    <div className="value">{network?.mempool_tx_count.toLocaleString() || '...'}</div>
                </div>
            </div>

            {/* Mining Stats Row */}
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', marginTop: '2rem' }}>Home Farm Performance</h3>
            <div className="stats-grid">
                <div className="glass-card stat-card">
                    <div className="label"><Server size={16} color="var(--neon-blue)" /> Total Hashrate</div>
                    <div className="value">{formatHashrate(totalHashrate)}</div>
                </div>
                <div className="glass-card stat-card">
                    <div className="label"><Zap size={16} color="var(--neon-yellow)" /> Power Usage</div>
                    <div className="value">{totalPower} W <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>({efficiency} J/TH)</span></div>
                </div>
                <div className="glass-card stat-card">
                    <div className="label"><Clock size={16} /> Est. Time to Block</div>
                    <div className="value">{odds ? formatTime(odds.time_to_block_seconds) : '...'}</div>
                </div>
                <div className="glass-card stat-card">
                    <div className="label"><Trophy size={16} color="gold" /> Solo Odds (Daily)</div>
                    <div className="value">{odds ? formatProb(odds.prob_day) : '...'}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
                        {odds?.lottery?.comparison_msg}
                    </div>
                </div>
            </div>

            {/* Miner List */}
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', marginTop: '2rem' }}>Devices</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {miners.map((miner) => (
                    <div key={miner.id} className="glass-card" style={{ position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div className={`status-dot ${miner.status === 'online' ? 'status-online' : 'status-offline'}`}></div>
                                <strong>{miner.ip}</strong>
                            </div>
                            <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)' }}>
                                {miner.type}
                            </span>
                        </div>

                        {miner.status === 'online' ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Hashrate</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{formatHashrate(miner.stats?.hashrate || 0)}</div>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Temp</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: (miner.stats?.temp > 80 ? 'var(--neon-red)' : 'white') }}>
                                        {miner.stats?.temp || 0}°C
                                    </div>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Power</div>
                                    <div style={{ fontSize: '1.1rem' }}>{miner.stats?.power || 0} W</div>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Best Diff</div>
                                    <div style={{ fontSize: '1.1rem' }}>{miner.stats?.best_diff ? parseFloat(miner.stats.best_diff).toExponential(2) : '-'}</div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ padding: '1rem 0', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                Connection lost
                            </div>
                        )}

                        <button
                            onClick={() => handleDeleteMiner(miner.id)}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', opacity: 0.5 }}
                            title="Remove Miner"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="modal-overlay">
                    <div className="glass-card" style={{ width: '400px', background: '#121217', zIndex: 1001 }}>
                        <h2 style={{ marginTop: 0 }}>Add New Miner</h2>
                        <form onSubmit={handleAddMiner}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label>Miner IP Address</label>
                                <input
                                    type="text"
                                    value={newMinerIp}
                                    onChange={(e) => setNewMinerIp(e.target.value)}
                                    placeholder="192.168.1.100"
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label>Device Type</label>
                                <select
                                    value={newMinerType}
                                    onChange={(e) => setNewMinerType(e.target.value)}
                                    style={{
                                        width: '100%', padding: '0.5rem', background: 'rgba(0,0,0,0.3)',
                                        border: '1px solid var(--card-border)', color: 'white', borderRadius: '6px'
                                    }}
                                >
                                    <option value="bitaxe">Bitaxe (AxeOS)</option>
                                    <option value="braiins">BraiinsOS (CGMiner)</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" className="btn-primary">Add Device</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default App
