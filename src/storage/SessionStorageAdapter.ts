import { 
  ref, 
  set, 
  onValue, 
  off, 
  get, 
  update,
  remove,
  Database 
} from 'firebase/database';
import { database } from '../firebase/config';
import { StorageAdapter } from './StorageAdapter';
import { GameState, Player } from '../context/GameContext';

export const GAME_CONFIG_DEFAULTS = {
  TOTAL_ROUNDS: 3,
  ROUND_TIME_LIMIT: 300,
  MIN_BID: 1,
  MAX_BID: 200,
  COST_PER_UNIT: 25,
  MAX_PLAYERS: 10
} as const;

export interface GameConfig {
  totalRounds: number;
  roundTimeLimit: number;
  minBid: number;
  maxBid: number;
  costPerUnit: number;
  maxPlayers: number;
}

export interface Session {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  status: 'active' | 'completed' | 'archived';
  config: GameConfig;
  gameState: GameState | null;
}

export interface SessionMetadata {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  status: 'active' | 'completed' | 'archived';
  totalPlayers?: number;
  currentRound?: number;
  totalRounds?: number;
  config: GameConfig;
}

export class SessionStorageAdapter implements StorageAdapter {
  private database: Database;
  private sessionsRef: any;
  private currentSessionRef: any = null;
  private unsubscribe: (() => void) | null = null;

  constructor(sessionId?: string) {
    this.database = database;
    this.sessionsRef = ref(this.database, 'games');
    if (sessionId) {
      this.setCurrentSession(sessionId);
    }
  }

  setCurrentSession(sessionId: string): void {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }
    this.currentSessionRef = ref(this.database, `games/${sessionId}`);
  }

  private validateSessionName(name: string): void {
    if (!name) {
      throw new Error('Session name cannot be empty');
    }
    if (/[.#$\[\]]/.test(name)) {
      throw new Error('Session name cannot contain ., #, $, [, or ] characters');
    }
  }

  private validateConfig(config: GameConfig): void {
    if (!config) {
      throw new Error('Game configuration is required');
    }
    if (config.totalRounds < 1 || config.totalRounds > 10) {
      throw new Error('Total rounds must be between 1 and 10');
    }
    if (config.roundTimeLimit < 30 || config.roundTimeLimit > 600) {
      throw new Error('Round time limit must be between 30 and 600 seconds');
    }
    if (config.minBid < 1) {
      throw new Error('Minimum bid must be at least 1');
    }
    if (config.maxBid <= config.minBid || config.maxBid > 1000) {
      throw new Error('Maximum bid must be greater than minimum bid and not exceed 1000');
    }
    if (config.costPerUnit <= 0 || config.costPerUnit > 100) {
      throw new Error('Cost per unit must be between 1 and 100');
    }
    if (config.maxPlayers < 2 || config.maxPlayers > 20) {
      throw new Error('Maximum players must be between 2 and 20');
    }
  }

  async createSession(name: string, config: GameConfig): Promise<string> {
    try {
      const sessionId = name.toLowerCase().replace(/\s+/g, '-');
      const sessionRef = ref(this.database, `games/${sessionId}`);

      // Initialize game state with config values
      const initialGameState: GameState = {
        hasGameStarted: true,  // Set to true since we're starting a new game
        isActive: false,
        isEnded: false,
        currentRound: 0,  // Start at 0 so first round will be Round 1
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

      const session = {
        id: sessionId,
        name: name,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'active',
        config: config,
        gameState: initialGameState
      };

      await set(sessionRef, session);
      return sessionId;
    } catch (error) {
      throw error;
    }
  }

  async listSessions(): Promise<SessionMetadata[]> {
    try {
      const snapshot = await get(this.sessionsRef);
      const sessions = snapshot.val() || {};
      
      return Object.entries(sessions).map(([id, session]: [string, any]) => {
        // Calculate total players from gameState.players
        const totalPlayers = session.gameState?.players ? Object.keys(session.gameState.players).length : 0;
        
        // Log session status for debugging
        console.log(`Session ${id} status:`, session.status);
        console.log(`Session ${id} gameState.isEnded:`, session.gameState?.isEnded);
        
        // Defensive check for config
        const config = session.config || {
          totalRounds: 3,  // Default value
          roundTimeLimit: 60,
          minBid: 0,
          maxBid: 100,
          costPerUnit: 50,
          maxPlayers: 4
        };

        // If game is ended, session should be completed
        const status = session.gameState?.isEnded ? 'completed' : (session.status || 'active');
        
        return {
          id,
          name: session.name || 'Unnamed Session',
          createdAt: session.createdAt || Date.now(),
          updatedAt: session.updatedAt || Date.now(),
          status,
          totalPlayers,
          currentRound: session.gameState?.currentRound || 1,
          totalRounds: config.totalRounds,
          config
        };
      });
    } catch (error) {
      console.error('Error listing sessions:', error);
      return [];
    }
  }

  async updateSessionStatus(sessionId: string, status: 'active' | 'completed'): Promise<void> {
    try {
      const sessionRef = ref(this.database, `games/${sessionId}`);
      const snapshot = await get(sessionRef);
      
      if (!snapshot.exists()) {
        throw new Error('Session not found');
      }

      const session = snapshot.val();
      const updates: Record<string, any> = {};

      // Update status at the root level
      updates['status'] = status;
      updates['updatedAt'] = Date.now();

      // If marking as completed and game state exists but isn't ended,
      // update both status and game state in one transaction
      if (status === 'completed' && 
          session.gameState && 
          !session.gameState.isEnded) {
        updates['gameState/isEnded'] = true;
        updates['gameState/isActive'] = false;
      }

      // Update everything in one transaction
      await update(sessionRef, updates);
    } catch (error) {
      console.error('Error updating session status:', error);
      throw error;
    }
  }

  async getGameState(): Promise<GameState | null> {
    if (!this.currentSessionRef) {
      this.setCurrentSession('current');
    }
    try {
      // First try to get the full session to see what we have
      const sessionSnapshot = await get(this.currentSessionRef);
      const session = sessionSnapshot.val();

      if (session && session.gameState) {
        const normalizedState = {
          ...session.gameState,
          hasGameStarted: Boolean(session.gameState.hasGameStarted),
          isActive: Boolean(session.gameState.isActive),
          isEnded: Boolean(session.gameState.isEnded),
          players: session.gameState.players || {},
          roundBids: session.gameState.roundBids || {},
          roundHistory: session.gameState.roundHistory || [],
          rivalries: session.gameState.rivalries || {}
        };
        return normalizedState;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async updateGameState(gameState: Partial<GameState>): Promise<void> {
    if (!this.currentSessionRef) {
      throw new Error('No session selected');
    }
    try {
      // Get current state
      const snapshot = await get(this.currentSessionRef);
      const session = snapshot.val();

      if (!session) {
        throw new Error('Session not found');
      }

      // Merge states, ensuring we preserve config values
      const mergedState = {
        ...session.gameState,
        ...gameState,
        // Always use config values for these parameters
        costPerUnit: session.config.costPerUnit,
        minBid: session.config.minBid,
        maxBid: session.config.maxBid,
        maxPlayers: session.config.maxPlayers,
        totalRounds: session.config.totalRounds,
        roundTimeLimit: session.config.roundTimeLimit,
        updatedAt: Date.now()
      };

      // Update the session with the new game state
      const updates = {
        gameState: mergedState,
        updatedAt: Date.now()
      };

      await update(this.currentSessionRef, updates);

    } catch (error) {
      throw error;
    }
  }

  async addPlayer(playerName: string, playerData: Player): Promise<void> {
    if (!this.currentSessionRef) {
      throw new Error('No session selected');
    }
    try {
      // Get current session data
      const snapshot = await get(this.currentSessionRef);
      const session = snapshot.val();

      if (!session) {
        throw new Error('Session not found');
      }

      // Get current game state
      const currentGameState = session.gameState || {};

      // Update players in game state, ensuring we preserve config values
      const updatedGameState = {
        ...currentGameState,
        maxPlayers: session.config.maxPlayers, // Ensure maxPlayers matches config
        players: {
          ...(currentGameState.players || {}),
          [playerName]: playerData
        }
      };

      // Update the session with new game state
      const updates = {
        gameState: updatedGameState,
        updatedAt: Date.now()
      };

      await update(this.currentSessionRef, updates);

    } catch (error) {
      throw error;
    }
  }

  async removePlayer(playerName: string): Promise<void> {
    if (!this.currentSessionRef) {
      throw new Error('No session selected');
    }

    const snapshot = await get(this.currentSessionRef);
    const session = snapshot.val();

    if (!session) {
      throw new Error('Session not found');
    }

    const updatedSession = {
      ...session,
      gameState: {
        ...session.gameState,
        players: {
          ...(session.gameState?.players || {}),
          [playerName]: undefined
        }
      },
      updatedAt: Date.now()
    };

    await set(this.currentSessionRef, updatedSession);
  }

  async updatePlayer(playerName: string, playerData: Partial<Player>): Promise<void> {
    if (!this.currentSessionRef) {
      throw new Error('No session selected');
    }

    const playerRef = ref(this.database, `games/${this.currentSessionRef.key}/gameState/players/${playerName}`);
    await update(playerRef, playerData);
  }

  async timeoutPlayer(playerName: string): Promise<void> {
    if (!this.currentSessionRef) {
      throw new Error('No session selected');
    }

    const playerRef = ref(this.database, `games/${this.currentSessionRef.key}/gameState/players/${playerName}`);
    await update(playerRef, { isTimedOut: true });
  }

  async unTimeoutPlayer(playerName: string): Promise<void> {
    if (!this.currentSessionRef) {
      throw new Error('No session selected');
    }

    const playerRef = ref(this.database, `games/${this.currentSessionRef.key}/gameState/players/${playerName}`);
    await update(playerRef, { isTimedOut: false });
  }

  async submitBid(playerName: string, bid: number): Promise<void> {
    if (!this.currentSessionRef) {
      throw new Error('No session selected');
    }

    const gameState = await this.getGameState();
    if (!gameState) throw new Error('No game state found');

    const roundBids = { ...gameState.roundBids, [playerName]: bid };
    const players = { 
      ...gameState.players,
      [playerName]: {
        ...(gameState.players?.[playerName] || {}),
        hasSubmittedBid: true,
        currentBid: bid,
        lastBidTime: Date.now()
      }
    };

    await this.updateGameState({ roundBids, players });
  }

  async resetGame(): Promise<void> {
    if (!this.currentSessionRef) {
      throw new Error('No session selected');
    }

    await set(this.currentSessionRef, null);
  }

  async extendRoundTime(additionalSeconds: number): Promise<void> {
    if (!this.currentSessionRef) {
      throw new Error('No session selected');
    }

    const gameState = await this.getGameState();
    if (gameState && gameState.roundStartTime !== null) {
      const updatedRoundStartTime = gameState.roundStartTime + (additionalSeconds * 1000);
      await this.updateGameState({ roundStartTime: updatedRoundStartTime });
    }
  }

  async updateRivalries(rivalries: Record<string, string[]>): Promise<void> {
    if (!this.currentSessionRef) {
      throw new Error('No session selected');
    }

    const gameState = await this.getGameState();
    if (!gameState) throw new Error('No game state found');

    await this.updateGameState({ rivalries });
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      const sessionRef = ref(this.database, `games/${sessionId}`);
      await remove(sessionRef);
    } catch (error) {
      // console.log('Error deleting session:', error);
      throw error;
    }
  }

  subscribeToGameState(callback: (gameState: GameState) => void): () => void {
    if (!this.currentSessionRef) {
      throw new Error('No session selected');
    }

    // Unsubscribe from any existing subscription
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    // Subscribe to game state changes
    const gameStateRef = ref(this.database, `games/${this.currentSessionRef.key}/gameState`);
    const unsubscribe = onValue(gameStateRef, (snapshot) => {
      const gameState = snapshot.val();
      if (gameState) {
        callback(gameState);
      }
    }, (error) => {
      // console.log('Error subscribing to game state:', error);
    });

    this.unsubscribe = unsubscribe;
    return unsubscribe;
  }

  cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}
