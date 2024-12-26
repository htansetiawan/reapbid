export interface PlayerAggregator {
  totalProfit: number;
  totalShare: number;
  roundsPlayed: number;
  roundsWon: number;
  gamesPlayed: Set<string>;
  gamesWon: Set<string>;
  bestSingleRoundProfit: number;
  bestGameRound?: {
    gameId: string;
    round: number;
  };
  consistencyScore: number; // Average percentile rank across all rounds
}

export interface LeaderboardEntry {
  username: string;
  totalProfit: number;
  averageMarketShare: number;
  roundsPlayed: number;
  roundsWon: number;
  gamesPlayed: number;
  gamesWon: number;
  bestSingleRoundProfit: number;
  bestGame?: string;
  bestRound?: number;
  consistencyScore: number;
  leaderboardPoints: number;
  rank?: number; // Added for sorting
}

// Constants for scoring system
export const SCORING_WEIGHTS = {
  GAME_WIN: 10,           // Points per game won
  ROUND_WIN: 2,           // Points per round won
  GAME_PLAYED: 5,         // Base points per game played
  ROUND_PLAYED: 0.5,      // Points per round played
  PROFIT_SCALE: 10,       // Max points from profit contribution
  CONSISTENCY_SCALE: 5,   // Max points from consistency score
  
  // Minimum thresholds for full profit scoring
  MIN_GAMES_FOR_FULL_PROFIT: 3,    // Need at least 3 games for full profit points
  MIN_ROUNDS_FOR_FULL_PROFIT: 15,   // Need at least 15 rounds for full profit points
} as const;

// Helper function to calculate leaderboard points
export const calculateLeaderboardPoints = (
  gamesWon: number,
  roundsWon: number,
  totalProfit: number,
  maxProfit: number,
  consistencyScore: number,
  gamesPlayed: number,
  roundsPlayed: number,
): number => {
  // Points from wins
  const gamePoints = gamesWon * SCORING_WEIGHTS.GAME_WIN;
  const roundPoints = roundsWon * SCORING_WEIGHTS.ROUND_WIN;
  
  // Points from participation
  const gamePlayedPoints = gamesPlayed * SCORING_WEIGHTS.GAME_PLAYED;
  const roundPlayedPoints = roundsPlayed * SCORING_WEIGHTS.ROUND_PLAYED;
  
  // Scale profit points based on games/rounds played
  const gameScaleFactor = Math.min(1, gamesPlayed / SCORING_WEIGHTS.MIN_GAMES_FOR_FULL_PROFIT);
  const roundScaleFactor = Math.min(1, roundsPlayed / SCORING_WEIGHTS.MIN_ROUNDS_FOR_FULL_PROFIT);
  const participationFactor = (gameScaleFactor + roundScaleFactor) / 2;
  
  // Calculate profit points with participation scaling
  const profitPoints = maxProfit > 0 
    ? (totalProfit / maxProfit) * SCORING_WEIGHTS.PROFIT_SCALE * participationFactor
    : 0;

  // Consistency points also scaled by participation
  const consistencyPoints = consistencyScore * SCORING_WEIGHTS.CONSISTENCY_SCALE * participationFactor;

  return (
    gamePoints + 
    roundPoints + 
    gamePlayedPoints + 
    roundPlayedPoints + 
    profitPoints + 
    consistencyPoints
  );
};
