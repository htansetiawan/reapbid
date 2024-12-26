import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Typography, Box, TextField, Button } from '@mui/material';

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
  const [bidString, setBidString] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const navigate = useNavigate();

  const isGameEnded = gameState?.isEnded;
  const isFinalRound = (gameState?.currentRound ?? 0) === (gameState?.totalRounds ?? 0);

  // Get visibility settings from gameState, use legacy behavior if not present
  const showRounds = gameState?.visibilitySettings?.showRounds ?? true;
  const showCostPerUnit = gameState?.visibilitySettings?.showCostPerUnit ?? true;
  const showPriceRange = gameState?.visibilitySettings?.showPriceRange ?? true;

  // Convert bidString to number when needed
  const bid = bidString ? Number(bidString) : null;

  // Add utility function for round display
  const normalizeRoundNumber = (round: number) => {
    const totalRounds = gameState?.totalRounds ?? 0;
    return Math.min(round, totalRounds);
  };

  interface RivalStats {
    name: string;
    bid: number;
    profit: number;
    marketShare: number;
  }

  interface ProcessedRound {
    roundNumber: number;
    ownStats: {
      bid: number;
      profit: number;
      marketShare: number;
    };
    rivalStats: RivalStats[];
  }

  const processRoundHistory = (): ProcessedRound[] => {
    if (!gameState?.roundHistory) return [];
    
    return gameState.roundHistory.map((round, index) => {
      // Get rivals from gameState.rivalries
      const myRivals = gameState.rivalries?.[playerName] || [];
      
      // Get rival stats for this round
      const rivalStats = myRivals.map(rivalName => ({
        name: rivalName,
        bid: round.bids?.[rivalName] ?? 0,
        profit: round.profits?.[rivalName] ?? 0,
        marketShare: round.marketShares?.[rivalName] ?? 0
      }));

      return {
        roundNumber: index + 1,
        ownStats: {
          bid: round.bids?.[playerName] ?? 0,
          profit: round.profits?.[playerName] ?? 0,
          marketShare: round.marketShares?.[playerName] ?? 0
        },
        rivalStats
      };
    });
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
    // Check if game is active and round has started (roundStartTime exists)
    const roundStarted = gameState?.roundStartTime != null;
    return isGameActive && roundStarted && !hasBidSubmitted && !isTimedOut;
  };

  const handleBidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Allow empty string or numbers only (including decimals and leading zeros)
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      const numValue = value === '' ? 0 : Number(value);
      
      // Only update if within valid range or empty
      if (value === '' || (
        numValue >= (minBid ?? 0) && 
        numValue <= (maxBid ?? Infinity)
      )) {
        setBidString(value);
        setError(null);
      } else {
        // Keep the old value but show error
        if (numValue < (minBid ?? 0)) {
          setError(`Bid must be at least ${minBid}`);
        } else if (numValue > (maxBid ?? Infinity)) {
          setError(`Bid cannot exceed ${maxBid}`);
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bid) return;

    // Double check validation before submitting
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

  const calculatePlayerStats = () => {
    if (!gameState?.roundHistory) {
      return {
        totalProfit: 0,
        averageMarketShare: 0
      };
    }

    // Calculate total profit and market share from round history
    const stats = gameState.roundHistory.reduce((acc, round) => {
      const profit = round.profits?.[playerName] ?? 0;
      const marketShare = round.marketShares?.[playerName] ?? 0;
      
      return {
        totalProfit: acc.totalProfit + profit,
        totalMarketShare: acc.totalMarketShare + marketShare,
        roundCount: acc.roundCount + 1
      };
    }, { totalProfit: 0, totalMarketShare: 0, roundCount: 0 });

    return {
      totalProfit: stats.totalProfit,
      averageMarketShare: stats.roundCount > 0 ? stats.totalMarketShare / stats.roundCount : 0
    };
  };

  const { totalProfit, averageMarketShare } = calculatePlayerStats();

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
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <StatBox
              label="Total Profit"
              value={`$${totalProfit.toFixed(2)}`}
            />
            <StatBox
              label="Average Market Share"
              value={`${(averageMarketShare * 100).toFixed(1)}%`}
            />
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
                    Round
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
                {processRoundHistory().map((round) => (
                  <tr key={round.roundNumber}>
                    <td style={{ 
                      padding: '12px',
                      borderBottom: '1px solid rgba(0,0,0,0.12)',
                      fontWeight: 500
                    }}>
                      {round.roundNumber}
                    </td>
                    <td style={{ 
                      padding: '12px',
                      borderBottom: '1px solid rgba(0,0,0,0.12)',
                      whiteSpace: 'pre-line'
                    }}>
                      {round.rivalStats.map((rival, index) => (
                          <div key={index}>
                          {rival.name}:
                            {'\n'}
                          Bid: {rival.bid.toFixed(2)}
                            {'\n'}
                          Profit: {rival.profit.toFixed(2)}
                            {'\n'}
                          %: {(rival.marketShare * 100).toFixed(1)}%
                          {index < round.rivalStats.length - 1 ? '\n\n' : ''}
                          </div>
                      ))}
                    </td>
                    <td style={{ 
                      padding: '12px',
                      borderBottom: '1px solid rgba(0,0,0,0.12)',
                      textAlign: 'right'
                    }}>
                      ${round.ownStats.bid}
                    </td>
                    <td style={{ 
                      padding: '12px',
                      borderBottom: '1px solid rgba(0,0,0,0.12)',
                      textAlign: 'right',
                      color: round.ownStats.profit >= 0 ? '#2e7d32' : '#d32f2f'
                    }}>
                      ${round.ownStats.profit.toFixed(2)}
                    </td>
                    <td style={{ 
                      padding: '12px',
                      borderBottom: '1px solid rgba(0,0,0,0.12)',
                      textAlign: 'right'
                    }}>
                      {(round.ownStats.marketShare * 100).toFixed(1)}%
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
        margin: '0 auto'
      }}>
        <div style={{
          backgroundColor: '#fff',
          padding: '24px',
          borderRadius: '8px',
          border: '1px solid rgba(0,0,0,0.12)',
          textAlign: 'center'
        }}>
          <Typography variant="h6" sx={{ color: 'rgba(0,0,0,0.87)' }}>
            Waiting for Game to Start
          </Typography>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', maxWidth: '100%', margin: '0 auto' }}>
      <form onSubmit={handleSubmit}>
        <div style={{
          backgroundColor: '#fff',
          padding: '24px',
          borderRadius: '12px',
          border: '2px solid #1976d2',
          marginBottom: '16px'
        }}>
          <Typography variant="h5" gutterBottom sx={{ 
            textAlign: 'center',
            color: '#1976d2',
            fontWeight: 600,
            mb: 3
          }}>
            Enter Your Bid
          </Typography>

          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2
          }}>
            <Box sx={{
              position: 'relative',
              width: '100%',
              maxWidth: '300px'
            }}>
              <Typography
                sx={{
                  position: 'absolute',
                  left: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '24px',
                  color: '#1976d2',
                  zIndex: 1
                }}
              >
                $
              </Typography>
            <TextField
              value={bidString}
              onChange={handleBidChange}
              disabled={!isInputEnabled()}
              error={!!error}
              helperText={error}
              inputProps={{
                inputMode: 'decimal',
                pattern: '[0-9]*\\.?[0-9]*',
                min: gameState?.minBid ?? 0,
                max: gameState?.maxBid ?? 100,
                step: 0.01,
                style: {
                  fontSize: '32px',
                  textAlign: 'center',
                  padding: '16px 16px 16px 36px',
                  fontWeight: 500,
                  caretColor: '#1976d2'
                }
              }}
              sx={{
                width: '100%',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  backgroundColor: '#f8f9fa',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: '#e9ecef'
                  },
                  '&.Mui-focused': {
                    backgroundColor: '#fff',
                    boxShadow: '0 0 0 2px #1976d2'
                  }
                }
              }}
            />
            </Box>

              {showPriceRange && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                  Bid Range: ${gameState?.minBid ?? 0} - ${gameState?.maxBid ?? 100}
                </Typography>
              )}

              {showCostPerUnit && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                  Cost Per Unit: ${gameState?.costPerUnit ?? 25}
                </Typography>
              )}

            <Button
              type="submit"
              variant="contained"
              disabled={!isInputEnabled() || !bid}
              sx={{
                fontSize: '18px',
                padding: '12px 36px',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 6px rgba(25, 118, 210, 0.2)',
                '&:hover': {
                  boxShadow: '0 6px 8px rgba(25, 118, 210, 0.3)'
                }
              }}
            >
              {hasBidSubmitted ? 'Bid Submitted' :
               isTimedOut ? 'Timed Out' :
               !isGameActive ? 'Waiting for Round' :
               'Submit Bid'}
            </Button>
          </Box>
        </div>
      </form>

      {(gameState?.roundHistory?.length ?? 0) > 0 && (
        <div style={{
          backgroundColor: '#fff',
          padding: '16px',
          borderRadius: '8px',
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
                    Round
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
                {processRoundHistory().map((round) => (
                  <tr key={round.roundNumber}>
                    <td style={{ 
                      padding: '12px',
                      borderBottom: '1px solid rgba(0,0,0,0.12)',
                      fontWeight: 500
                    }}>
                      {round.roundNumber}
                    </td>
                    <td style={{ 
                      padding: '12px',
                      borderBottom: '1px solid rgba(0,0,0,0.12)',
                      whiteSpace: 'pre-line'
                    }}>
                      {round.rivalStats.map((rival, index) => (
                          <div key={index}>
                          {rival.name}:
                            {'\n'}
                          Bid: {rival.bid.toFixed(2)}
                            {'\n'}
                          Profit: {rival.profit.toFixed(2)}
                            {'\n'}
                          %: {(rival.marketShare * 100).toFixed(1)}%
                          {index < round.rivalStats.length - 1 ? '\n\n' : ''}
                          </div>
                      ))}
                    </td>
                    <td style={{ 
                      padding: '12px',
                      borderBottom: '1px solid rgba(0,0,0,0.12)',
                      textAlign: 'right'
                    }}>
                      ${round.ownStats.bid}
                    </td>
                    <td style={{ 
                      padding: '12px',
                      borderBottom: '1px solid rgba(0,0,0,0.12)',
                      textAlign: 'right',
                      color: round.ownStats.profit >= 0 ? '#2e7d32' : '#d32f2f'
                    }}>
                      ${round.ownStats.profit.toFixed(2)}
                    </td>
                    <td style={{ 
                      padding: '12px',
                      borderBottom: '1px solid rgba(0,0,0,0.12)',
                      textAlign: 'right'
                    }}>
                      {(round.ownStats.marketShare * 100).toFixed(1)}%
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
