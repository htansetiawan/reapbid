import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useNavigate } from 'react-router-dom';

interface BiddingInterfaceProps {
  playerName: string;
}

interface StatBoxProps {
  label: string;
  value: string;
}

const StatBox: React.FC<StatBoxProps> = ({ label, value }) => (
  <div style={{
    textAlign: 'center',
    padding: '15px',
    backgroundColor: '#fff',
    borderRadius: '4px',
    border: '1px solid #dee2e6'
  }}>
    <div style={{
      fontSize: '14px',
      color: '#6c757d',
      marginBottom: '5px'
    }}>
      {label}
    </div>
    <div style={{
      fontSize: '20px',
      color: '#212529',
      fontWeight: 500
    }}>
      {value}
    </div>
  </div>
);

const BiddingInterface: React.FC<BiddingInterfaceProps> = ({ playerName }) => {
  const { gameState, submitBid, registerPlayer } = useGame();
  const [bid, setBid] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [playerNameState, setPlayerNameState] = useState(playerName);
  const [remainingTime, setRemainingTime] = useState('--:--');
  const navigate = useNavigate();

  const isGameEnded = gameState.isEnded;
  const isFinalRound = gameState.currentRound === gameState.totalRounds;

  // Track game state changes
  useEffect(() => {
    console.log('Game state updated:', {
      hasGameStarted: gameState.hasGameStarted,
      isActive: gameState.isActive,
      currentRound: gameState.currentRound,
      playerName: playerNameState,
      isRegistered,
      players: Object.keys(gameState.players)
    });
  }, [gameState, playerNameState, isRegistered]);

  useEffect(() => {
    if (playerNameState && !isRegistered) {
      console.log('Registering player:', playerNameState);
      registerPlayer(playerNameState);
      setIsRegistered(true);
    }
  }, [playerNameState, registerPlayer, isRegistered]);

  // Effect to handle game state updates
  useEffect(() => {
    console.log('BiddingInterface: Game state updated:', {
      hasGameStarted: gameState.hasGameStarted,
      isActive: gameState.isActive,
      currentRound: gameState.currentRound,
      playerName,
      isRegistered,
      playerState: gameState.players[playerName],
      roundHistory: gameState.roundHistory.length,
      roundHistoryData: gameState.roundHistory
    });
  }, [gameState, playerName, isRegistered]);

  useEffect(() => {
    const updateRemainingTime = () => {
      if (!gameState.roundStartTime || !gameState.isActive) {
        setRemainingTime('--:--');
        return;
      }

      const now = Date.now();
      const endTime = gameState.roundStartTime + (gameState.roundTimeLimit * 1000);
      const timeLeft = Math.max(0, Math.floor((endTime - now) / 1000));
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      
      setRemainingTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    // Update immediately
    updateRemainingTime();

    // Then update every second
    const timer = setInterval(updateRemainingTime, 1000);

    return () => clearInterval(timer);
  }, [gameState.roundStartTime, gameState.roundTimeLimit, gameState.isActive]);

  // Check if user is valid periodically
  useEffect(() => {
    const checkUserValidity = () => {
      if (!playerNameState || !gameState.players[playerNameState]) {
        // User is not registered or has been unregistered
        localStorage.removeItem('playerName');
        navigate('/');
      }
    };

    // Check immediately
    checkUserValidity();

    // Then check every 5 seconds
    const interval = setInterval(checkUserValidity, 5000);

    return () => clearInterval(interval);
  }, [playerNameState, gameState.players, navigate]);

  const handleRegister = () => {
    if (!playerNameState.trim()) {
      setError('Please enter your name');
      return;
    }

    if (Object.keys(gameState.players).length >= gameState.maxPlayers) {
      setError(`Game is full (maximum ${gameState.maxPlayers} players). Please wait for the next game.`);
      return;
    }

    registerPlayer(playerNameState);
    setIsRegistered(true);
    setError('');
  };

  // Redirect if not registered
  if (!playerNameState || !gameState.players[playerNameState]) {
    const isGameFull = Object.keys(gameState.players).length >= gameState.maxPlayers;

    if (isGameFull) {
      return (
        <div style={{ 
          padding: '40px',
          maxWidth: '400px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '30px',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <h2 style={{
              color: '#212529',
              marginBottom: '20px',
              fontSize: '24px'
            }}>
              Game is Full
            </h2>
            <div style={{
              color: '#6c757d',
              fontSize: '16px',
              lineHeight: '1.5'
            }}>
              <p>Maximum number of players ({gameState.maxPlayers}) has been reached.</p>
              <p>Thank you for your interest in participating!</p>
              <p>Please join us for the next game.</p>
            </div>
            <div style={{
              marginTop: '20px',
              padding: '10px',
              backgroundColor: '#e9ecef',
              borderRadius: '4px',
              color: '#495057',
              fontSize: '14px'
            }}>
              Current Players: {Object.keys(gameState.players).length} / {gameState.maxPlayers}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{ 
        padding: '40px',
        maxWidth: '400px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <h2 style={{
          color: '#212529',
          marginBottom: '30px',
          fontSize: '24px'
        }}>
          Join the Game
        </h2>
        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '20px',
            border: '1px solid #f5c6cb'
          }}>
            {error}
          </div>
        )}
        <div style={{
          marginBottom: '20px',
          textAlign: 'left'
        }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            color: '#495057',
            fontWeight: 500
          }}>
            Enter your name:
          </label>
          <input
            type="text"
            value={playerNameState}
            onChange={(e) => setPlayerNameState(e.target.value)}
            placeholder="Your name"
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              fontSize: '16px'
            }}
          />
        </div>
        <button
          onClick={handleRegister}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 500
          }}
        >
          Join Game
        </button>
        <div style={{
          marginTop: '15px',
          color: '#6c757d',
          fontSize: '14px'
        }}>
          {Object.keys(gameState.players).length} / {gameState.maxPlayers} players joined
        </div>
      </div>
    );
  }

  const playerState = gameState.players[playerNameState] || {
    name: playerNameState,
    currentBid: null,
    hasSubmittedBid: false,
    lastBidTime: null
  };

  // Show timeout message if player is timed out
  if (playerState.isTimedOut) {
    return (
      <div style={{
        padding: '20px',
        maxWidth: '600px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '20px',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #f5c6cb'
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>You Have Been Timed Out</h3>
          <p style={{ margin: '0' }}>
            The administrator has timed you out from the game. You can no longer participate in this session.
          </p>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem('playerName');
            navigate('/');
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Return to Home
        </button>
      </div>
    );
  }

  const hasSubmittedBid = playerState.hasSubmittedBid;

  const handleBidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (bid === null || !playerName) return;

    console.log('Submitting bid:', {
      playerName,
      bid,
      isActive: gameState.isActive,
      currentRound: gameState.currentRound
    });

    if (bid < gameState.minBid || bid > gameState.maxBid) {
      alert(`Bid must be between $${gameState.minBid} and $${gameState.maxBid}`);
      return;
    }

    submitBid(playerName, bid);
    setBid(null);
  };

  const canSubmitBid = () => {
    const conditions = {
      hasGameStarted: gameState.hasGameStarted,
      isActive: gameState.isActive,
      hasSubmittedBid: playerState.hasSubmittedBid,
      isRegistered,
      hasBidValue: bid !== null,
      playerName: !!playerName,
      roundActive: gameState.currentRound > 0 && gameState.currentRound <= gameState.totalRounds
    };

    console.log('Bid submission conditions:', conditions);

    const canSubmit = 
      conditions.hasGameStarted &&
      conditions.isActive &&
      !conditions.hasSubmittedBid &&
      conditions.isRegistered &&
      conditions.hasBidValue &&
      conditions.playerName &&
      conditions.roundActive;

    console.log('Can submit bid:', canSubmit);
    return canSubmit;
  };

  const isInputEnabled = () => {
    const conditions = {
      hasGameStarted: gameState.hasGameStarted,
      isActive: gameState.isActive,
      hasSubmittedBid: playerState.hasSubmittedBid,
      roundActive: gameState.currentRound > 0 && gameState.currentRound <= gameState.totalRounds
    };

    console.log('Input enabled conditions:', conditions);
    return conditions.hasGameStarted && conditions.isActive && !conditions.hasSubmittedBid && conditions.roundActive;
  };

  // Helper functions for statistics
  const getRivalStats = () => {
    if (!gameState.rivalries || !gameState.rivalries[playerNameState]) {
      return [];
    }

    const rivals = gameState.rivalries[playerNameState];
    const stats = gameState.roundHistory.map(round => {
      const playerBid = round.bids[playerNameState] || 0;
      const playerProfit = round.profits[playerNameState] || 0;
      const playerMarketShare = round.marketShares[playerNameState] || 0;

      const rivalData = rivals.map(rival => ({
        name: rival,
        bid: round.bids[rival] || 0,
        profit: round.profits[rival] || 0,
        marketShare: round.marketShares[rival] || 0
      }));

      return {
        round: round.round,
        playerBid,
        playerProfit,
        playerMarketShare,
        rivals: rivalData
      };
    });

    return stats;
  };

  if (isGameEnded) {
    const stats = {
      profit: 0,
      marketShare: 0,
      bestRound: 0,
      currentBid: 0
    };

    // Calculate from round history
    const roundHistory = gameState.roundHistory || [];
    const playerRoundData = roundHistory.map(round => ({
      profit: round.profits?.[playerNameState] || 0,
      marketShare: round.marketShares?.[playerNameState] || 0
    }));

    // Calculate total profit
    const totalProfit = playerRoundData.reduce((sum, round) => sum + round.profit, 0);

    // Calculate average market share
    const avgMarketShare = playerRoundData.length > 0
      ? playerRoundData.reduce((sum, round) => sum + round.marketShare, 0) / playerRoundData.length
      : 0;

    // Find best round (highest profit)
    let bestRound = 0;
    let bestProfit = -Infinity;
    playerRoundData.forEach((round, index) => {
      if (round.profit > bestProfit) {
        bestProfit = round.profit;
        bestRound = index + 1;
      }
    });

    stats.profit = totalProfit;
    stats.marketShare = avgMarketShare;
    stats.bestRound = bestRound || 0;
    stats.currentBid = gameState.roundBids[playerNameState] || 0;

    return (
      <div style={{
        padding: '40px',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '30px',
          borderRadius: '8px',
          border: '1px solid #dee2e6',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <h2 style={{
            color: '#212529',
            marginBottom: '20px',
            fontSize: '24px'
          }}>
            Game Over
          </h2>
          <p style={{
            color: '#6c757d',
            marginBottom: '30px',
            fontSize: '16px'
          }}>
            The game has ended. Here are your final statistics:
          </p>
        </div>

        <div style={{
          backgroundColor: '#fff',
          padding: '30px',
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '20px'
          }}>
            <StatBox
              label="Total Profit"
              value={`$${stats.profit.toFixed(2)}`}
            />
            <StatBox
              label="Average Market Share"
              value={`${(stats.marketShare * 100).toFixed(1)}%`}
            />
            <StatBox
              label="Best Round"
              value={stats.bestRound.toString()}
            />
            <StatBox
              label="Total Rounds"
              value={gameState.totalRounds.toString()}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: '18px', marginBottom: '5px' }}>
            Round {gameState.currentRound} of {gameState.totalRounds}
            {isFinalRound && (
              <span style={{ 
                color: '#dc3545',
                marginLeft: '10px',
                fontSize: '14px',
                fontWeight: 500
              }}>
                (Final Round)
              </span>
            )}
          </div>
          <div style={{ color: '#6c757d' }}>
            Time Remaining: {remainingTime}
          </div>
        </div>
        {gameState.isActive && (
          <div style={{
            backgroundColor: '#28a745',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 500
          }}>
            Round Active
          </div>
        )}
      </div>
      <div style={{
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #dee2e6',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <h2 style={{
          color: '#212529',
          marginBottom: '20px',
          fontSize: '24px'
        }}>
          Bidding Interface
        </h2>
        <div style={{
          color: '#6c757d',
          fontSize: '16px',
          marginBottom: '20px'
        }}>
          Playing as: <span style={{ color: '#28a745', fontWeight: 500 }}>{playerNameState}</span>
        </div>
      </div>
      {/* Round History and Statistics */}
      {gameState.roundHistory.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Round History (vs Rivals)</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead>
              <tr>
                <th style={{ padding: '8px', borderBottom: '2px solid #ddd' }}>Round</th>
                <th style={{ padding: '8px', borderBottom: '2px solid #ddd' }}>Your Bid</th>
                <th style={{ padding: '8px', borderBottom: '2px solid #ddd' }}>Your Profit</th>
                <th style={{ padding: '8px', borderBottom: '2px solid #ddd' }}>Your Market Share</th>
                <th style={{ padding: '8px', borderBottom: '2px solid #ddd' }}>Rival Performance</th>
              </tr>
            </thead>
            <tbody>
              {getRivalStats().map((roundStat) => (
                <tr key={roundStat.round}>
                  <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                    {roundStat.round}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                    ${roundStat.playerBid.toFixed(2)}
                  </td>
                  <td style={{ 
                    padding: '8px', 
                    borderBottom: '1px solid #ddd',
                    color: roundStat.playerProfit >= 0 ? 'green' : 'red'
                  }}>
                    ${roundStat.playerProfit.toFixed(2)}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                    {(roundStat.playerMarketShare * 100).toFixed(1)}%
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>
                    {roundStat.rivals.map(rival => (
                      <div key={rival.name} style={{ marginBottom: '4px' }}>
                        <strong>{rival.name}:</strong> Bid: ${rival.bid.toFixed(2)}, 
                        Profit: <span style={{ color: rival.profit >= 0 ? 'green' : 'red' }}>
                          ${rival.profit.toFixed(2)}
                        </span>, 
                        Share: {(rival.marketShare * 100).toFixed(1)}%
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <form onSubmit={handleBidSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Your Bid (${gameState.minBid} - ${gameState.maxBid}):
          </label>
          <input
            type="number"
            value={bid === null ? '' : bid}
            onChange={(e) => {
              const value = e.target.value;
              console.log('Bid input changed:', {
                value,
                parsed: Number(value),
                isEmpty: value === ''
              });
              setBid(value === '' ? null : Number(value));
            }}
            min={gameState.minBid}
            max={gameState.maxBid}
            step="0.01"
            disabled={!isInputEnabled()}
            placeholder="Enter your bid"
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ced4da'
            }}
          />
        </div>
        <button
          type="submit"
          disabled={!canSubmitBid()}
          style={{
            padding: '10px 20px',
            backgroundColor: canSubmitBid() ? '#28a745' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: canSubmitBid() ? 'pointer' : 'not-allowed',
            width: '100%'
          }}
        >
          {playerState.hasSubmittedBid ? 'Bid Submitted' : 'Submit Bid'}
        </button>
      </form>

      {playerState.hasSubmittedBid && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          backgroundColor: '#d4edda',
          color: '#155724',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          Your bid of ${playerState.currentBid?.toFixed(2)} has been submitted!
        </div>
      )}
    </div>
  );
};

export default BiddingInterface;
