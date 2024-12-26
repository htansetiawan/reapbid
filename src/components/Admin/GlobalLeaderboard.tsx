import React, { useState, useEffect } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  CircularProgress,
  Chip,
  Tooltip,
  Alert,
  AlertTitle
} from '@mui/material';
import { useSession } from '../../context/SessionContext';
import { 
  PlayerAggregator, 
  LeaderboardEntry, 
  SCORING_WEIGHTS,
  calculateLeaderboardPoints 
} from '../../types/leaderboard';
import { GameState, RoundResult } from '../../context/GameContext';
import { StorageFactory, StorageType } from '../../storage/StorageFactory';

type Order = 'asc' | 'desc';
type SortableKey = keyof Omit<LeaderboardEntry, 'bestGame' | 'bestRound'>;

interface HeadCell {
  id: SortableKey;
  label: string;
  numeric: boolean;
  format?: (value: number) => string;
  tooltip?: string;
}

const headCells: HeadCell[] = [
  { id: 'rank' as SortableKey, label: 'Rank', numeric: true },
  { id: 'username', label: 'Player', numeric: false },
  { 
    id: 'leaderboardPoints', 
    label: 'Points', 
    numeric: true,
    format: (value: number) => value.toFixed(1),
    tooltip: `Total points from: Games Won (${SCORING_WEIGHTS.GAME_WIN} each), Rounds Won (${SCORING_WEIGHTS.ROUND_WIN} each), Profit, and Consistency`
  },
  { 
    id: 'gamesWon', 
    label: 'Games Won', 
    numeric: true,
    tooltip: `Games where player had highest total profit (${SCORING_WEIGHTS.GAME_WIN} points each)`
  },
  { 
    id: 'roundsWon', 
    label: 'Rounds Won', 
    numeric: true,
    tooltip: `Rounds where player had highest profit (${SCORING_WEIGHTS.ROUND_WIN} points each)`
  },
  { 
    id: 'totalProfit', 
    label: 'Total Profits', 
    numeric: true,
    format: (value: number) => `$${value.toFixed(2)}`,
    tooltip: 'Total accumulated profit across all games'
  },
  { 
    id: 'averageMarketShare', 
    label: 'Avg. Market Share', 
    numeric: true,
    format: (value: number) => `${(value * 100).toFixed(1)}%`,
    tooltip: 'Average market share across all rounds played'
  },
  { 
    id: 'consistencyScore', 
    label: 'Consistency', 
    numeric: true,
    format: (value: number) => `${(value * 100).toFixed(1)}%`,
    tooltip: 'How consistently the player performs relative to others (higher is better)'
  },
  { 
    id: 'gamesPlayed', 
    label: 'Games Played', 
    numeric: true 
  },
  { 
    id: 'roundsPlayed', 
    label: 'Rounds Played', 
    numeric: true 
  },
  { 
    id: 'bestSingleRoundProfit', 
    label: 'Best Round', 
    numeric: true,
    format: (value: number) => `$${value.toFixed(2)}`
  },
];

const GlobalLeaderboard: React.FC = () => {
  const { sessions } = useSession();
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderBy, setOrderBy] = useState<SortableKey>('leaderboardPoints');
  const [order, setOrder] = useState<Order>('desc');

  useEffect(() => {
    const fetchAndAggregateData = async () => {
      const storage = StorageFactory.getInstance(StorageType.Session);
      const aggregator: Record<string, PlayerAggregator> = {};

      // Process each completed session
      for (const session of sessions.filter(s => s.status === 'completed')) {
        try {
          storage.setCurrentSession(session.id);
          const gameState = await storage.getGameState();
          if (!gameState) continue;

          const roundHistory = gameState.roundHistory || [];
          let gameWinner = '';
          let maxGameProfit = -Infinity;

          // Calculate total profits for the game to determine winner
          const gameProfits: Record<string, number> = {};
          roundHistory.forEach(round => {
            Object.entries(round.profits).forEach(([player, profit]) => {
              gameProfits[player] = (gameProfits[player] || 0) + profit;
              if (gameProfits[player] > maxGameProfit) {
                maxGameProfit = gameProfits[player];
                gameWinner = player;
              }
            });
          });

          roundHistory.forEach((roundObj: RoundResult, roundIndex: number) => {
            const { profits = {}, marketShares = {} } = roundObj;
            
            // Find round winner
            let roundWinner = '';
            let maxRoundProfit = -Infinity;
            Object.entries(profits).forEach(([player, profit]) => {
              if (profit > maxRoundProfit) {
                maxRoundProfit = profit;
                roundWinner = player;
              }
            });

            // Calculate percentile ranks for this round
            const profitValues = Object.values(profits);
            profitValues.sort((a, b) => b - a);
            const totalPlayers = profitValues.length;
            
            Object.entries(profits).forEach(([player, profit]) => {
              const share = marketShares[player] ?? 0;
              
              // Initialize aggregator if needed
              if (!aggregator[player]) {
                aggregator[player] = {
                  totalProfit: 0,
                  totalShare: 0,
                  roundsPlayed: 0,
                  roundsWon: 0,
                  gamesPlayed: new Set(),
                  gamesWon: new Set(),
                  bestSingleRoundProfit: Number.MIN_SAFE_INTEGER,
                  consistencyScore: 0,
                };
              }

              // Update aggregator
              const playerStats = aggregator[player];
              playerStats.totalProfit += profit;
              playerStats.totalShare += share;
              playerStats.roundsPlayed += 1;
              playerStats.gamesPlayed.add(session.id);
              
              // Update round wins
              if (player === roundWinner) {
                playerStats.roundsWon += 1;
              }

              // Update game wins
              if (player === gameWinner) {
                playerStats.gamesWon.add(session.id);
              }

              // Track best single round
              if (profit > playerStats.bestSingleRoundProfit) {
                playerStats.bestSingleRoundProfit = profit;
                playerStats.bestGameRound = {
                  gameId: session.id,
                  round: roundObj.round,
                };
              }

              // Update consistency score (percentile rank for this round)
              const rank = profitValues.indexOf(profit) + 1;
              const percentileRank = 1 - ((rank - 1) / totalPlayers);
              playerStats.consistencyScore = 
                (playerStats.consistencyScore * (playerStats.roundsPlayed - 1) + percentileRank) / 
                playerStats.roundsPlayed;
            });
          });
        } catch (error) {
          console.error(`Error processing session ${session.id}:`, error);
          continue;
        }
      }

      // Find maximum total profit for point scaling
      const maxProfit = Math.max(...Object.values(aggregator).map(stats => stats.totalProfit));

      // Convert aggregator to final array
      const finalLeaderboard: LeaderboardEntry[] = Object.entries(aggregator).map(([player, stats]) => ({
        username: player,
        totalProfit: stats.totalProfit,
        averageMarketShare: stats.roundsPlayed > 0 ? stats.totalShare / stats.roundsPlayed : 0,
        roundsPlayed: stats.roundsPlayed,
        roundsWon: stats.roundsWon,
        gamesPlayed: stats.gamesPlayed.size,
        gamesWon: stats.gamesWon.size,
        bestSingleRoundProfit: stats.bestSingleRoundProfit,
        bestGame: stats.bestGameRound?.gameId,
        bestRound: stats.bestGameRound?.round,
        consistencyScore: stats.consistencyScore,
        leaderboardPoints: calculateLeaderboardPoints(
          stats.gamesWon.size,
          stats.roundsWon,
          stats.totalProfit,
          maxProfit,
          stats.consistencyScore,
          stats.gamesPlayed.size,
          stats.roundsPlayed
        ),
      }));

      // Sort by leaderboard points descending
      finalLeaderboard.sort((a, b) => b.leaderboardPoints - a.leaderboardPoints);
      setData(finalLeaderboard);
      setLoading(false);
    };

    fetchAndAggregateData();
  }, [sessions]);

  const handleRequestSort = (property: SortableKey) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortData = (data: LeaderboardEntry[]): (LeaderboardEntry & { rank: number; isTopThree: boolean })[] => {
    // First, sort the data by the selected column
    const sortedData = [...data].sort((a, b) => {
      if (orderBy === 'rank') {
        // When sorting by rank, use leaderboardPoints as the default metric
        return order === 'asc' 
          ? a.leaderboardPoints - b.leaderboardPoints 
          : b.leaderboardPoints - a.leaderboardPoints;
      }

      const aValue = a[orderBy];
      const bValue = b[orderBy];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return order === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return order === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    // Update ranks based on current sort
    return sortedData.map((entry, index) => {
      const currentRank = index + 1;
      const isTopThree = orderBy === 'leaderboardPoints' || orderBy === 'rank' ? currentRank <= 3 : false;
      
      return {
        ...entry,
        rank: currentRank, // Always update rank based on current sort
        isTopThree
      };
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
        Global Leaderboard
      </Typography>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {headCells.map((headCell) => (
                <TableCell
                  key={headCell.id}
                  align={headCell.numeric ? 'right' : 'left'}
                  sortDirection={orderBy === headCell.id ? order : false}
                  sx={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleRequestSort(headCell.id)}
                >
                  <Tooltip title={headCell.tooltip || ''} placement="top">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: headCell.numeric ? 'flex-end' : 'flex-start' }}>
                      {headCell.label}
                      {orderBy === headCell.id ? (
                        <Box component="span" sx={{ ml: 1 }}>
                          {order === 'desc' ? '↓' : '↑'}
                        </Box>
                      ) : null}
                    </Box>
                  </Tooltip>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortData(data).map((entry) => (
              <TableRow 
                key={entry.username}
                sx={entry.isTopThree ? {
                  backgroundColor: entry.rank === 1 ? 'rgba(255, 215, 0, 0.1)' :
                                 entry.rank === 2 ? 'rgba(192, 192, 192, 0.1)' :
                                 'rgba(205, 127, 50, 0.1)'
                } : {}}
              >
                <TableCell align="right">
                  <Tooltip title={
                    orderBy === 'rank' || orderBy === 'leaderboardPoints' 
                      ? 'Overall Rank' 
                      : `Rank by ${headCells.find(cell => cell.id === orderBy)?.label || ''}`
                  }>
                    <Chip
                      label={entry.rank}
                      size="small"
                      color={entry.isTopThree ? (
                        entry.rank === 1 ? 'warning' :
                        entry.rank === 2 ? 'default' :
                        'error'
                      ) : 'default'}
                      sx={{
                        backgroundColor: entry.isTopThree ? (
                          entry.rank === 1 ? '#FFD700' :
                          entry.rank === 2 ? '#C0C0C0' :
                          '#CD7F32'
                        ) : undefined,
                        color: entry.isTopThree ? '#000' : undefined,
                        fontWeight: entry.isTopThree ? 'bold' : undefined
                      }}
                    />
                  </Tooltip>
                </TableCell>
                {headCells.slice(1).map((headCell) => (
                  <TableCell
                    key={headCell.id}
                    align={headCell.numeric ? 'right' : 'left'}
                    sx={headCell.id === 'totalProfit' ? {
                      color: entry[headCell.id] >= 0 ? 'success.main' : 'error.main',
                      fontWeight: 500
                    } : undefined}
                  >
                    {headCell.format && typeof entry[headCell.id] === 'number'
                      ? headCell.format(entry[headCell.id] as number)
                      : entry[headCell.id]}
                    {headCell.id === 'bestSingleRoundProfit' && entry.bestGame && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        Game: {entry.bestGame} (Round {entry.bestRound})
                      </Typography>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 4, px: 2 }}>
        <Typography variant="h6" gutterBottom>
          How Points are Calculated
        </Typography>
        
        <Typography variant="body1" paragraph>
          The leaderboard uses a comprehensive scoring system that rewards both performance and participation:
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
          Base Points:
        </Typography>
        <Typography variant="body2" paragraph>
          • Game Victory: {SCORING_WEIGHTS.GAME_WIN} points (awarded for highest total profit in a game)<br />
          • Round Victory: {SCORING_WEIGHTS.ROUND_WIN} points (awarded for highest profit in a single round)
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
          Participation Points:
        </Typography>
        <Typography variant="body2" paragraph>
          • Per Game: {SCORING_WEIGHTS.GAME_PLAYED} points<br />
          • Per Round: {SCORING_WEIGHTS.ROUND_PLAYED} points
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
          Performance Points:
        </Typography>
        <Typography variant="body2" paragraph>
          • Profit Points: Up to {SCORING_WEIGHTS.PROFIT_SCALE} points (scaled based on total profit)<br />
          • Consistency Points: Up to {SCORING_WEIGHTS.CONSISTENCY_SCALE} points (based on average performance rank)
        </Typography>

        <Alert severity="info" sx={{ mt: 3 }}>
          <AlertTitle>Important Note</AlertTitle>
          Both profit and consistency points are scaled based on participation. 
          Players need at least {SCORING_WEIGHTS.MIN_GAMES_FOR_FULL_PROFIT} games and {SCORING_WEIGHTS.MIN_ROUNDS_FOR_FULL_PROFIT} rounds 
          to receive full points in these categories. This encourages sustained participation and rewards consistent performance over time.
        </Alert>
      </Box>
    </Paper>
  );
};

export default GlobalLeaderboard;
