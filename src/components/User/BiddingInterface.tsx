import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface BiddingInterfaceProps {
  playerName: string;
  isActive?: boolean;
  hasSubmittedBid?: boolean;
  isTimedOut?: boolean;
  minBid?: number;
  maxBid?: number;
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
    <div style={{ fontSize: '14px', color: 'rgba(0,0,0,0.6)', marginBottom: '8px' }}>
      {label}
    </div>
    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
      {value}
    </div>
  </div>
);

const BiddingInterface: React.FC<BiddingInterfaceProps> = ({
  playerName,
  isActive: isGameActive,
  hasSubmittedBid: hasBidSubmitted,
  isTimedOut,
  minBid,
  maxBid
}) => {
  const { gameState, submitBid, registerPlayer } = useGame();
  const { user } = useAuth();
  const [bid, setBid] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [remainingTime, setRemainingTime] = useState('--:--');
  const navigate = useNavigate();

  const isGameEnded = gameState?.isEnded;
  const isFinalRound = (gameState?.currentRound ?? 0) === (gameState?.totalRounds ?? 0);

  // Add utility function for round display
  const normalizeRoundNumber = (round: number) => {
    const totalRounds = gameState?.totalRounds ?? 0;
    return Math.min(round + 1, totalRounds);
  };

  const getDisplayRound = () => {
    const currentRound = gameState?.currentRound ?? 0;
    const totalRounds = gameState?.totalRounds ?? 0;
    return `${normalizeRoundNumber(currentRound)}/${totalRounds}`;
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

  const isInputEnabled = () => {
    return isGameActive && !hasBidSubmitted && !isTimedOut;
  };

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bid) {
      setError('Please enter a bid');
      return;
    }

    if (bid < (minBid ?? 0) || bid > (maxBid ?? Infinity)) {
      setError(`Bid must be between ${minBid} and ${maxBid}`);
      return;
    }

    try {
      await submitBid(playerName, bid);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit bid');
    }
  };

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

  if (gameState?.isEnded) {
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
                color: 'rgba(0,0,0,0.87)'
              }}>
                ${gameState?.totalProfit ?? 0}
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
                {(gameState?.averageMarketShare ?? 0) * 100}%
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
                #{gameState?.bestRound ?? 0}
              </div>
              <div style={{
                fontSize: '14px',
                color: 'rgba(0,0,0,0.6)',
                marginTop: '4px'
              }}>
                ${gameState?.bestRoundProfit ?? 0}
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
                {gameState?.roundHistory?.map((round, index) => (
                  <tr key={index}>
                    <td style={{ 
                      padding: '12px',
                      borderBottom: '1px solid rgba(0,0,0,0.12)',
                      textAlign: 'left'
                    }}>
                      {normalizeRoundNumber(index + 1)}
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
                        {round.rivals.map(rival => (
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
                      ${round.bid}
                    </td>
                    <td style={{ 
                      padding: '12px',
                      borderBottom: '1px solid rgba(0,0,0,0.12)',
                      textAlign: 'right',
                      color: round.profit >= 0 ? '#2e7d32' : '#d32f2f'
                    }}>
                      ${round.profit.toFixed(2)}
                    </td>
                    <td style={{ 
                      padding: '12px',
                      borderBottom: '1px solid rgba(0,0,0,0.12)',
                      textAlign: 'right'
                    }}>
                      {(round.marketShare * 100).toFixed(1)}%
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
            <div>Min: ${minBid ?? 0}</div>
            <div>Max: ${maxBid ?? 0}</div>
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
              min={minBid ?? 0}
              max={maxBid ?? 0}
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
              placeholder={`Bid (${minBid ?? 0}-${maxBid ?? 0})`}
            />

            <button
              type="submit"
              disabled={!isInputEnabled() || !bid}
              style={{
                width: '96%',
                padding: '12px',
                fontSize: '16px',
                fontWeight: 600,
                color: '#fff',
                backgroundColor: !isInputEnabled() || !bid ? '#ccc' : '#1976d2',
                border: 'none',
                borderRadius: '4px',
                cursor: isInputEnabled() && bid ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.2s'
              }}
            >
              {hasBidSubmitted ? 'Bid Submitted' :
               isTimedOut ? 'Timed Out' :
               !isGameActive ? 'Waiting for Round' :
               'Submit Bid'}
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
                {gameState?.roundHistory?.map((round, index) => (
                  <tr key={index}>
                    <td style={{ 
                      padding: '12px',
                      borderBottom: '1px solid rgba(0,0,0,0.12)',
                      textAlign: 'left'
                    }}>
                      {normalizeRoundNumber(index + 1)}
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
                        {round.rivals.map(rival => (
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
                      ${round.bid}
                    </td>
                    <td style={{ 
                      padding: '12px',
                      borderBottom: '1px solid rgba(0,0,0,0.12)',
                      textAlign: 'right',
                      color: round.profit >= 0 ? '#2e7d32' : '#d32f2f'
                    }}>
                      ${round.profit.toFixed(2)}
                    </td>
                    <td style={{ 
                      padding: '12px',
                      borderBottom: '1px solid rgba(0,0,0,0.12)',
                      textAlign: 'right'
                    }}>
                      {(round.marketShare * 100).toFixed(1)}%
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
