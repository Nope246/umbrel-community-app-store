import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import ThemeProvider from './contexts/ThemeContext';
import { getTheme, setTheme } from './utils/theme';

function App() {
  const [currentTheme, setCurrentTheme] = useState(getTheme());
  const [currentView, setCurrentView] = useState('dashboard');

  useEffect(() => {
    // Apply theme on mount
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  const handleThemeChange = (theme) => {
    setTheme(theme);
    setCurrentTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
  };

  return (
    <ThemeProvider value={{ theme: currentTheme, setTheme: handleThemeChange }}>
      <div className="App">
        <header className="App-header">
          <div className="header-content">
            <h1>Bitaxe Monitor</h1>
            <nav className="nav-tabs">
              <button
                className={currentView === 'dashboard' ? 'active' : ''}
                onClick={() => setCurrentView('dashboard')}
              >
                Dashboard
              </button>
              <button
                className={currentView === 'settings' ? 'active' : ''}
                onClick={() => setCurrentView('settings')}
              >
                Settings
              </button>
            </nav>
          </div>
        </header>
        <main className="App-main">
          {currentView === 'dashboard' && <Dashboard />}
          {currentView === 'settings' && <Settings />}
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
