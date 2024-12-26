import { AutopilotState } from "./autopilot";

export interface Player {
  name: string;
  currentBid: number | null;
  hasSubmittedBid: boolean;
  lastBidTime: number | null;
  isTimedOut?: boolean;
}

export interface RoundResult {
  round: number;
  bids: Record<string, number>;
  marketShares: Record<string, number>;
  profits: Record<string, number>;
  timestamp: number;
}

export interface GameState {
  hasGameStarted: boolean;
  isActive: boolean;
  isEnded: boolean;
  currentRound: number;
  totalRounds: number;
  roundTimeLimit: number;
  roundStartTime: number | null;
  minBid: number;
  maxBid: number;
  costPerUnit: number;
  maxPlayers: number;
  players: Record<string, Player>;
  roundBids: Record<string, number>;
  roundHistory: RoundResult[];
  rivalries: Record<string, string[]>;
  totalProfit: number;
  averageMarketShare: number;
  bestRound: number;
  bestRoundProfit: number;
  visibilitySettings?: VisibilitySettings;
  autopilot?: AutopilotState;
  alpha?: number;
  marketSize?: number;
}

export interface VisibilitySettings {
  showRounds: boolean;
  showCostPerUnit: boolean;
  showPriceRange: boolean;
}

export interface DatabaseGame {
  gameState: GameState;
}
