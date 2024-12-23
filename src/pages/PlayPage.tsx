import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Container,
  useTheme,
  useMediaQuery,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import BiddingInterface from '../components/User/BiddingInterface';

const PlayPage: React.FC = () => {
  const { user } = useAuth();
  const { gameState, registerPlayer } = useGame();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [error, setError] = useState<string>('');
  const [hasJoined, setHasJoined] = useState(false);
  const [gameStatus, setGameStatus] = useState<string>('');

  // Extract name from email (everything before @) and normalize by removing dots
  const playerName = user?.email ? user.email.split('@')[0].replace(/\./g, '') : '';

  // Subscribe to game state changes
  useEffect(() => {
    if (gameState?.isActive && !hasJoined) {
      setGameStatus('Round in Progress - Join Now!');
    } else if (!gameState?.hasGameStarted) {
      setGameStatus('Waiting for Game to Start');
    } else if (gameState?.isEnded) {
      setGameStatus('Game has Ended');
    } else if (!gameState?.isActive && gameState?.hasGameStarted) {
      setGameStatus('Waiting for Next Round');
    }
  }, [gameState?.isActive, gameState?.hasGameStarted, gameState?.isEnded, hasJoined]);

  // Check if player is already registered
  useEffect(() => {
    if (gameState?.players?.[playerName]) {
      setHasJoined(true);
    }
  }, [gameState?.players, playerName]);

  const handleJoinGame = async () => {
    try {
      setError('');

      // Check if game has started
      if (!gameState?.hasGameStarted) {
        setError('The game has not started yet. Please wait for the host to start the game.');
        return;
      }

      // Check if game is already full
      if (Object.keys(gameState?.players || {}).length >= (gameState?.maxPlayers ?? 0)) {
        setError('The game is full. Please try again later.');
        return;
      }

      // Register the player
      await registerPlayer(playerName);
      setHasJoined(true);
    } catch (err) {
      setError('Failed to join the game. Please try again.');
      console.error('Error joining game:', err);
    }
  };

  const getDisplayRound = () => {
    const currentRound = gameState?.currentRound ?? 0;
    const totalRounds = gameState?.totalRounds ?? 0;
    return Math.min(currentRound, totalRounds);
  };

  // If player has joined, show BiddingInterface
  if (hasJoined) {
    return <BiddingInterface playerName={playerName} />;
  }

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: 'calc(100vh - 64px)', // Account for navbar height
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Card
          elevation={3}
          sx={{
            width: '100%',
            maxWidth: 480,
            borderRadius: 2,
            bgcolor: 'background.paper',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Typography
              variant="h4"
              align="center"
              gutterBottom
              sx={{
                fontWeight: 600,
                color: 'primary.main',
                mb: 3,
                letterSpacing: '-0.5px',
              }}
            >
              ReapBid
            </Typography>

            {/* Game Status */}
            <Typography
              variant="h6"
              align="center"
              gutterBottom
              sx={{ color: 'text.primary', mb: 2 }}
            >
              {gameState?.hasGameStarted ? 'Game in Progress' : 'Waiting for Game to Start'}
            </Typography>

            {/* Error Message */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Display Name */}
            <Typography
              variant="body1"
              align="center"
              sx={{ 
                color: 'text.secondary',
                mb: 4,
                fontWeight: 500,
                bgcolor: 'action.hover',
                py: 2,
                px: 3,
                borderRadius: 1,
              }}
            >
              You will play as: {playerName}
            </Typography>

            {/* Game Info */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="body2" color="text.secondary" align="center">
                Players: {Object.keys(gameState?.players || {}).length} / {gameState?.maxPlayers ?? 0}
              </Typography>
              {gameState?.hasGameStarted && (
                <>
                  <Typography variant="body1" style={{ marginBottom: '8px' }}>
                    Round: {getDisplayRound()} / {gameState?.totalRounds ?? 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                    Cost per Unit: ${gameState?.costPerUnit ?? 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                    Bid Range: ${gameState?.minBid ?? 0} - ${gameState?.maxBid ?? 0}
                  </Typography>
                </>
              )}
              {/* Game Status Alert */}
              {gameStatus && (
                <Alert 
                  severity={gameState?.isActive ? "info" : "warning"}
                  sx={{ mt: 2 }}
                >
                  {gameStatus}
                </Alert>
              )}
            </Box>

            {/* Join Button */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleJoinGame}
              disabled={!gameState?.hasGameStarted}
              sx={{
                height: 48,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
                borderRadius: 1,
              }}
            >
              {gameState?.hasGameStarted ? 'Join Game' : 'Waiting for Game to Start...'}
            </Button>

            {/* Instructions */}
            <Typography
              variant="body2"
              align="center"
              color="text.secondary"
              sx={{ mt: 3 }}
            >
              {gameState?.hasGameStarted 
                ? 'Click Join Game to start bidding'
                : 'Please wait for the host to start the game'}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default PlayPage;
