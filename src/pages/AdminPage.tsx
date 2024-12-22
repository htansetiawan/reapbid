import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import AdminDashboard from '../components/Admin/AdminDashboard';
import AdminLogin from '../components/Admin/AdminLogin';
import Footer from '../components/Footer';

export default function AdminPage() {
  const { gameState, startGame, resetGame } = useGame();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [totalRounds, setTotalRounds] = useState('3');
  const [roundTimeLimit, setRoundTimeLimit] = useState('60');
  const [minBid, setMinBid] = useState('0');
  const [maxBid, setMaxBid] = useState('100');
  const [costPerUnit, setCostPerUnit] = useState('50');
  const [maxPlayers, setMaxPlayers] = useState('4');

  // Validation helper for integer input
  const validateIntegerInput = (value: string): boolean => {
    const num = parseInt(value);
    return !isNaN(num) && num.toString() === value;
  };

  const handleIntegerInput = (value: string, setter: (value: string) => void) => {
    if (value === '' || validateIntegerInput(value)) {
      setter(value);
    }
  };

  const handleStartGame = () => {
    // Validate all inputs
    if (!validateIntegerInput(totalRounds) || parseInt(totalRounds) < 1 ||
        !validateIntegerInput(roundTimeLimit) || parseInt(roundTimeLimit) < 1 ||
        !validateIntegerInput(minBid) ||
        !validateIntegerInput(maxBid) || parseInt(maxBid) <= parseInt(minBid) ||
        !validateIntegerInput(costPerUnit) ||
        !validateIntegerInput(maxPlayers) || parseInt(maxPlayers) < 2) {
      alert('Please enter valid values for all fields');
      return;
    }

    startGame({
      totalRounds: parseInt(totalRounds),
      roundTimeLimit: parseInt(roundTimeLimit),
      minBid: parseInt(minBid),
      maxBid: parseInt(maxBid),
      costPerUnit: parseInt(costPerUnit),
      maxPlayers: parseInt(maxPlayers)
    });
  };

  const handleResetGame = () => {
    if (window.confirm('Are you sure you want to reset the game? This will clear all data.')) {
      resetGame();
    }
  };

  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh', backgroundColor: '#f5f5f5', paddingBottom: '50px' }}>
      <div style={{ width: '100%', padding: '20px' }}>
        {/* Header Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div>
            <h1 style={{ 
              margin: '0',
              fontSize: '2.5em',
              fontWeight: 'bold',
              color: '#2c3e50',
              letterSpacing: '-0.5px'
            }}>
              ReapBid
            </h1>
            <div style={{
              fontSize: '1.1em',
              color: '#6c757d',
              marginTop: '5px'
            }}>
              Admin Control Panel
            </div>
          </div>
          <button
            onClick={handleResetGame}
            style={{
              padding: '12px 24px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1em',
              fontWeight: '500',
              transition: 'background-color 0.2s',
              boxShadow: '0 2px 4px rgba(220,53,69,0.2)'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c82333'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}
          >
            Reset Game
          </button>
        </div>

        {/* Main Content */}
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ width: '100%' }}>
            {!gameState.hasGameStarted ? (
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#495057',
                    fontWeight: '500'
                  }}>
                    Total Rounds:
                  </label>
                  <input
                    type="number"
                    value={totalRounds}
                    onChange={(e) => handleIntegerInput(e.target.value, setTotalRounds)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '1em'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#495057',
                    fontWeight: '500'
                  }}>
                    Round Time Limit (seconds):
                  </label>
                  <input
                    type="number"
                    value={roundTimeLimit}
                    onChange={(e) => handleIntegerInput(e.target.value, setRoundTimeLimit)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '1em'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#495057',
                    fontWeight: '500'
                  }}>
                    Minimum Bid:
                  </label>
                  <input
                    type="number"
                    value={minBid}
                    onChange={(e) => handleIntegerInput(e.target.value, setMinBid)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '1em'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#495057',
                    fontWeight: '500'
                  }}>
                    Maximum Bid:
                  </label>
                  <input
                    type="number"
                    value={maxBid}
                    onChange={(e) => handleIntegerInput(e.target.value, setMaxBid)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '1em'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#495057',
                    fontWeight: '500'
                  }}>
                    Cost Per Unit:
                  </label>
                  <input
                    type="number"
                    value={costPerUnit}
                    onChange={(e) => handleIntegerInput(e.target.value, setCostPerUnit)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '1em'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#495057',
                    fontWeight: '500'
                  }}>
                    Maximum Players:
                  </label>
                  <input
                    type="number"
                    value={maxPlayers}
                    onChange={(e) => handleIntegerInput(e.target.value, setMaxPlayers)}
                    min={2}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '1em'
                    }}
                  />
                  <div style={{
                    fontSize: '0.9em',
                    color: '#6c757d',
                    marginTop: '4px'
                  }}>
                    Minimum 2 players required
                  </div>
                </div>
                <button
                  onClick={handleStartGame}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1.1em',
                    fontWeight: '500',
                    transition: 'background-color 0.2s',
                    boxShadow: '0 2px 4px rgba(40,167,69,0.2)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#218838'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#28a745'}
                >
                  Start Game
                </button>
              </div>
            ) : (
              <AdminDashboard />
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
