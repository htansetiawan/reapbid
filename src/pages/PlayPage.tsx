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
import { useSession } from '../context/SessionContext';
import BiddingInterface from '../components/User/BiddingInterface';
import SessionSelectionDialog from '../components/User/SessionSelectionDialog';
import GameStatusDisplay from '../components/User/GameStatusDisplay';

const PlayPage: React.FC = () => {
  const { user } = useAuth();
  const { gameState, registerPlayer } = useGame();
  const { currentSessionId, selectSession, exitSession } = useSession();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [error, setError] = useState<string>('');
  const [hasJoined, setHasJoined] = useState(false);
  const [gameStatus, setGameStatus] = useState<string>('');
  const [showSessionDialog, setShowSessionDialog] = useState(false);

  // Extract name from email (everything before @) and normalize by removing dots
  const playerName = user?.email ? user.email.split('@')[0].replace(/\./g, '') : '';

  // Check for stored session on mount
  useEffect(() => {
    const storedSession = localStorage.getItem('sessionId');
    if (storedSession) {
      selectSession(storedSession);
    } else {
      setShowSessionDialog(true);
    }
  }, []);

  // Subscribe to game state changes
  useEffect(() => {
    if (!currentSessionId) {
      setGameStatus('Select a Session');
      return;
    }

    if (gameState?.isActive && !hasJoined) {
      setGameStatus('Round in Progress!');
    } else if (!gameState?.hasGameStarted) {
      setGameStatus('Waiting for Next Game!');
    } else if (gameState?.isEnded) {
      setGameStatus('Game has Ended');
    } else if (!gameState?.isActive && gameState?.hasGameStarted) {
      setGameStatus('Next Round Starting Soon!');
    }
  }, [currentSessionId, gameState?.isActive, gameState?.hasGameStarted, gameState?.isEnded, hasJoined]);

  // Check if player is already registered
  useEffect(() => {
    console.log('Checking player registration:', {
      playerName,
      players: gameState?.players,
      hasJoined,
      isRegistered: gameState?.players?.[playerName]
    });

    if (gameState?.players?.[playerName]) {
      setHasJoined(true);
    }
  }, [gameState?.players, playerName]);

  const handleJoinGame = async () => {
    try {
      console.log('Joining game:', playerName);
      await registerPlayer(playerName);
      setHasJoined(true);
      setError('');
    } catch (err) {
      console.error('Failed to join game:', err);
      setError(err instanceof Error ? err.message : 'Failed to join game');
    }
  };

  const handleSelectSession = async (sessionId: string) => {
    try {
      console.log('Selecting session:', sessionId);
      await selectSession(sessionId);
      localStorage.setItem('sessionId', sessionId);
      setShowSessionDialog(false);
      setError('');
    } catch (err) {
      console.error('Failed to select session:', err);
      setError(err instanceof Error ? err.message : 'Failed to select session');
    }
  };

  const handleExitSession = () => {
    localStorage.removeItem('sessionId');
    setHasJoined(false);
    exitSession();
    setShowSessionDialog(true);
  };

  if (!currentSessionId) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Welcome to ReapBid
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Please select a game session to continue.
            </Typography>
            <Button
              variant="contained"
              onClick={() => setShowSessionDialog(true)}
              fullWidth
            >
              Select Session
            </Button>
          </CardContent>
        </Card>
        <SessionSelectionDialog
          open={showSessionDialog}
          onClose={() => setShowSessionDialog(false)}
          onSelectSession={handleSelectSession}
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Game Session
        </Typography>
        {currentSessionId && (
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleExitSession}
            sx={{ ml: 2 }}
          >
            Exit Session
          </Button>
        )}
      </Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <GameStatusDisplay
        playerName={playerName}
        gameStatus={gameStatus}
      />

      {!hasJoined ? (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Join Game
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              You'll be registered as: {playerName}
            </Typography>
            <Button
              variant="contained"
              onClick={handleJoinGame}
              fullWidth={isMobile}
            >
              Join Game
            </Button>
          </CardContent>
        </Card>
      ) : (
        <BiddingInterface
          playerName={playerName}
          isActive={gameState?.isActive ?? false}
          hasSubmittedBid={gameState?.players?.[playerName]?.hasSubmittedBid ?? false}
          isTimedOut={gameState?.players?.[playerName]?.isTimedOut ?? false}
          minBid={gameState?.minBid}
          maxBid={gameState?.maxBid}
        />
      )}

      <SessionSelectionDialog
        open={showSessionDialog}
        onClose={() => setShowSessionDialog(false)}
        onSelectSession={handleSelectSession}
      />
    </Container>
  );
};

export default PlayPage;
