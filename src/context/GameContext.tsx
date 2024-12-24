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

const calculateMarketShare = (
  playerBid: number, 
  rivalBids: number[], 
  alpha: number = DEFAULT_ALPHA
): number => {
  // If player bid is 0, they get 0% market share
  if (playerBid === 0) {
    console.log('Player bid $0, market share = 0%');
    return 0;
  }
  
  // If no rivals or all rivals bid 0, player gets 100%
  if (rivalBids.length === 0 || rivalBids.every(bid => bid === 0)) {
    console.log('No active rivals, market share = 100%');
    return 1;
  }
  
  // Calculate shares using only non-zero bids
  const playerExp = Math.exp(-alpha * playerBid);
  const totalExp = rivalBids.reduce(
    (sum, bid) => sum + (bid === 0 ? 0 : Math.exp(-alpha * bid)), 
    playerExp
  );
  
  const share = playerExp / totalExp;
  console.log(`Market share calculation:
    Player bid: $${playerBid}
    Rival bids: ${JSON.stringify(rivalBids)}
    Player exp: ${playerExp}
    Total exp: ${totalExp}
    Share: ${(share * 100).toFixed(1)}%`);
  
  return share;
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
  const profit = quantitySold * (bid - costPerUnit);
  console.log(`Profit calculation:
    Bid: $${bid}
    Market share: ${(marketShare * 100).toFixed(1)}%
    Quantity: ${quantitySold}
    Profit: $${profit.toFixed(2)}`);
  
  return profit;
};

const calculateMaxRivalProfit = (
  rivals: string[],
  roundBids: Record<string, number>,
  marketShares: Record<string, number>,
  costPerUnit: number,
  marketSize: number = DEFAULT_MARKET_SIZE
): number => {
  let maxProfit = 0;
  
  for (const rival of rivals) {
    const rivalBid = roundBids[rival] || 0;
    const rivalShare = marketShares[rival] || 0;
    
    // Only consider rivals who participated (non-zero bid)
    if (rivalBid > 0) {
      const profit = calculateProfit(rivalBid, rivalShare, costPerUnit, marketSize);
      maxProfit = Math.max(maxProfit, profit);
    }
  }
  
  return maxProfit;
};

const calculateOpportunityCost = (
  rivals: string[],
  roundBids: Record<string, number>,
  marketShares: Record<string, number>,
  costPerUnit: number,
  marketSize: number = DEFAULT_MARKET_SIZE
): number => {
  // Find the maximum profit among rivals
  let maxRivalProfit = 0;
  
  for (const rival of rivals) {
    const rivalBid = roundBids[rival] || 0;
    const rivalShare = marketShares[rival] || 0;
    const rivalProfit = calculateProfit(rivalBid, rivalShare, costPerUnit, marketSize);
    maxRivalProfit = Math.max(maxRivalProfit, rivalProfit);
  }
  
  return maxRivalProfit;
};

const assignRoundRobin = (players: string[]): Record<string, string[]> => {
  const rivalries: Record<string, string[]> = {};
  
  // Initialize all players with empty arrays
  players.forEach(player => {
    rivalries[player] = [];
  });

  if (players.length < 2) return rivalries;

  // 1. Shuffle the players array
  const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
  console.log('Shuffled players:', shuffledPlayers);

  // 2. Match first with last, second with second last, etc.
  const midPoint = Math.floor(shuffledPlayers.length / 2);
  for (let i = 0; i < midPoint; i++) {
    const player1 = shuffledPlayers[i];
    const player2 = shuffledPlayers[shuffledPlayers.length - 1 - i];
    
    rivalries[player1].push(player2);
    rivalries[player2].push(player1);
    console.log(`Matched ${player1} with ${player2}`);
  }

  // 3. If odd number of players, match the middle player with the first pair
  if (shuffledPlayers.length % 2 === 1) {
    const middlePlayer = shuffledPlayers[midPoint];
    const firstPlayer = shuffledPlayers[0];
    const lastPlayer = shuffledPlayers[shuffledPlayers.length - 1];
    
    rivalries[middlePlayer].push(firstPlayer, lastPlayer);
    rivalries[firstPlayer].push(middlePlayer);
    rivalries[lastPlayer].push(middlePlayer);
    console.log(`Matched middle player ${middlePlayer} with first pair ${firstPlayer}-${lastPlayer}`);
  }

  console.log('Final rivalries:', rivalries);
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

    // Auto-assign rivals if it's the first round
    if (gameState.currentRound === 1) {
      const players = gameState.players ?? {};
      const allPlayers = Object.keys(players);
      const hasRivalries = gameState.rivalries && Object.keys(gameState.rivalries).length > 0;

      if (!hasRivalries && allPlayers.length >= 2) {
        console.log('Auto-assigning rivals at start of round 1');
        const newRivalries = assignRoundRobin(allPlayers);
        console.log('New rivalries:', newRivalries);
        
        const updatedState = {
          ...gameState,
          rivalries: newRivalries
        };
        await storage.updateGameState(updatedState);
        console.log('Updated game state with rivalries:', updatedState);
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

    // First pass: Calculate market shares
    allPlayers.forEach(player => {
      const rivals = gameState.rivalries?.[player] || [];
      console.log(`\nCalculating market share for ${player}`);
      console.log('Rivals:', rivals);

      const playerBid = roundBids[player] || 0;
      const rivalBids = rivals.map(rival => roundBids[rival] || 0);
      
      if (playerBid === 0) {
        console.log(`Player ${player} bid $0, setting market share to 0%`);
        marketShares[player] = 0;
      } else if (rivals.every(rival => roundBids[rival] === 0)) {
        console.log(`Player ${player} is the only non-zero bidder, setting market share to 100%`);
        marketShares[player] = 1;
      } else {
        marketShares[player] = calculateMarketShare(playerBid, rivalBids);
      }
      
      console.log(`Final market share for ${player}: ${(marketShares[player] * 100).toFixed(1)}%`);
    });

    console.log('\nMarket shares after first pass:', marketShares);

    // Second pass: Calculate profits for non-zero bids
    allPlayers.forEach(player => {
      const playerBid = roundBids[player] || 0;
      if (playerBid > 0) {
        profits[player] = calculateProfit(
          playerBid,
          marketShares[player],
          gameState.costPerUnit
        );
        console.log(`Calculated profit for ${player} (bid: $${playerBid}): $${profits[player].toFixed(2)}`);
      }
    });

    // Third pass: Handle zero bids using maximum rival profit
    allPlayers.forEach(player => {
      const playerBid = roundBids[player] || 0;
      if (playerBid === 0) {
        const rivals = gameState.rivalries?.[player] || [];
        // Get all rival profits (they're already calculated)
        const rivalProfits = rivals.map(rival => {
          const profit = profits[rival] || 0;
          console.log(`Rival ${rival} profit: $${profit.toFixed(2)}`);
          return profit;
        });
        
        // Set profit to negative of the maximum rival profit
        const maxRivalProfit = Math.max(...rivalProfits);
        profits[player] = -maxRivalProfit;
        console.log(`Player ${player} bid $0. Setting profit to negative of max rival profit: -$${maxRivalProfit.toFixed(2)}`);
      }
    });

    console.log('\nFinal profits:', profits);

    // Calculate total profit (sum of all profits from all rounds for current player)
    const newTotalProfit = (gameState.totalProfit || 0) + profits[Object.keys(gameState.players)[0]] || 0;
    
    // Calculate average market share (average of all market shares from all rounds for current player)
    const currentPlayerHistory = [...(gameState.roundHistory || []), {
      round: gameState.currentRound,
      bids: roundBids,
      marketShares,
      profits,
      timestamp: Date.now()
    }];
    const totalMarketShare = currentPlayerHistory.reduce((sum, round) => {
      const playerName = Object.keys(gameState.players)[0];
      return sum + (round.marketShares[playerName] || 0);
    }, 0);
    const newAverageMarketShare = totalMarketShare / currentPlayerHistory.length;

    // Check if this is the best round
    const currentPlayerProfit = profits[Object.keys(gameState.players)[0]] || 0;
    const isBestRound = currentPlayerProfit > (gameState.bestRoundProfit || 0);

    // Update game state
    const newState = {
      ...gameState,
      roundStartTime: null,
      currentRound: gameState.currentRound + 1,
      roundHistory: [...(gameState.roundHistory || []), {
        round: gameState.currentRound,
        bids: roundBids,
        marketShares,
        profits,
        timestamp: Date.now()
      }],
      totalProfit: newTotalProfit,
      averageMarketShare: newAverageMarketShare,
      bestRound: isBestRound ? gameState.currentRound : (gameState.bestRound || 0),
      bestRoundProfit: isBestRound ? currentPlayerProfit : (gameState.bestRoundProfit || 0)
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
    if (!gameState) {
      console.warn('Game state not initialized');
      return;
    }

    // Allow rival assignment only before game starts or in round 1
    if (gameState.currentRound > 1) {
      console.warn('Rivals can only be assigned in round 1');
      return;
    }

    const allPlayers = Object.keys(gameState.players || {});
    if (allPlayers.length < 2) {
      console.warn('Need at least 2 players to assign rivals');
      return;
    }

    console.log('Auto-assigning rivals for players:', allPlayers);
    const newRivalries = assignRoundRobin(allPlayers);
    console.log('New rivalries assigned:', newRivalries);
    
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
