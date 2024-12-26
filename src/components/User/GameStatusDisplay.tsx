import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip
} from '@mui/material';
import { useGame } from '../../context/GameContext';
import { useSession } from '../../context/SessionContext';
import { displayRound } from '../../utils/gameFormatters';

interface GameStatusDisplayProps {
  playerName: string;
  gameStatus: string;
}

const GameStatusDisplay: React.FC<GameStatusDisplayProps> = ({
  playerName,
  gameStatus
}) => {
  const { gameState } = useGame();
  const { currentSessionId } = useSession();

  // Get visibility settings from gameState, use legacy behavior if not present
  const showRounds = gameState?.visibilitySettings?.showRounds ?? true;

  // Check if current round exceeds total rounds
  const currentRound = gameState?.currentRound ?? 0;
  const totalRounds = gameState?.totalRounds ?? 0;
  const isLastRoundCompleted = currentRound > totalRounds;

  // If last round is completed, override the game status
  const displayStatus = isLastRoundCompleted ? 'No More Bid' : gameStatus;

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6" gutterBottom>Game Status</Typography>
            {showRounds && gameState && (
              <Typography variant="body2" color="text.secondary">
                Round {displayRound(currentRound, totalRounds)}
              </Typography>
            )}
          </Box>
          <Chip
            label={displayStatus}
            color={
              displayStatus === 'No More Bid' ? 'error' :
              displayStatus === 'Place your Bid' ? 'success' :
              displayStatus === 'Select a Session' ? 'default' :
              'warning'
            }
            sx={{ 
              height: 'auto',
              '& .MuiChip-label': {
                display: 'block',
                padding: '10px 14px',
                fontSize: '1rem'
              }
            }}
          />
        </Box>

        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          color: 'text.secondary',
          fontSize: '0.875rem'
        }}>
          <Box>
            <Typography variant="body2">
              Session: {currentSessionId}
            </Typography>
            <Typography variant="body2">
              Player: {playerName}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default GameStatusDisplay;
