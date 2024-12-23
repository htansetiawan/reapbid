import React, { useState } from 'react';
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

  // Extract name from email (everything before @)
  const playerName = user?.email ? user.email.split('@')[0] : '';

  const handleJoinGame = async () => {
    try {
      setError('');

      // Check if game has started
      if (!gameState.hasGameStarted) {
        setError('The game has not started yet. Please wait for the host to start the game.');
        return;
      }

      // Check if game is already full
      if (Object.keys(gameState.players).length >= gameState.maxPlayers) {
        setError('The game is full. Please try again later.');
        return;
      }

      // Check if player is already registered
      if (gameState.players[playerName]) {
        setHasJoined(true);
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
              {gameState.hasGameStarted ? 'Game in Progress' : 'Waiting for Game to Start'}
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
                Players: {Object.keys(gameState.players).length} / {gameState.maxPlayers}
              </Typography>
              {gameState.hasGameStarted && (
                <Typography variant="body2" color="text.secondary" align="center">
                  Round: {gameState.currentRound} / {gameState.totalRounds}
                </Typography>
              )}
            </Box>

            {/* Join Button */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleJoinGame}
              disabled={!gameState.hasGameStarted}
              sx={{
                height: 48,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
                borderRadius: 1,
              }}
            >
              {gameState.hasGameStarted ? 'Join Game' : 'Waiting for Game to Start...'}
            </Button>

            {/* Instructions */}
            <Typography
              variant="body2"
              align="center"
              color="text.secondary"
              sx={{ mt: 3 }}
            >
              {gameState.hasGameStarted 
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
