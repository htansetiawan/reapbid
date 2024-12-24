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

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Game Status</Typography>
          <Chip
            label={gameStatus}
            color={
              gameState?.isActive ? 'success' :
              gameState?.isEnded ? 'error' :
              'warning'
            }
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Session ID: {currentSessionId}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Player Name: {playerName}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body1">
            Round: {Math.min(gameState?.currentRound ?? 0, gameState?.totalRounds ?? 0)} / {gameState?.totalRounds ?? 0}
          </Typography>
        </Box>

        {gameState?.players?.[playerName] && (
          <Box>
            <Typography variant="body2" color="text.secondary">
              Your Status:
            </Typography>
            <Typography>
              {gameState.players[playerName].hasSubmittedBid ? 'Bid Submitted' :
               gameState.players[playerName].isTimedOut ? 'Timed Out' :
               gameState.isActive ? 'Waiting for Your Bid' : 'Waiting for Round'}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default GameStatusDisplay;
