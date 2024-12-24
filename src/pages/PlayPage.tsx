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
import { SessionStorageAdapter } from '../storage/SessionStorageAdapter';

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
  const [canJoinSession, setCanJoinSession] = useState(true);

  // Extract name from email (everything before @) and normalize by removing dots
  const playerName = user?.email ? user.email.split('@')[0].replace(/\./g, '') : '';

  // Check for stored session on mount
  useEffect(() => {
    const storedSession = localStorage.getItem('sessionId');
    if (storedSession) {
      selectSession(storedSession);
      setShowSessionDialog(false);
    }
  }, []);

  // Check if player can join current session
  useEffect(() => {
    if (!currentSessionId) return;

    const checkJoinStatus = async () => {
      try {
        const storage = new SessionStorageAdapter(currentSessionId);
        const state = await storage.getGameState();
        
        const isRegistered = state?.players?.[playerName] !== undefined;
        const currentPlayers = state?.players ? Object.keys(state.players).length : 0;
        console.log('Raw state maxPlayers:', state?.maxPlayers);
        const maxPlayers = state?.maxPlayers || 2;
        console.log('isRegistered:', isRegistered);
        console.log('currentPlayers:', currentPlayers);
        console.log('maxPlayers:', maxPlayers);
        setCanJoinSession(isRegistered || currentPlayers < maxPlayers);
      } catch (error: any) {
        console.error('Error checking join status:', error);
      }
    };

    checkJoinStatus();
  }, [currentSessionId, playerName]);

  // Subscribe to game state changes
  useEffect(() => {
    if (!currentSessionId) {
      setGameStatus('Select a Session');
      return;
    }

    if (!hasJoined) {
      setGameStatus('Welcoming players');
    } else if (gameState?.isEnded) {
      setGameStatus('No More Bid');
    } else if (gameState?.isActive && gameState?.roundStartTime != null) {
      setGameStatus('Place your Bid');
    } else if (!gameState?.hasGameStarted) {
      setGameStatus('Game Starting Soon');
    } else {
      setGameStatus('Round not Started');
    }
  }, [currentSessionId, hasJoined, gameState]);

  // Check if player is already registered
  useEffect(() => {
    if (!currentSessionId) return;

    const checkRegistration = async () => {
      try {
        const storage = new SessionStorageAdapter(currentSessionId);
        const state = await storage.getGameState();
        if (state?.players?.[playerName]) {
          setHasJoined(true);
        }
      } catch (error) {
        console.error('Error checking registration:', error);
      }
    };

    checkRegistration();
  }, [currentSessionId, playerName]);

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

  const handleSessionSelect = async (sessionId: string) => {
    if (!playerName) {
      setError('Please enter your name first');
      return;
    }

    try {
      setError('');
      const storage = new SessionStorageAdapter(sessionId);
      const gameState = await storage.getGameState();
      
      // Check if player is registered
      const isPlayerRegistered = gameState?.players?.[playerName] !== undefined;
      const currentPlayers = gameState?.players ? Object.keys(gameState.players).length : 0;
      const maxPlayers = gameState?.maxPlayers || 10;
      
      if (!isPlayerRegistered && currentPlayers >= maxPlayers) {
        setError('This session is full. Only previously registered players can join.');
        return;
      }

      // If we get here, either:
      // 1. The session is not full, or
      // 2. The player is already registered
      await selectSession(sessionId);
      localStorage.setItem('sessionId', sessionId);
      setShowSessionDialog(false);
      
    } catch (error) {
      console.error('Error checking session state:', error);
      setError('Error joining session. Please try again.');
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
          onSelectSession={handleSessionSelect}
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
            {!canJoinSession && (
              <Typography variant="body2" color="error" sx={{ mb: 2 }}>
                This session is full. Only previously registered players can join.
              </Typography>
            )}
            <Button
              variant="contained"
              onClick={handleJoinGame}
              fullWidth={isMobile}
              disabled={!canJoinSession}
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
        onSelectSession={handleSessionSelect}
      />
    </Container>
  );
};

export default PlayPage;
