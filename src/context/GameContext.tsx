import React, { createContext, useContext, useState, useEffect } from 'react';

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
  currentRound: 0,
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

const GAME_STATE_KEY = 'gameState';
const ROUND_HISTORY_KEY = 'roundHistory';
const PLAYERS_KEY = 'players';

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
  const [gameState, setGameState] = useState<GameState>(() => {
    const savedState = localStorage.getItem(GAME_STATE_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        console.log('Loaded game state from localStorage:', parsed);
        return parsed;
      } catch (e) {
        console.error('Error parsing saved game state:', e);
        return initialGameState;
      }
    }
    return initialGameState;
  });

  const [roundTimer, setRoundTimer] = useState<NodeJS.Timer | null>(null);

  // Effect to sync state with localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === GAME_STATE_KEY && e.newValue) {
        try {
          const newState = JSON.parse(e.newValue);
          console.log('Storage event received:', {
            roundHistory: newState.roundHistory?.length || 0,
            currentRound: newState.currentRound,
            isActive: newState.isActive
          });
          // Just use the new state directly, don't merge histories
          setGameState(newState);
        } catch (error) {
          console.error('Error parsing storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Save game state to localStorage whenever it changes
  useEffect(() => {
    try {
      console.log('Saving state to localStorage:', {
        roundHistory: gameState.roundHistory?.length || 0,
        currentRound: gameState.currentRound
      });
      localStorage.setItem(GAME_STATE_KEY, JSON.stringify(gameState));
    } catch (error) {
      console.error('Error saving state:', error);
    }
  }, [gameState]);

  // Effect to handle game state updates
  useEffect(() => {
    console.log('Game state updated:', {
      hasGameStarted: gameState.hasGameStarted,
      isActive: gameState.isActive,
      currentRound: gameState.currentRound,
      players: Object.keys(gameState.players),
      roundHistory: gameState.roundHistory.length
    });
  }, [gameState]);

  useEffect(() => {
    return () => {
      if (roundTimer) {
        clearInterval(roundTimer);
      }
    };
  }, [roundTimer]);

  const startGame = (config: GameConfig) => {
    console.log('Starting new game with config:', config);
    setGameState({
      ...initialGameState,
      ...config,
      hasGameStarted: true,
      isActive: false,
      currentRound: 0,
      roundHistory: [] // Ensure clean round history on new game
    });
  };

  const startRound = () => {
    setGameState(prevState => {
      // Check minimum player count
      const playerCount = Object.keys(prevState.players).length;
      if (playerCount < 2) {
        console.log('Cannot start round: insufficient players');
        return prevState;
      }

      // Don't start if game has ended or round is already active
      if (prevState.isEnded || prevState.isActive) {
        console.log('Cannot start round: game ended or round active');
        return prevState;
      }

      // Don't start if we've reached max rounds
      if (prevState.currentRound >= prevState.totalRounds) {
        console.log('Cannot start round: max rounds reached');
        return prevState;
      }

      // If this is the first round and no rivals are assigned, auto-assign them
      if (prevState.currentRound === 0 && Object.keys(prevState.rivalries).length === 0) {
        console.log('First round with no rivals - auto-assigning rivals');
        const playerNames = Object.keys(prevState.players);
        const rivalries: Record<string, string[]> = {};
        
        // Shuffle player names
        const shuffledPlayers = [...playerNames].sort(() => Math.random() - 0.5);
        
        // Assign rivals in pairs
        for (let i = 0; i < shuffledPlayers.length; i += 2) {
          const player1 = shuffledPlayers[i];
          const player2 = shuffledPlayers[i + 1];
          if (player1 && player2) {
            rivalries[player1] = [player2];
            rivalries[player2] = [player1];
          }
        }
        
        console.log('Auto-assigned rivalries:', rivalries);
        
        return {
          ...prevState,
          isActive: true,
          currentRound: prevState.currentRound + 1,
          roundStartTime: Date.now(),
          roundBids: {},
          rivalries
        };
      }

      // Normal round start without rival assignment
      return {
        ...prevState,
        isActive: true,
        currentRound: prevState.currentRound + 1,
        roundStartTime: Date.now(),
        roundBids: {},
        players: Object.fromEntries(
          Object.entries(prevState.players).map(([name, player]) => [
            name,
            { ...player, hasSubmittedBid: false, currentBid: null }
          ])
        )
      };
    });
  };

  const endCurrentRound = () => {
    setGameState(prevState => {
      // Get all players and their rivals
      const allPlayers = Object.keys(prevState.players);
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
      Object.entries(prevState.roundBids).forEach(([player, bid]) => {
        roundBids[player] = bid;
      });

      // First pass: Calculate market shares for each player and their rivals
      allPlayers.forEach(player => {
        const rivals = prevState.rivalries[player] || [];
        if (rivals.length === 0) return;

        const playerBid = roundBids[player];
        const rivalBids = rivals.map(rival => roundBids[rival]);
        
        if (playerBid === 0) {
          // Player didn't bid, gets 0% market share
          marketShares[player] = 0;
          // Rivals who bid split the market share proportionally
          const biddingRivals = rivals.filter(rival => roundBids[rival] > 0);
          if (biddingRivals.length > 0) {
            const totalRivalBids = biddingRivals.reduce((sum, rival) => sum + roundBids[rival], 0);
            biddingRivals.forEach(rival => {
              marketShares[rival] = roundBids[rival] / totalRivalBids;
            });
          }
        } else {
          // Player bid, calculate market share
          const allBids = [playerBid, ...rivalBids].filter(bid => bid > 0);
          if (allBids.length === 1) {
            // Only this player bid
            marketShares[player] = 1;
          } else {
            // Multiple players bid, calculate shares
            const alpha = DEFAULT_ALPHA;
            marketShares[player] = calculateMarketShare(playerBid, allBids, alpha);
            rivals.forEach(rival => {
              if (roundBids[rival] > 0) {
                marketShares[rival] = calculateMarketShare(roundBids[rival], allBids, alpha);
              }
            });
          }
        }
      });

      // Second pass: Calculate profits and opportunity costs
      const marketSize = DEFAULT_MARKET_SIZE;
      allPlayers.forEach(player => {
        const rivals = prevState.rivalries[player] || [];
        if (rivals.length === 0) return;

        const playerBid = roundBids[player];
        
        if (playerBid === 0) {
          // Player didn't bid, calculate opportunity cost from all rivals' profits
          const rivalsProfits = rivals.map(rival => {
            if (roundBids[rival] === 0) return 0;
            return calculateProfit(roundBids[rival], marketShares[rival], prevState.costPerUnit, marketSize);
          });
          const totalRivalProfit = rivalsProfits.reduce((sum, profit) => sum + profit, 0);
          profits[player] = -totalRivalProfit; // Negative profit equal to sum of rivals' profits
        } else {
          // Player bid, calculate normal profit
          profits[player] = calculateProfit(playerBid, marketShares[player], prevState.costPerUnit, marketSize);
        }
      });

      // Create round result
      const roundResult: RoundResult = {
        round: prevState.currentRound,
        bids: roundBids,
        marketShares,
        profits,
        timestamp: Date.now()
      };

      console.log('Ending round:', {
        currentRound: prevState.currentRound,
        bids: roundBids,
        marketShares,
        profits
      });

      const newState = {
        ...prevState,
        isActive: false,
        roundStartTime: null,
        roundHistory: [...(prevState.roundHistory || []), roundResult],
        roundBids: {},
        players: Object.fromEntries(
          Object.entries(prevState.players).map(([name, player]) => [
            name,
            { ...player, hasSubmittedBid: false, currentBid: null }
          ])
        ),
        isEnded: prevState.currentRound >= prevState.totalRounds
      };

      return newState;
    });
  };

  const registerPlayer = (playerName: string) => {
    console.log('Registering player:', playerName);

    if (gameState.players[playerName]) {
      console.error('Player already exists:', playerName);
      return;
    }

    if (Object.keys(gameState.players).length >= gameState.maxPlayers) {
      console.error('Maximum number of players reached:', gameState.maxPlayers);
      return;
    }

    const newState = {
      ...gameState,
      players: {
        ...gameState.players,
        [playerName]: {
          name: playerName,
          currentBid: null,
          hasSubmittedBid: false,
          lastBidTime: null,
          isTimedOut: false
        }
      }
    };

    console.log('Updated players:', newState.players);

    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(newState));
    setGameState(newState);

    // Broadcast state change
    window.dispatchEvent(new StorageEvent('storage', {
      key: GAME_STATE_KEY,
      newValue: JSON.stringify(newState),
      oldValue: JSON.stringify(gameState)
    }));
  };

  const unregisterPlayer = (playerName: string) => {
    console.log('Unregistering player:', playerName);

    const { [playerName]: removedPlayer, ...remainingPlayers } = gameState.players;
    const { [playerName]: removedBid, ...remainingBids } = gameState.roundBids;

    const newState = {
      ...gameState,
      players: remainingPlayers,
      roundBids: remainingBids
    };

    console.log('Updated players:', newState.players);

    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(newState));
    setGameState(newState);

    // Broadcast state change
    window.dispatchEvent(new StorageEvent('storage', {
      key: GAME_STATE_KEY,
      newValue: JSON.stringify(newState),
      oldValue: JSON.stringify(gameState)
    }));
  };

  const timeoutPlayer = (playerName: string) => {
    console.log('Timing out player:', playerName);

    if (!gameState.players[playerName]) {
      console.error('Player not found:', playerName);
      return;
    }

    const newState = {
      ...gameState,
      players: {
        ...gameState.players,
        [playerName]: {
          ...gameState.players[playerName],
          isTimedOut: true
        }
      }
    };

    console.log('Updated player state:', newState.players[playerName]);

    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(newState));
    setGameState(newState);

    // Broadcast state change
    window.dispatchEvent(new StorageEvent('storage', {
      key: GAME_STATE_KEY,
      newValue: JSON.stringify(newState),
      oldValue: JSON.stringify(gameState)
    }));
  };

  const unTimeoutPlayer = (playerName: string) => {
    console.log('Removing timeout for player:', playerName);

    if (!gameState.players[playerName]) {
      console.error('Player not found:', playerName);
      return;
    }

    const newState = {
      ...gameState,
      players: {
        ...gameState.players,
        [playerName]: {
          ...gameState.players[playerName],
          isTimedOut: false
        }
      }
    };

    console.log('Updated player state:', newState.players[playerName]);

    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(newState));
    setGameState(newState);
    
    // Broadcast state change
    window.dispatchEvent(new StorageEvent('storage', {
      key: GAME_STATE_KEY,
      newValue: JSON.stringify(newState),
      oldValue: JSON.stringify(gameState)
    }));
  };

  const submitBid = (playerName: string, bid: number) => {
    console.log(`Submitting bid for ${playerName}:`, bid);
    setGameState(prevState => {
      if (!prevState.isActive) {
        console.log('Cannot submit bid: round is not active');
        return prevState;
      }

      if (bid < prevState.minBid || bid > prevState.maxBid) {
        console.log('Bid out of range:', bid);
        return prevState;
      }

      const newState = {
        ...prevState,
        roundBids: {
          ...prevState.roundBids,
          [playerName]: bid
        },
        players: {
          ...prevState.players,
          [playerName]: {
            ...prevState.players[playerName],
            currentBid: bid,
            hasSubmittedBid: true,
            lastBidTime: Date.now()
          }
        }
      };

      console.log('Updated round bids:', newState.roundBids);
      return newState;
    });
  };

  const resetGame = () => {
    console.log('Resetting game');
    localStorage.removeItem(GAME_STATE_KEY);
    localStorage.removeItem(ROUND_HISTORY_KEY);
    localStorage.removeItem('gameConfig');
    setGameState({
      ...initialGameState,
      roundHistory: []
    });

    // Broadcast state change
    window.dispatchEvent(new StorageEvent('storage', {
      key: GAME_STATE_KEY,
      newValue: JSON.stringify(initialGameState),
      oldValue: JSON.stringify(gameState)
    }));
  };

  const endGame = () => {
    console.log('Ending game');

    const newState = {
      ...gameState,
      isActive: false,
      isEnded: true
    };

    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(newState));
    setGameState(newState);

    // Broadcast state change
    window.dispatchEvent(new StorageEvent('storage', {
      key: GAME_STATE_KEY,
      newValue: JSON.stringify(newState),
      oldValue: JSON.stringify(gameState)
    }));
  };

  const extendRoundTime = (additionalSeconds: number) => {
    console.log('Extending round time by:', additionalSeconds, 'seconds');
    
    if (!gameState.isActive || !gameState.roundStartTime) {
      console.error('Cannot extend time: no active round');
      return;
    }

    // Calculate new round time limit
    const newTimeLimit = gameState.roundTimeLimit + additionalSeconds;
    console.log('New round time limit:', newTimeLimit);

    const newState = {
      ...gameState,
      roundTimeLimit: newTimeLimit
    };

    console.log('Updating state with extended time:', {
      oldLimit: gameState.roundTimeLimit,
      newLimit: newTimeLimit,
      isActive: newState.isActive,
      roundStartTime: newState.roundStartTime
    });

    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(newState));
    setGameState(newState);

    // Broadcast state change
    window.dispatchEvent(new StorageEvent('storage', {
      key: GAME_STATE_KEY,
      newValue: JSON.stringify(newState),
      oldValue: JSON.stringify(gameState)
    }));
  };

  const updateRivalries = (rivalries: Record<string, string[]>) => {
    console.log('Updating rivalries:', rivalries);
    const newState = {
      ...gameState,
      rivalries
    };

    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(newState));
    setGameState(newState);
    
    // Broadcast state change
    window.dispatchEvent(new StorageEvent('storage', {
      key: GAME_STATE_KEY,
      newValue: JSON.stringify(newState),
      oldValue: JSON.stringify(gameState)
    }));
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
