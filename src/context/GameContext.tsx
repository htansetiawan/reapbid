import React, { createContext, useContext, useState, useEffect } from 'react';
import { StorageFactory, StorageType } from '../storage/StorageFactory';
import { useSession } from './SessionContext';

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
  bid: number;  // Individual player's bid for the round
  profit: number;  // Individual player's profit for the round
  marketShare: number;  // Individual player's market share for the round
  rivals: Array<{
    name: string;
    bid: number;
    profit: number;
    marketShare: number;
  }>;
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
  totalProfit: number;  // Total profit across all rounds
  averageMarketShare: number;  // Average market share across all rounds
  bestRound: number;  // Round number with highest profit
  bestRoundProfit: number;  // Profit from the best round
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
  autoAssignRivals: () => void;
}

const initialGameState: GameState = {
  hasGameStarted: false,
  isActive: false,
  isEnded: false,
  currentRound: 1,
  totalRounds: 3,
  roundTimeLimit: 60,
  roundStartTime: null,
  minBid: 0,
  maxBid: 100,
  costPerUnit: 50,
  maxPlayers: 4,
  players: {},
  roundBids: {},
  roundHistory: [],
  rivalries: {},
  totalProfit: 0,
  averageMarketShare: 0,
  bestRound: 0,
  bestRoundProfit: 0
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

const assignRoundRobin = (players: string[]): Record<string, string[]> => {
  const rivalries: Record<string, string[]> = {};
  
  // Initialize all players with empty arrays
  players.forEach(player => {
    rivalries[player] = [];
  });

  if (players.length < 2) return rivalries;

  // Create round-robin pairings
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const player1 = players[i];
      const player2 = players[j];
      rivalries[player1].push(player2);
      rivalries[player2].push(player1);
    }
  }

  // If odd number of players, ensure each player has at least one rival
  if (players.length % 2 === 1) {
    const playersWithoutRivals = players.filter(player => rivalries[player].length === 0);
    playersWithoutRivals.forEach(player => {
      const randomRival = players.find(p => p !== player && rivalries[p].length < 2);
      if (randomRival) {
        rivalries[player].push(randomRival);
        rivalries[randomRival].push(player);
      }
    });
  }

  return rivalries;
};

const defaultContextValue: GameContextType = {
  gameState: initialGameState,
  startGame: () => {},
  startRound: () => {},
  endCurrentRound: () => {},
  endGame: () => {},
  submitBid: () => {},
  unregisterPlayer: () => {},
  timeoutPlayer: () => {},
  unTimeoutPlayer: () => {},
  registerPlayer: () => {},
  resetGame: () => {},
  extendRoundTime: () => {},
  updateRivalries: () => {},
  autoAssignRivals: () => {}
};

const GameContext = createContext<GameContextType>(defaultContextValue);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [isUpdating, setIsUpdating] = useState(false);
  const { currentSessionId } = useSession();
  const storage = StorageFactory.getInstance(currentSessionId ? StorageType.Session : StorageType.Firebase);

  useEffect(() => {
    if (isUpdating) {
      console.log('Game state is already updating, skipping subscription setup');
      return;
    }

    console.log('Current session ID changed:', currentSessionId);
    
    if (!currentSessionId) {
      console.log('No session selected, using current');
      storage.setCurrentSession('current');
    } else {
      console.log('Setting current session:', currentSessionId);
      storage.setCurrentSession(currentSessionId);
    }

    // Initialize game state from storage
    const initializeGameState = async () => {
      try {
        setIsUpdating(true);
        console.log('Initializing game state...');
        const storedState = await storage.getGameState();
        console.log('Stored state:', storedState);
        
        if (storedState) {
          // Ensure we preserve all fields and their proper types
          const normalizedState = {
            ...initialGameState,  // Start with default values
            ...storedState,       // Override with stored values
            // Ensure critical fields are properly typed
            hasGameStarted: Boolean(storedState.hasGameStarted),
            isActive: Boolean(storedState.isActive),
            isEnded: Boolean(storedState.isEnded),
            players: storedState.players || {},
            roundBids: storedState.roundBids || {},
            roundHistory: storedState.roundHistory || [],
            rivalries: storedState.rivalries || {}
          };
          console.log('Setting normalized state:', normalizedState);
          setGameState(normalizedState);
        } else {
          console.log('No stored state found, using initial state');
          setGameState(initialGameState);
        }
      } catch (error) {
        console.error('Error initializing game state:', error);
      } finally {
        setIsUpdating(false);
      }
    };

    initializeGameState();

    // Subscribe to game state changes
    console.log('Setting up game state subscription');
    const unsubscribe = storage.subscribeToGameState((newState: GameState) => {
      if (isUpdating) {
        console.log('Already updating game state, skipping subscription update');
        return;
      }

      console.log('Received new game state:', newState);
      if (newState) {
        setIsUpdating(true);
        // Apply the same normalization to subscription updates
        const normalizedState = {
          ...initialGameState,
          ...newState,
          hasGameStarted: Boolean(newState.hasGameStarted),
          isActive: Boolean(newState.isActive),
          isEnded: Boolean(newState.isEnded),
          players: newState.players || {},
          roundBids: newState.roundBids || {},
          roundHistory: newState.roundHistory || [],
          rivalries: newState.rivalries || {}
        };
        console.log('Setting normalized subscription state:', normalizedState);
        setGameState(normalizedState);
        setIsUpdating(false);
      }
    });

    return () => {
      console.log('Cleaning up game state subscription');
      unsubscribe();
      setIsUpdating(false);
    };
  }, [currentSessionId, isUpdating]); // Re-run effect when session changes

  const startGame = async (config: GameConfig) => {
    const newState: GameState = {
      hasGameStarted: true,
      isActive: true,
      isEnded: false,
      currentRound: 1,
      totalRounds: config.totalRounds,
      roundTimeLimit: config.roundTimeLimit,
      roundStartTime: null,
      minBid: config.minBid,
      maxBid: config.maxBid,
      costPerUnit: config.costPerUnit,
      maxPlayers: config.maxPlayers,
      players: {},
      roundBids: {},
      roundHistory: [],
      rivalries: {},
      totalProfit: 0,
      averageMarketShare: 0,
      bestRound: 0,
      bestRoundProfit: 0
    };
    await storage.updateGameState(newState);
  };

  const startRound = async () => {
    if (!gameState) return;

    // Auto-assign rivals if it's the first round and rivals haven't been assigned
    if (gameState.hasGameStarted && gameState.currentRound === 1 && !gameState.isActive) {
      const players = gameState.players ?? {};
      const allPlayers = Object.keys(players);
      const hasRivalries = Object.values(gameState.rivalries ?? {}).some(rivals => rivals?.length > 0);

      if (!hasRivalries && allPlayers.length >= 2) {
        console.log('Auto-assigning rivals at start of round 1');
        const newRivalries = assignRoundRobin(allPlayers);
        await storage.updateGameState({
          ...gameState,
          rivalries: newRivalries
        });
      }
    }

    // Reset all player states for the new round
    const updatedPlayers = Object.fromEntries(
      Object.entries(gameState.players ?? {}).map(([name, player]) => [
        name,
        { ...player, hasSubmittedBid: false, currentBid: null, isTimedOut: false }
      ])
    );

    // Update game state for the new round
    const updatedState = {
      ...gameState,  // Preserve all existing fields
      hasGameStarted: true,
      isActive: true,
      isEnded: false,
      roundStartTime: Date.now(),
      roundBids: {},
      players: updatedPlayers,
      totalProfit: gameState.totalProfit || 0,
      averageMarketShare: gameState.averageMarketShare || 0,
      bestRound: gameState.bestRound || 0,
      bestRoundProfit: gameState.bestRoundProfit || 0,
      rivalries: gameState.rivalries || {},
      roundHistory: gameState.roundHistory || []
    };

    try {
      console.log('Starting round with state:', updatedState);
      await storage.updateGameState(updatedState);
      console.log('Round started successfully');
    } catch (error) {
      console.error('Error starting round:', error);
      throw error;
    }
  };

  const endCurrentRound = async () => {
    if (!gameState) return;

    console.log('Ending current round with game state:', gameState);

    // Get all players and their rivals with safe accessors
    const allPlayers = Object.keys(gameState.players || {});
    const marketShares: Record<string, number> = {};
    const profits: Record<string, number> = {};
    const roundBids: Record<string, number> = {};

    // Initialize all players with 0 bids and market shares
    allPlayers.forEach(player => {
      roundBids[player] = gameState.roundBids?.[player] || 0;
      marketShares[player] = 0;
      profits[player] = 0;
    });

    console.log('Round bids:', roundBids);

    // Calculate market shares for each player and their rivals
    allPlayers.forEach(player => {
      const rivals = gameState.rivalries?.[player] || [];
      console.log(`Calculating market share for player ${player} with rivals:`, rivals);

      if (rivals.length === 0) {
        console.log(`No rivals for player ${player}, skipping market share calculation`);
        return;
      }

      const playerBid = roundBids[player];
      const rivalBids = rivals.map(rival => roundBids[rival]);
      
      console.log('Player bid:', playerBid);
      console.log('Rival bids:', rivalBids);

      if (playerBid === 0) {
        console.log(`Player ${player} bid is 0, setting market share to 0`);
        marketShares[player] = 0;
      } else {
        const allBids = [playerBid, ...rivalBids].filter(bid => bid > 0);
        if (allBids.length > 0) {
          marketShares[player] = calculateMarketShare(playerBid, allBids);
          console.log(`Calculated market share for player ${player}:`, marketShares[player]);
        }
      }
    });

    console.log('Market shares after calculation:', marketShares);

    // Calculate profits based on market shares
    let totalRoundProfit = 0;
    allPlayers.forEach(player => {
      const playerMarketShare = marketShares[player];
      const playerBid = roundBids[player];
      
      console.log(`Calculating profit for player ${player}:`, {
        bid: playerBid,
        marketShare: playerMarketShare,
        costPerUnit: gameState.costPerUnit
      });

      if (playerMarketShare > 0 && playerBid > 0) {
        profits[player] = calculateProfit(
          playerBid,
          playerMarketShare,
          gameState.costPerUnit ?? 0
        );
        totalRoundProfit += profits[player];
        console.log(`Calculated profit for player ${player}:`, profits[player]);
      }
    });

    console.log('Final profits:', profits);
    console.log('Total round profit:', totalRoundProfit);

    // Create round result with rivals information
    const roundResult: RoundResult = {
      round: gameState.currentRound,
      bids: roundBids,
      marketShares,
      profits,
      timestamp: Date.now(),
      bid: 0,
      profit: 0,
      marketShare: 0,
      rivals: allPlayers.map(player => {
        const playerRivals = gameState.rivalries?.[player] || [];
        return {
          name: player,
          bid: roundBids[player],
          profit: profits[player],
          marketShare: marketShares[player]
        };
      })
    };

    // Calculate total profit and average market share
    const newTotalProfit = (gameState.totalProfit || 0) + totalRoundProfit;
    const newAverageMarketShare = Object.values(marketShares).reduce((acc, share) => acc + share, 0) / allPlayers.length;

    // Check if this is the best round
    const isBestRound = totalRoundProfit > (gameState.bestRoundProfit || 0);

    // Update game state
    const newState = {
      ...gameState,
      roundStartTime: null,
      currentRound: gameState.currentRound + 1,
      roundHistory: [...(gameState.roundHistory || []), roundResult],
      totalProfit: newTotalProfit,
      averageMarketShare: newAverageMarketShare,
      bestRound: isBestRound ? gameState.currentRound : (gameState.bestRound || 0),
      bestRoundProfit: isBestRound ? totalRoundProfit : (gameState.bestRoundProfit || 0)
    };

    console.log('Updating game state with new state:', newState);
    await storage.updateGameState(newState);
  };

  const endGame = async () => {
    setIsUpdating(true);
    try {
      const newState = {
        ...gameState,
        isActive: false,
        isEnded: true
      };
      await storage.updateGameState(newState);
      
      // Automatically update session status to completed when game ends
      if (currentSessionId) {
        try {
          await storage.updateSessionStatus(currentSessionId, 'completed');
        } catch (error) {
          console.error('Error updating session status:', error);
        }
      }
    } catch (error) {
      console.error('Error ending game:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const registerPlayer = async (playerName: string) => {
    if (!gameState) {
      throw new Error('Game state not initialized');
    }

    console.log('Registering player:', playerName);
    console.log('Current game state:', gameState);

    // Check if player already exists
    if (gameState.players?.[playerName]) {
      console.log('Player already registered:', playerName);
      return;
    }

    // Create new player data
    const playerData: Player = {
      name: playerName,
      currentBid: null,
      hasSubmittedBid: false,
      lastBidTime: null,
    };

    try {
      console.log('Adding player to storage:', playerData);
      await storage.addPlayer(playerName, playerData);
      console.log('Player registered successfully');
    } catch (error) {
      console.error('Error registering player:', error);
      throw error;
    }
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

  const autoAssignRivals = async () => {
    if (gameState.isActive || gameState.currentRound !== 1) {
      console.warn('Rivals can only be assigned in round 1 when the round is not active');
      return;
    }

    const allPlayers = Object.keys(gameState.players);
    if (allPlayers.length < 2) {
      console.warn('Need at least 2 players to assign rivals');
      return;
    }

    const newRivalries = assignRoundRobin(allPlayers);
    await storage.updateGameState({
      ...gameState,
      rivalries: newRivalries
    });
  };

  return (
    <GameContext.Provider value={{
      gameState,
      startGame,
      startRound,
      endCurrentRound,
      endGame,
      submitBid,
      unregisterPlayer,
      timeoutPlayer,
      unTimeoutPlayer,
      registerPlayer,
      resetGame,
      extendRoundTime,
      updateRivalries,
      autoAssignRivals
    }}>
      {children}
    </GameContext.Provider>
  );
};

export default GameProvider;
