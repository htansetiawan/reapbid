import React, { createContext, useContext, useState, useEffect } from 'react';
import { StorageFactory, StorageType } from '../storage/StorageFactory';

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
}

interface GameConfig {
  totalRounds: number;
  roundTimeLimit: number;
  minBid: number;
  maxBid: number;
  costPerUnit: number;
  maxPlayers: number;
  alpha?: number; // Price sensitivity parameter for logit model
  marketSize?: number; // Total market size Q
}

interface GameContextType {
  gameState: GameState;
  startGame: (config: GameConfig) => void;
  startRound: () => void;
  endCurrentRound: () => void;
  endGame: () => void;
  submitBid: (playerName: string, bid: number) => void;
  unregisterPlayer: (playerName: string) => void;
  timeoutPlayer: (playerName: string) => void;
  unTimeoutPlayer: (playerName: string) => void;
  registerPlayer: (playerName: string) => void;
  resetGame: () => void;
  extendRoundTime: (additionalSeconds: number) => void;
  updateRivalries: (rivalries: Record<string, string[]>) => void;
}

const initialGameState: GameState = {
  hasGameStarted: false,
  isActive: false,
  isEnded: false,
  currentRound: 1,
  totalRounds: 5,
  roundTimeLimit: 60,
  roundStartTime: null,
  minBid: 0,
  maxBid: 100,
  costPerUnit: 50,
  maxPlayers: 200,
  players: {},
  roundBids: {},
  roundHistory: [],
  rivalries: {}
};

const DEFAULT_ALPHA = 0.1; // Default price sensitivity
const DEFAULT_MARKET_SIZE = 1000; // Default market size

const calculateMarketShare = (playerBid: number, allBids: number[], alpha: number = DEFAULT_ALPHA): number => {
  // Calculate e^(-α * p_i) for the current player
  const playerExp = Math.exp(-alpha * playerBid);
  
  // Calculate sum of e^(-α * p_j) for all players
  const totalExp = allBids.reduce((sum, bid) => sum + Math.exp(-alpha * bid), 0);
  
  // Return the market share using the logit formula
  return playerExp / totalExp;
};

const calculateProfit = (
  bid: number, 
  marketShare: number, 
  costPerUnit: number, 
  marketSize: number = DEFAULT_MARKET_SIZE
): number => {
  // Calculate quantity sold using market share and total market size
  const quantitySold = marketSize * marketShare;
  
  // Calculate profit as quantity * (price - cost)
  return quantitySold * (bid - costPerUnit);
};

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const storage = StorageFactory.getStorage(StorageType.Firebase);

  useEffect(() => {
    // Initialize game state from storage
    const initializeGameState = async () => {
      const storedState = await storage.getGameState();
      if (storedState) {
        setGameState(storedState);
      }
    };

    // Subscribe to game state changes
    const unsubscribe = storage.subscribeToGameState((newState) => {
      setGameState(newState);
    });

    initializeGameState();

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
      storage.cleanup();
    };
  }, []);

  const startGame = async (config: GameConfig) => {
    const newState: GameState = {
      ...initialGameState,
      ...config,
      hasGameStarted: true,
      isActive: false,
      currentRound: 1,
    };
    await storage.updateGameState(newState);
  };

  const startRound = async () => {
    const newState = {
      ...gameState,
      isActive: true,
      roundStartTime: Date.now(),
      roundBids: {},
      players: Object.fromEntries(
        Object.entries(gameState.players).map(([name, player]) => [
          name,
          { ...player, hasSubmittedBid: false, currentBid: null }
        ])
      )
    };
    await storage.updateGameState(newState);
  };

  const endCurrentRound = async () => {
    // Get all players and their rivals with safe accessors
    const allPlayers = Object.keys(gameState?.players || {});
    const marketShares: Record<string, number> = {};
    const profits: Record<string, number> = {};
    const roundBids: Record<string, number> = {};

    // Initialize all players with 0 bids and market shares
    allPlayers.forEach(player => {
      roundBids[player] = 0;
      marketShares[player] = 0;
      profits[player] = 0;
    });

    // Update bids for players who submitted them
    Object.entries(gameState?.roundBids || {}).forEach(([player, bid]) => {
      roundBids[player] = bid;
    });

    // First pass: Calculate market shares for each player and their rivals
    allPlayers.forEach(player => {
      const rivals = gameState?.rivalries?.[player] || [];
      if (rivals.length === 0) return;

      const playerBid = roundBids[player];
      const rivalBids = rivals.map(rival => roundBids[rival]);
      
      if (playerBid === 0) {
        marketShares[player] = 0;
      } else {
        const allBids = [playerBid, ...rivalBids];
        marketShares[player] = calculateMarketShare(playerBid, allBids);
      }
    });

    // Second pass: Calculate profits based on market shares
    allPlayers.forEach(player => {
      if (marketShares[player] > 0) {
        profits[player] = calculateProfit(
          roundBids[player],
          marketShares[player],
          gameState?.costPerUnit ?? 0
        );
      }
    });

    // Create round result
    const roundResult: RoundResult = {
      round: gameState?.currentRound ?? 1,
      bids: roundBids,
      marketShares,
      profits,
      timestamp: Date.now()
    };

    // Update game state
    const newState = {
      ...gameState,
      isActive: false,
      roundStartTime: null,
      currentRound: (gameState?.currentRound ?? 1) + 1,
      roundHistory: [...(gameState?.roundHistory || []), roundResult]
    };

    await storage.updateGameState(newState);
  };

  const endGame = async () => {
    const newState = {
      ...gameState,
      isActive: false,
      isEnded: true
    };
    await storage.updateGameState(newState);
  };

  const registerPlayer = async (playerName: string) => {
    const playerData: Player = {
      name: playerName,
      currentBid: null,
      hasSubmittedBid: false,
      lastBidTime: null,
    };
    await storage.addPlayer(playerName, playerData);
  };

  const unregisterPlayer = async (playerName: string) => {
    await storage.removePlayer(playerName);
  };

  const timeoutPlayer = async (playerName: string) => {
    await storage.timeoutPlayer(playerName);
  };

  const unTimeoutPlayer = async (playerName: string) => {
    await storage.unTimeoutPlayer(playerName);
  };

  const submitBid = async (playerName: string, bid: number) => {
    await storage.submitBid(playerName, bid);
  };

  const resetGame = async () => {
    await storage.resetGame();
  };

  const extendRoundTime = async (additionalSeconds: number) => {
    await storage.extendRoundTime(additionalSeconds);
  };

  const updateRivalries = async (rivalries: Record<string, string[]>) => {
    await storage.updateRivalries(rivalries);
  };

  return (
    <GameContext.Provider value={{
      gameState,
      startGame,
      startRound,
      endCurrentRound,
      endGame,
      submitBid,
      registerPlayer,
      unregisterPlayer,
      timeoutPlayer,
      unTimeoutPlayer,
      resetGame,
      extendRoundTime,
      updateRivalries
    }}>
      {children}
    </GameContext.Provider>
  );
};

export default GameProvider;
