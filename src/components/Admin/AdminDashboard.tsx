import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useSession } from '../../context/SessionContext';
import { SessionManager } from './SessionManager';
import PlayerTrackingTable from './PlayerTrackingTable';
import RivalryTable from './RivalryTable';
import GameSummaryTable from './GameSummaryTable';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Stack,
  ThemeProvider,
  createTheme,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  LinearProgress,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  RestartAlt as RestartAltIcon,
  Shuffle as ShuffleIcon
} from '@mui/icons-material';

interface PlayerStats {
  playerId: string;
  totalProfit: number;
  avgMarketShare: number;
  avgBid: number;
  bestRound: number;
  bestProfit: number;
  status: string;
  currentBid: string;
}

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

const AdminDashboard: React.FC = () => {
  const { 
    gameState, 
    startGame, 
    startRound, 
    endCurrentRound, 
    endGame, 
    resetGame, 
    autoAssignRivals 
  } = useGame();
  const { currentSessionId, updateSessionStatus } = useSession();
  const [playerStats, setPlayerStats] = useState<Record<string, PlayerStats>>({});

  const isGameEnded = gameState?.isEnded ?? false;
  const isRoundActive = gameState?.roundStartTime != null;
  const displayRound = Math.min(gameState?.currentRound ?? 0, gameState?.totalRounds ?? Infinity);
  const playerCount = Object.keys(gameState?.players ?? {}).length;
  const gameStatus = !gameState ? 'Not Started' : 
                    gameState.isEnded ? 'Ended' : 
                    !gameState.isActive ? 'Waiting' : 'In Progress';

  const calculatePlayerStats = (): Record<string, PlayerStats> => {
    if (!gameState?.players) return {};
    
    const stats: Record<string, PlayerStats> = {};
    const players = Object.entries(gameState.players);

    players.forEach(([playerId, player]) => {
      const currentBid = gameState.roundBids?.[playerId];
      const roundHistory = gameState.roundHistory || [];
      
      // Calculate profits and market shares from round history
      const roundData = roundHistory.map(round => ({
        profit: round.profits?.[playerId] || 0,
        marketShare: round.marketShares?.[playerId] || 0,
        bid: round.bids?.[playerId] || 0
      }));

      const totalProfit = roundData.reduce((sum, round) => sum + round.profit, 0);
      const avgMarketShare = roundData.length > 0
        ? roundData.reduce((sum, round) => sum + round.marketShare, 0) / roundData.length
        : 0;
      const avgBid = roundData.length > 0
        ? roundData.reduce((sum, round) => sum + round.bid, 0) / roundData.length
        : 0;

      // Find best round (highest profit)
      let bestRound = 0;
      let bestProfit = -Infinity;
      roundData.forEach((round, index) => {
        if (round.profit > bestProfit) {
          bestProfit = round.profit;
          bestRound = index + 1;
        }
      });

      stats[playerId] = {
        playerId,
        totalProfit,
        avgMarketShare,
        avgBid,
        bestRound,
        bestProfit,
        status: player.isTimedOut ? 'Timed Out' : 
                player.hasSubmittedBid ? 'Submitted' : 'Waiting',
        currentBid: currentBid !== undefined ? `$${currentBid.toFixed(2)}` : '-'
      };
    });

    return stats;
  };

  useEffect(() => {
    setPlayerStats(calculatePlayerStats());
  }, [gameState?.players]);

  const handleStartGame = async () => {
    if (!currentSessionId) {
      console.error('No session selected');
      return;
    }

    try {
      await startGame({
        totalRounds: 3,
        roundTimeLimit: 60,
        minBid: 0,
        maxBid: 100,
        costPerUnit: 50,
        maxPlayers: 4
      });
      await updateSessionStatus(currentSessionId, 'active');
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  const handleNextRound = async () => {
    try {
      if (isRoundActive) {
        // Check all players submitted bids
        if (!Object.values(gameState?.players || {}).every(p => p.hasSubmittedBid)) {
          console.warn('Cannot end round: Not all players have submitted bids');
          return;
        }
        await endCurrentRound();
      } else {
        // Check round limit
        if (gameState && gameState.currentRound > gameState.totalRounds) {
          console.warn('Cannot start round: Exceeded total rounds');
          return;
        }
        await startRound();
      }
    } catch (error) {
      console.error('Error handling round:', error);
    }
  };

  const handleEndGame = async () => {
    try {
      console.log('Ending game...');
      await endGame();
      console.log('Game ended successfully');
    } catch (error) {
      console.error('Error ending game:', error);
    }
  };

  const handleAutoAssignRivals = async () => {
    await autoAssignRivals();
  };

  const handleResetGame = async () => {
    try {
      await resetGame();
    } catch (error) {
      console.error('Error resetting game:', error);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 4 }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            Admin Dashboard
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Session Management
                </Typography>
                <SessionManager />
              </Paper>
            </Grid>

            {currentSessionId && (
              <>
                <Grid item xs={12}>
                  <Paper sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Game Controls
                      </Typography>
                      <Typography>
                        Status: <strong>{gameStatus}</strong>
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={2}>
                      {gameState?.isActive && !isGameEnded && (
                        <>
                          {!isRoundActive && gameState.currentRound <= gameState.totalRounds && (
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={handleNextRound}
                              startIcon={<PlayArrowIcon />}
                            >
                              Start Round {gameState.currentRound}
                            </Button>
                          )}

                          {isRoundActive && (
                            <Button
                              variant="contained"
                              color="secondary"
                              onClick={handleNextRound}
                              startIcon={<StopIcon />}
                            >
                              End Round {gameState.currentRound}
                            </Button>
                          )}

                          {!isRoundActive && gameState.currentRound > gameState.totalRounds && (
                            <Button
                              variant="contained"
                              color="error"
                              onClick={handleEndGame}
                              startIcon={<StopIcon />}
                            >
                              End Game
                            </Button>
                          )}
                        </>
                      )}

                      {!gameState?.isActive && !isGameEnded && (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleStartGame}
                          startIcon={<PlayArrowIcon />}
                        >
                          Start Game
                        </Button>
                      )}

                      {gameState?.isActive && !isRoundActive && !isGameEnded && (
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={handleAutoAssignRivals}
                          startIcon={<ShuffleIcon />}
                        >
                          Auto-assign Rivals
                        </Button>
                      )}
                    </Stack>

                    {gameState && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Game Progress: Round {displayRound} of {gameState.totalRounds}
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>

                {currentSessionId && gameState && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Player Tracking
                      </Typography>
                      <PlayerTrackingTable playerStats={playerStats} />
                    </Paper>
                  </Grid>
                )}

                {currentSessionId && gameState?.roundHistory?.length > 0 && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Game Summary
                      </Typography>
                      <GameSummaryTable />
                    </Paper>
                  </Grid>
                )}
              </>
            )}
          </Grid>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default AdminDashboard;
