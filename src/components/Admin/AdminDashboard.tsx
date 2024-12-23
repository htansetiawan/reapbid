import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import PlayerTrackingTable from './PlayerTrackingTable';
import RivalryTable from './RivalryTable';
import GameSummaryTable from './GameSummaryTable';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  ThemeProvider,
  createTheme,
  Stack
} from '@mui/material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc3545',
    },
    success: {
      main: '#28a745',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          padding: '24px',
          marginBottom: '24px',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          textTransform: 'none',
          padding: '8px 16px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 4,
          },
        },
      },
    },
  },
});

interface PlayerStats {
  totalProfit: number;
  avgMarketShare: number;
  avgBid: number;
  bestRound: number;
  bestProfit: number;
  status: string;
  currentBid: string;
}

const AdminDashboard: React.FC = () => {
  const { gameState, startGame, startRound, endCurrentRound, endGame, resetGame, autoAssignRivals } = useGame();
  const [totalRounds, setTotalRounds] = useState('5');
  const [roundTimeLimit, setRoundTimeLimit] = useState('60');
  const [minBid, setMinBid] = useState('0');
  const [maxBid, setMaxBid] = useState('100');
  const [costPerUnit, setCostPerUnit] = useState('50');
  const [maxPlayers, setMaxPlayers] = useState('200');
  const [extendTimeAmount, setExtendTimeAmount] = useState('30');
  const [error, setError] = useState<string | null>(null);

  const handleStartGame = () => {
    startGame({
      totalRounds: parseInt(totalRounds),
      roundTimeLimit: parseInt(roundTimeLimit),
      minBid: parseInt(minBid),
      maxBid: parseInt(maxBid),
      costPerUnit: parseInt(costPerUnit),
      maxPlayers: parseInt(maxPlayers)
    });
  };

  const handleNextRound = () => {
    if (gameState?.isActive) {
      if ((gameState?.currentRound ?? 0) === (gameState?.totalRounds ?? 0)) {
        endCurrentRound();
      } else {
        endCurrentRound();
      }
    } else {
      const playerCount = Object.keys(gameState?.players || {}).length;
      if (playerCount < 2) {
        setError('Cannot start round: At least 2 players are required to start the game');
        return;
      }

      const playerNames = Object.keys(gameState?.players || {});
      const unassignedPlayers = playerNames.filter(player => {
        const rivals = gameState?.rivalries?.[player] || [];
        return rivals.length === 0;
      });

      if (unassignedPlayers.length > 0) {
        setError(`Cannot start round: The following players don't have rivals assigned: ${unassignedPlayers.join(', ')}`);
        return;
      }
      setError(null);
      startRound();
    }
  };

  const handleStartRound = () => {
    const playerCount = Object.keys(gameState?.players || {}).length;
    if (playerCount < 2) {
      setError(`Cannot start round: Need at least 2 players (currently have ${playerCount})`);
      return;
    }

    if (gameState?.isEnded) {
      setError('Game has ended. Cannot start new round.');
      return;
    }

    if (gameState?.isActive) {
      setError('Cannot start new round while current round is active.');
      return;
    }

    if ((gameState?.currentRound ?? 0) >= (gameState?.totalRounds ?? 0)) {
      setError('Maximum rounds reached. Cannot start new round.');
      return;
    }

    // Clear any previous errors
    setError(null);

    // Check for players without rivals only in round 1
    if (gameState?.currentRound === 1 && !gameState?.isActive) {
      const playersWithoutRivals = Object.keys(gameState?.players || {}).filter(
        playerName => !(gameState?.rivalries?.[playerName]?.length ?? 0)
      );

      if (playersWithoutRivals.length > 0) {
        setError(`The following players don't have rivals assigned: ${playersWithoutRivals.join(', ')}. Please assign rivals before starting the round.`);
        return;
      }
    }

    startRound();
  };

  const handleEndGame = () => {
    if (window.confirm('Are you sure you want to end the game? This will end the current round and show final statistics to all players.')) {
      if (gameState?.isActive) {
        endCurrentRound();
      }
      endGame();
    }
  };

  const handleAutoAssignRivals = () => {
    if (!gameState.hasGameStarted || gameState.isEnded) return;
    autoAssignRivals();
  };

  const calculatePlayerStats = () => {
    const stats: Record<string, PlayerStats> = {};
    const players = Object.entries(gameState?.players || {});

    players.forEach(([playerId, player]) => {
      const currentBid = gameState?.roundBids?.[playerId];
      const roundHistory = gameState?.roundHistory || [];
      
      // Calculate profits and market shares from round history
      const roundData = roundHistory.map(round => ({
        profit: round.profits?.[playerId] || 0,
        marketShare: round.marketShares?.[playerId] || 0,
        bid: round.bids?.[playerId] || 0
      }));

      const totalProfit = roundData.reduce((sum: number, round) => sum + round.profit, 0);
      const avgMarketShare = roundData.length > 0
        ? roundData.reduce((sum: number, round) => sum + round.marketShare, 0) / roundData.length
        : 0;

      // Find the best round (highest profit)
      let bestRound = 0;
      let bestProfit = -Infinity;
      roundData.forEach((round, index: number) => {
        if (round.profit > bestProfit) {
          bestProfit = round.profit;
          bestRound = index + 1;
        }
      });

      stats[playerId] = {
        totalProfit,
        avgMarketShare,
        avgBid: currentBid || 0,
        bestRound,
        bestProfit,
        status: player.isTimedOut ? 'Timed Out' : 
                player.hasSubmittedBid ? 'Submitted' : 'Waiting',
        currentBid: currentBid !== undefined ? `$${currentBid.toFixed(2)}` : '-'
      };
    });

    return stats;
  };

  const isLastRound = (gameState?.currentRound ?? 0) >= (gameState?.totalRounds ?? 0);
  const isFinalRound = (gameState?.currentRound ?? 0) === (gameState?.totalRounds ?? 0);
  const isGameEnded = gameState?.isEnded;

  const getDisplayRound = () => {
    const currentRound = gameState?.currentRound ?? 0;
    const totalRounds = gameState?.totalRounds ?? 0;
    return Math.min(currentRound, totalRounds);
  };

  const handleEndRound = async () => {
    // No implementation
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ 
        minHeight: '100vh', 
        backgroundColor: 'background.default', 
        py: 4 
      }}>
        <Container maxWidth="xl">
          {/* Header Section */}
          <Paper sx={{ mb: 3 }}>
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2
            }}>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 500 }}>
                Admin Dashboard
              </Typography>
              {!gameState?.hasGameStarted && (
                <Button
                  variant="contained"
                  onClick={handleStartGame}
                  color="primary"
                >
                  Start Game
                </Button>
              )}
            </Box>
          </Paper>

          {/* Game Configuration Form */}
          {!gameState?.hasGameStarted && (
            <Paper>
              <Typography variant="h5" sx={{ mb: 3 }}>Game Configuration</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Total Rounds"
                    type="number"
                    value={totalRounds}
                    onChange={(e) => setTotalRounds(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Round Time Limit (seconds)"
                    type="number"
                    value={roundTimeLimit}
                    onChange={(e) => setRoundTimeLimit(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Minimum Bid"
                    type="number"
                    value={minBid}
                    onChange={(e) => setMinBid(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Maximum Bid"
                    type="number"
                    value={maxBid}
                    onChange={(e) => setMaxBid(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Cost Per Unit"
                    type="number"
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Maximum Players"
                    type="number"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(e.target.value)}
                  />
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Game Status Display */}
          {gameState?.hasGameStarted && (
            <Paper>
              <Typography variant="h5" sx={{ mb: 3 }}>Game Status</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="h6" gutterBottom>
                    Round {getDisplayRound()} of {(gameState?.totalRounds ?? 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {(gameState?.isActive ? 'Round in Progress' : 'Round Ended')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body1">
                    <strong>Total Rounds:</strong> {(gameState?.totalRounds ?? 0)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body1">
                    <strong>Round Status:</strong> {(gameState?.isActive ? 'Active' : 'Inactive')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body1">
                    <strong>Players:</strong> {Object.keys(gameState?.players || {}).length} / {(gameState?.maxPlayers ?? 0)}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Game Controls */}
          {gameState?.hasGameStarted && (
            <Paper>
              {error && (
                <Typography color="error" sx={{ mb: 2 }}>
                  {error}
                </Typography>
              )}
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 2
              }}>
                <Typography variant="body1" sx={{
                  fontSize: '16px',
                  color: '#495057',
                  fontWeight: 500
                }}>
                  {(gameState?.isEnded ? (
                    <span style={{ color: '#dc3545' }}>Game Ended</span>
                  ) : (
                    <>
                      Round {getDisplayRound()} of {(gameState?.totalRounds ?? 0)}
                      {(isFinalRound && (
                        <span style={{ 
                          color: '#dc3545',
                          marginLeft: '10px',
                          fontSize: '14px',
                          fontWeight: 500
                        }}>
                          (Final Round)
                        </span>
                      ))}
                    </>
                  ))}
                </Typography>
                {!gameState?.isEnded && (
                  <Typography variant="body1" sx={{
                    fontSize: '16px',
                    color: (gameState?.isActive ? '#28a745' : '#6c757d'),
                    fontWeight: 500
                  }}>
                    {(gameState?.isActive ? 'Round in Progress' : 'Round Ended')}
                  </Typography>
                )}
              </Box>
              <Stack direction="row" spacing={2}>
                {gameState?.hasGameStarted && !gameState?.isEnded && (
                  <>
                    <Button
                      variant="contained"
                      onClick={handleNextRound}
                      disabled={!gameState?.isActive && (gameState?.currentRound ?? 0) > (gameState?.totalRounds ?? 0)}
                      color={gameState?.isActive ? "error" : "success"}
                    >
                      {gameState?.isActive ? 'End Round' : 'Start Round'}
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={handleEndGame}
                    >
                      End Game
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleAutoAssignRivals}
                      disabled={gameState?.currentRound > 1 || gameState?.isActive || isLastRound || isGameEnded}
                    >
                      Update Rivalries
                    </Button>
                  </>
                )}
              </Stack>
            </Paper>
          )}

          {/* Player Tracking Table */}
          {gameState?.hasGameStarted && (
            <Paper>
              <Typography variant="h5" sx={{ mb: 3 }}>Player Tracking</Typography>
              <PlayerTrackingTable playerStats={calculatePlayerStats()} />
            </Paper>
          )}

          {/* Rivalry Table */}
          {gameState?.hasGameStarted && (
            <Paper sx={{
              opacity: (gameState?.currentRound ?? 0) > 0 ? 0.7 : 1,
              pointerEvents: (gameState?.currentRound ?? 0) > 0 ? 'none' : 'auto'
            }}>
              <Box sx={{ position: 'relative' }}>
                {!(gameState?.currentRound == 1 && !gameState?.isActive) && (
                  <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    zIndex: 1
                  }}>
                    Rivals cannot be modified after game starts
                  </Box>
                )}
                <Typography variant="h5" sx={{ mb: 3 }}>Rivalries</Typography>
                <RivalryTable />
              </Box>
            </Paper>
          )}

          {/* Game Summary */}
          {gameState?.hasGameStarted && gameState?.roundHistory?.length > 0 && (
            <Paper>
              <GameSummaryTable />
            </Paper>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default AdminDashboard;
