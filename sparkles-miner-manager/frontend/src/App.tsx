import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import DeviceList from './components/DeviceList';
import DeviceDetail from './components/DeviceDetail';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="container">
            <Link to="/" className="nav-brand">
              ⛏️ Miner Manager
            </Link>
            <div className="nav-links">
              <Link to="/">Dashboard</Link>
              <Link to="/devices">Devices</Link>
            </div>
          </div>
        </nav>

        <main className="container">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/devices" element={<DeviceList />} />
            <Route path="/device/:id" element={<DeviceDetail />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
