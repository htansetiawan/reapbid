import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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
    padding: '16px',
    backgroundColor: '#fff',
    borderRadius: '4px',
    border: '1px solid rgba(0,0,0,0.12)'
  }}>
    <div style={{
      fontSize: '14px',
      color: 'rgba(0,0,0,0.6)',
      marginBottom: '8px'
    }}>
      {label}
    </div>
    <div style={{
      fontSize: '20px',
      color: 'rgba(0,0,0,0.87)',
      fontWeight: 500
    }}>
      {value}
    </div>
  </div>
);

const BiddingInterface: React.FC<BiddingInterfaceProps> = ({ playerName }) => {
  const { gameState, submitBid, registerPlayer } = useGame();
  const { user } = useAuth();
  const [bid, setBid] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [remainingTime, setRemainingTime] = useState('--:--');
  const navigate = useNavigate();

  const isGameEnded = gameState?.isEnded;
  const isFinalRound = (gameState?.currentRound ?? 0) === (gameState?.totalRounds ?? 0);

  const getDisplayRound = () => {
    const currentRound = gameState?.currentRound ?? 0;
    const totalRounds = gameState?.totalRounds ?? 0;
    return `${Math.min(currentRound, totalRounds)}/${totalRounds}`;
  };

  // Track game state changes
  useEffect(() => {
    console.log('Game state updated:', {
      hasGameStarted: gameState?.hasGameStarted,
      isActive: gameState?.isActive,
      currentRound: gameState?.currentRound ?? 0,
      playerName: playerName,
      isRegistered,
      players: Object.keys(gameState?.players || {})
    });
  }, [gameState, playerName, isRegistered]);

  useEffect(() => {
    if (playerName && !isRegistered) {
      console.log('Registering player:', playerName);
      registerPlayer(playerName);
      setIsRegistered(true);
    }
  }, [playerName, registerPlayer, isRegistered]);

  // Effect to handle game state updates
  useEffect(() => {
    console.log('BiddingInterface: Game state updated:', {
      hasGameStarted: gameState?.hasGameStarted,
      isActive: gameState?.isActive,
      currentRound: gameState?.currentRound ?? 0,
      playerName,
      isRegistered,
      playerState: gameState?.players?.[playerName],
      roundHistory: gameState?.roundHistory?.length ?? 0,
      roundHistoryData: gameState?.roundHistory || []
    });
  }, [gameState, playerName, isRegistered]);

  useEffect(() => {
    const updateRemainingTime = () => {
      if (!gameState?.roundStartTime || !gameState?.isActive) {
        setRemainingTime('--:--');
        return;
      }

      const now = Date.now();
      const endTime = gameState.roundStartTime + ((gameState?.roundTimeLimit ?? 0) * 1000);
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
  }, [gameState?.roundStartTime, gameState?.roundTimeLimit, gameState?.isActive]);

  // Check if user is valid periodically
  useEffect(() => {
    const checkUserValidity = () => {
      if (!playerName || !gameState?.players?.[playerName]) {
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
  }, [playerName, gameState?.players, navigate]);

  const handleRegister = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (Object.keys(gameState?.players || {}).length >= (gameState?.maxPlayers ?? 0)) {
      setError(`Game is full (maximum ${gameState?.maxPlayers ?? 0} players). Please wait for the next game.`);
      return;
    }

    registerPlayer(playerName);
    setIsRegistered(true);
    setError('');
  };

  // Redirect if not registered
  if (!playerName || !gameState?.players?.[playerName]) {
    const isGameFull = Object.keys(gameState?.players || {}).length >= (gameState?.maxPlayers ?? 0);

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
            color: '#721c24',
            padding: '30px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #f5c6cb'
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
              <p>Maximum number of players ({gameState?.maxPlayers ?? 0}) has been reached.</p>
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
              Current Players: {Object.keys(gameState?.players || {}).length} / {gameState?.maxPlayers ?? 0}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{ 
        padding: '16px',
        maxWidth: '800px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{
          backgroundColor: '#fff',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid rgba(0,0,0,0.12)',
          textAlign: 'center',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            backgroundColor: '#fff4e5',
            padding: '12px 24px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              color: '#ed6c02',
              fontSize: '20px'
            }}>⚠</span>
            <span style={{
              color: 'rgba(0,0,0,0.87)',
              fontWeight: 500
            }}>
              Starting in {remainingTime}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const playerState = gameState?.players?.[playerName] || {
    name: playerName,
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
      isActive: gameState?.isActive,
      currentRound: gameState?.currentRound
    });

    if (bid < (gameState?.minBid ?? 0) || bid > (gameState?.maxBid ?? 0)) {
      alert(`Bid must be between $${gameState?.minBid ?? 0} and $${gameState?.maxBid ?? 0}`);
      return;
    }

    submitBid(playerName, bid);
    setBid(null);
  };

  const canSubmitBid = () => {
    const conditions = {
      hasGameStarted: gameState?.hasGameStarted,
      isActive: gameState?.isActive,
      hasSubmittedBid: playerState.hasSubmittedBid,
      isRegistered,
      hasBidValue: bid !== null,
      playerName: !!playerName,
      roundActive: (gameState?.currentRound ?? 0) > 0 && (gameState?.currentRound ?? 0) <= (gameState?.totalRounds ?? 0)
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
      hasGameStarted: gameState?.hasGameStarted,
      isActive: gameState?.isActive,
      hasSubmittedBid: playerState.hasSubmittedBid,
      roundActive: (gameState?.currentRound ?? 0) > 0 && (gameState?.currentRound ?? 0) <= (gameState?.totalRounds ?? 0)
    };

    console.log('Input enabled conditions:', conditions);
    return conditions.hasGameStarted && conditions.isActive && !conditions.hasSubmittedBid && conditions.roundActive;
  };

  // Helper functions for statistics
  const getRivalStats = () => {
    if (!gameState?.rivalries || !gameState?.rivalries[playerName]) {
      return [];
    }

    const rivals = gameState.rivalries[playerName];
    const stats = gameState.roundHistory.map(round => {
      const playerBid = round.bids[playerName] || 0;
      const playerProfit = round.profits[playerName] || 0;
      const playerMarketShare = round.marketShares[playerName] || 0;

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

  const getTotalProfit = () => {
    const roundHistory = gameState?.roundHistory || [];
    const playerRoundData = roundHistory.map(round => ({
      profit: round.profits?.[playerName] || 0,
    }));

    // Calculate total profit
    const totalProfit = playerRoundData.reduce((sum, round) => sum + round.profit, 0);

    return totalProfit;
  };

  const getAverageMarketShare = () => {
    const roundHistory = gameState?.roundHistory || [];
    const playerRoundData = roundHistory.map(round => ({
      marketShare: round.marketShares?.[playerName] || 0
    }));

    // Calculate average market share
    const avgMarketShare = playerRoundData.length > 0
      ? playerRoundData.reduce((sum, round) => sum + round.marketShare, 0) / playerRoundData.length
      : 0;

    return avgMarketShare;
  };

  const getBestRound = () => {
    const roundHistory = gameState?.roundHistory || [];
    const playerRoundData = roundHistory.map((round, index) => ({
      profit: round.profits?.[playerName] || 0,
      roundNumber: index + 1
    }));

    // Find best round (highest profit)
    return playerRoundData.reduce((best, current) => {
      return current.profit > best.profit ? current : best;
    }, { profit: -Infinity, roundNumber: 0 });
  };

  if (gameState?.isEnded || (gameState?.currentRound ?? 0) > (gameState?.totalRounds ?? 0)) {
    return (
      <div style={{
        padding: '16px',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <div style={{
          backgroundColor: '#fff',
          padding: '24px',
          borderRadius: '8px',
          border: '1px solid rgba(0,0,0,0.12)',
          marginBottom: '24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            gap: '12px'
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: 600,
              color: 'rgba(0,0,0,0.87)',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Bidding is Over
            </div>
            <div style={{
              backgroundColor: '#2e7d32',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '16px',
              fontSize: '14px',
              fontWeight: 500
            }}>
              Final Results
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '24px',
            marginBottom: '32px'
          }}>
            <div style={{
              backgroundColor: 'rgba(0,0,0,0.02)',
              padding: '16px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '14px',
                color: 'rgba(0,0,0,0.6)',
                marginBottom: '8px',
                fontWeight: 500
              }}>
                Total Profit
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: 600,
                color: getTotalProfit() >= 0 ? '#2e7d32' : '#d32f2f'
              }}>
                ${getTotalProfit().toFixed(2)}
              </div>
            </div>

            <div style={{
              backgroundColor: 'rgba(0,0,0,0.02)',
              padding: '16px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '14px',
                color: 'rgba(0,0,0,0.6)',
                marginBottom: '8px',
                fontWeight: 500
              }}>
                Average Market Share
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: 600,
                color: 'rgba(0,0,0,0.87)'
              }}>
                {(getAverageMarketShare() * 100).toFixed(1)}%
              </div>
            </div>

            <div style={{
              backgroundColor: 'rgba(0,0,0,0.02)',
              padding: '16px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '14px',
                color: 'rgba(0,0,0,0.6)',
                marginBottom: '8px',
                fontWeight: 500
              }}>
                Best Round
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: 600,
                color: 'rgba(0,0,0,0.87)'
              }}>
                #{getBestRound().roundNumber}
              </div>
              <div style={{
                fontSize: '14px',
                color: getBestRound().profit >= 0 ? '#2e7d32' : '#d32f2f',
                marginTop: '4px'
              }}>
                ${getBestRound().profit.toFixed(2)}
              </div>
            </div>

            <div style={{
              backgroundColor: 'rgba(0,0,0,0.02)',
              padding: '16px',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '14px',
                color: 'rgba(0,0,0,0.6)',
                marginBottom: '8px',
                fontWeight: 500
              }}>
                Total Rounds
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: 600,
                color: 'rgba(0,0,0,0.87)'
              }}>
                {gameState.totalRounds}
              </div>
            </div>
          </div>
        </div>

        {/* Round History Table */}
        <div style={{
          backgroundColor: '#fff',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid rgba(0,0,0,0.12)'
        }}>
          <h3 style={{ 
            fontSize: '18px',
            marginBottom: '24px',
            color: 'rgba(0,0,0,0.87)',
            fontWeight: 600
          }}>
            Round History
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr>
                  <th style={{ 
                    padding: '12px',
                    borderBottom: '2px solid rgba(0,0,0,0.12)',
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                    fontSize: '14px'
                  }}>
                    #
                  </th>
                  <th style={{ 
                    padding: '12px',
                    borderBottom: '2px solid rgba(0,0,0,0.12)',
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                    fontSize: '14px'
                  }}>
                    Rivals
                  </th>
                  <th style={{ 
                    padding: '12px',
                    borderBottom: '2px solid rgba(0,0,0,0.12)',
                    textAlign: 'right',
                    whiteSpace: 'nowrap',
                    fontSize: '14px'
                  }}>
                    Bid
                  </th>
                  <th style={{ 
                    padding: '12px',
                    borderBottom: '2px solid rgba(0,0,0,0.12)',
                    textAlign: 'right',
                    whiteSpace: 'nowrap',
                    fontSize: '14px'
                  }}>
                    Profit
                  </th>
                  <th style={{ 
                    padding: '12px',
                    borderBottom: '2px solid rgba(0,0,0,0.12)',
                    textAlign: 'right',
                    whiteSpace: 'nowrap',
                    fontSize: '14px'
                  }}>
                    %
                  </th>
                </tr>
              </thead>
              <tbody>
                {getRivalStats().map((roundStat) => (
                  <tr key={roundStat.round}>
                    <td style={{ 
                      padding: '12px',
                      borderBottom: '1px solid rgba(0,0,0,0.12)',
                      textAlign: 'left'
                    }}>
                      {Math.min(roundStat.round, gameState?.totalRounds ?? 0)}
                    </td>
                    <td style={{ 
                      padding: '12px',
                      borderBottom: '1px solid rgba(0,0,0,0.12)',
                      fontSize: '13px'
                    }}>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}>
                        {roundStat.rivals.map(rival => (
                          <div key={rival.name} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            padding: '8px',
                            backgroundColor: 'rgba(0,0,0,0.02)',
                            borderRadius: '4px'
                          }}>
                            <div style={{
                              fontWeight: 500,
                              color: 'rgba(0,0,0,0.87)',
                              marginBottom: '4px'
                            }}>
                              {rival.name}
                            </div>
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(3, 1fr)',
                              gap: '8px',
                              fontSize: '12px',
                              color: 'rgba(0,0,0,0.6)'
                            }}>
                              <div>
                                <div style={{ marginBottom: '2px', fontWeight: 500 }}>Bid</div>
                                <div>${rival.bid}</div>
                              </div>
                              <div>
                                <div style={{ marginBottom: '2px', fontWeight: 500 }}>Profit</div>
                                <div style={{
                                  color: rival.profit >= 0 ? '#2e7d32' : '#d32f2f'
                                }}>
                                  ${rival.profit.toFixed(2)}
                                </div>
                              </div>
                              <div>
                                <div style={{ marginBottom: '2px', fontWeight: 500 }}>Share</div>
                                <div>{(rival.marketShare * 100).toFixed(1)}%</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td style={{ 
                      padding: '12px',
                      borderBottom: '1px solid rgba(0,0,0,0.12)',
                      textAlign: 'right'
                    }}>
                      ${roundStat.playerBid}
                    </td>
                    <td style={{ 
                      padding: '12px',
                      borderBottom: '1px solid rgba(0,0,0,0.12)',
                      textAlign: 'right',
                      color: roundStat.playerProfit >= 0 ? '#2e7d32' : '#d32f2f'
                    }}>
                      ${roundStat.playerProfit.toFixed(2)}
                    </td>
                    <td style={{ 
                      padding: '12px',
                      borderBottom: '1px solid rgba(0,0,0,0.12)',
                      textAlign: 'right'
                    }}>
                      {(roundStat.playerMarketShare * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (!gameState?.hasGameStarted) {
    return (
      <div style={{
        padding: '16px',
        maxWidth: '800px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{
          backgroundColor: '#fff',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid rgba(0,0,0,0.12)',
          textAlign: 'center',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            backgroundColor: '#fff4e5',
            padding: '12px 24px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              color: '#ed6c02',
              fontSize: '20px'
            }}>⚠</span>
            <span style={{
              color: 'rgba(0,0,0,0.87)',
              fontWeight: 500
            }}>
              Starting in {remainingTime}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', maxWidth: '100%', margin: '0 auto' }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '16px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        border: '1px solid rgba(0,0,0,0.12)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          marginBottom: '16px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{
              fontSize: '20px',
              fontWeight: 600,
              color: 'rgba(0,0,0,0.87)'
            }}>
              {user?.email ? user.email.split('@')[0] : ''}
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '8px',
            fontSize: '14px',
            color: 'rgba(0,0,0,0.6)'
          }}>
            <div>
              <div style={{
                fontSize: '14px',
                color: 'rgba(0,0,0,0.6)',
                marginBottom: '4px'
              }}>
                Round
              </div>
              <div style={{
                fontSize: '20px',
                color: 'rgba(0,0,0,0.87)',
                fontWeight: 500
              }}>
                {getDisplayRound()}
              </div>
            </div>
            <div>Time: {remainingTime}</div>
          </div>
        </div>
      </div>

      <form onSubmit={handleBidSubmit}>
        <div style={{
          backgroundColor: '#fff',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '16px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid rgba(0,0,0,0.12)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            marginBottom: '16px',
            fontSize: '16px',
            fontWeight: 600,
            color: 'rgba(0,0,0,0.87)'
          }}>
            <div>Min: ${gameState?.minBid ?? 0}</div>
            <div>Max: ${gameState?.maxBid ?? 0}</div>
            <div>Cost/Unit: ${gameState?.costPerUnit ?? 0}</div>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%'
          }}>
            <input
              type="number"
              value={bid ?? ''}
              onChange={(e) => setBid(Number(e.target.value))}
              disabled={!isInputEnabled()}
              min={gameState?.minBid ?? 0}
              max={gameState?.maxBid ?? 0}
              step="0.01"
              style={{
                width: '96%',
                padding: '12px',
                borderRadius: '4px',
                border: '1px solid rgba(0,0,0,0.23)',
                fontSize: '16px',
                marginBottom: '16px',
                outline: 'none'
              }}
              placeholder={`Bid (${gameState?.minBid ?? 0}-${gameState?.maxBid ?? 0})`}
            />

            <button
              type="submit"
              disabled={!canSubmitBid()}
              style={{
                width: '96%',
                padding: '12px',
                backgroundColor: canSubmitBid() ? '#1976d2' : 'rgba(0,0,0,0.12)',
                color: canSubmitBid() ? 'white' : 'rgba(0,0,0,0.38)',
                border: 'none',
                borderRadius: '4px',
                cursor: canSubmitBid() ? 'pointer' : 'not-allowed',
                fontSize: '16px',
                textTransform: 'uppercase',
                fontWeight: 500,
                letterSpacing: '0.5px',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div style={{
                position: 'absolute',
                left: '12px',
                backgroundColor: gameState?.isActive ? '#2e7d32' : '#ffc107',
                color: gameState?.isActive ? 'white' : 'rgba(0,0,0,0.87)',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '0.5px'
              }}>
                {gameState?.isActive ? 'Active' : 'Waiting'}
              </div>
              <span style={{
                marginLeft: '48px'  // Give space for the pill on the left
              }}>
                {playerState.hasSubmittedBid ? 'Bid Submitted' : 'Submit Bid'}
              </span>
            </button>
          </div>
        </div>
      </form>

      {(gameState?.roundHistory?.length ?? 0) > 0 && (
        <div style={{
          backgroundColor: '#fff',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid rgba(0,0,0,0.12)'
        }}>
          <h3 style={{ 
            fontSize: '16px',
            marginBottom: '16px',
            color: 'rgba(0,0,0,0.87)'
          }}>
            Round History
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr>
                  <th style={{ 
                    padding: '12px',
                    borderBottom: '2px solid rgba(0,0,0,0.12)',
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                    fontSize: '14px'
                  }}>
                    #
                  </th>
                  <th style={{ 
                    padding: '12px',
                    borderBottom: '2px solid rgba(0,0,0,0.12)',
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                    fontSize: '14px'
                  }}>
                    Rivals
                  </th>
                  <th style={{ 
                    padding: '12px',
                    borderBottom: '2px solid rgba(0,0,0,0.12)',
                    textAlign: 'right',
                    whiteSpace: 'nowrap',
                    fontSize: '14px'
                  }}>
                    Bid
                  </th>
                  <th style={{ 
                    padding: '12px',
                    borderBottom: '2px solid rgba(0,0,0,0.12)',
                    textAlign: 'right',
                    whiteSpace: 'nowrap',
                    fontSize: '14px'
                  }}>
                    Profit
                  </th>
                  <th style={{ 
                    padding: '12px',
                    borderBottom: '2px solid rgba(0,0,0,0.12)',
                    textAlign: 'right',
                    whiteSpace: 'nowrap',
                    fontSize: '14px'
                  }}>
                    %
                  </th>
                </tr>
              </thead>
              <tbody>
                {getRivalStats().map((roundStat) => (
                  <tr key={roundStat.round}>
                    <td style={{ 
                      padding: '12px',
                      borderBottom: '1px solid rgba(0,0,0,0.12)',
                      textAlign: 'left'
                    }}>
                      {Math.min(roundStat.round, gameState?.totalRounds ?? 0)}
                    </td>
                    <td style={{ 
                      padding: '12px',
                      borderBottom: '1px solid rgba(0,0,0,0.12)',
                      fontSize: '13px'
                    }}>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}>
                        {roundStat.rivals.map(rival => (
                          <div key={rival.name} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            padding: '8px',
                            backgroundColor: 'rgba(0,0,0,0.02)',
                            borderRadius: '4px'
                          }}>
                            <div style={{
                              fontWeight: 500,
                              color: 'rgba(0,0,0,0.87)',
                              marginBottom: '4px'
                            }}>
                              {rival.name}
                            </div>
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(3, 1fr)',
                              gap: '8px',
                              fontSize: '12px',
                              color: 'rgba(0,0,0,0.6)'
                            }}>
                              <div>
                                <div style={{ marginBottom: '2px', fontWeight: 500 }}>Bid</div>
                                <div>${rival.bid}</div>
                              </div>
                              <div>
                                <div style={{ marginBottom: '2px', fontWeight: 500 }}>Profit</div>
                                <div style={{
                                  color: rival.profit >= 0 ? '#2e7d32' : '#d32f2f'
                                }}>
                                  ${rival.profit.toFixed(2)}
                                </div>
                              </div>
                              <div>
                                <div style={{ marginBottom: '2px', fontWeight: 500 }}>Share</div>
                                <div>{(rival.marketShare * 100).toFixed(1)}%</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td style={{ 
                      padding: '12px',
                      borderBottom: '1px solid rgba(0,0,0,0.12)',
                      textAlign: 'right'
                    }}>
                      ${roundStat.playerBid}
                    </td>
                    <td style={{ 
                      padding: '12px',
                      borderBottom: '1px solid rgba(0,0,0,0.12)',
                      textAlign: 'right',
                      color: roundStat.playerProfit >= 0 ? '#2e7d32' : '#d32f2f'
                    }}>
                      ${roundStat.playerProfit.toFixed(2)}
                    </td>
                    <td style={{ 
                      padding: '12px',
                      borderBottom: '1px solid rgba(0,0,0,0.12)',
                      textAlign: 'right'
                    }}>
                      {(roundStat.playerMarketShare * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BiddingInterface;
