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
    console.log('Setting current session to:', sessionId);
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
    this.validateSessionName(name);
    this.validateConfig(config);

    try {
      const sessionId = name.toLowerCase().replace(/\s+/g, '-');
      const sessionRef = ref(this.database, `games/${sessionId}`);

      console.log('Creating new session with ID:', sessionId);

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

      console.log('Initial game state:', initialGameState);

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
      console.log('Session created successfully:', session);
      return sessionId;
    } catch (error) {
      console.error('Error creating session:', error);
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
        
        return {
          id,
          name: session.name,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          status: session.status,
          totalPlayers,
          currentRound: session.gameState?.currentRound,
          totalRounds: session.config.totalRounds,
          config: session.config
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
      const updates: any = {
        status,
        updatedAt: Date.now()
      };

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

  // Implement StorageAdapter interface
  async getGameState(): Promise<GameState | null> {
    if (!this.currentSessionRef) {
      this.setCurrentSession('current');
    }
    try {
      console.log('Getting game state for session:', this.currentSessionRef.key);
      // First try to get the full session to see what we have
      const sessionSnapshot = await get(this.currentSessionRef);
      const session = sessionSnapshot.val();
      console.log('Full session data:', session);

      if (session && session.gameState) {
        console.log('Found game state in session:', session.gameState);
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
        console.log('Normalized game state:', normalizedState);
        return normalizedState;
      }
      console.log('No game state found in session');
      return null;
    } catch (error) {
      console.error('Error getting game state:', error);
      return null;
    }
  }

  async updateGameState(gameState: Partial<GameState>): Promise<void> {
    if (!this.currentSessionRef) {
      throw new Error('No session selected');
    }
    try {
      console.log('Updating game state for session:', this.currentSessionRef.key);
      console.log('Update payload:', gameState);

      // Get current state
      const snapshot = await get(this.currentSessionRef);
      const session = snapshot.val();
      console.log('Current session data:', session);

      if (!session) {
        throw new Error('Session not found');
      }

      // Merge states, giving priority to new state
      const mergedState = {
        ...session.gameState,
        ...gameState,
        updatedAt: Date.now()
      };

      console.log('Merged game state:', mergedState);

      // Update the session with the new game state
      const updates = {
        gameState: mergedState,
        updatedAt: Date.now()
      };

      console.log('Updating session with:', updates);
      await update(this.currentSessionRef, updates);
      console.log('Game state updated successfully');

    } catch (error) {
      console.error('Error updating game state:', error);
      throw error;
    }
  }

  async addPlayer(playerName: string, playerData: Player): Promise<void> {
    if (!this.currentSessionRef) {
      throw new Error('No session selected');
    }
    try {
      console.log('Adding player:', playerName, 'with data:', playerData);
      
      // Get current session data
      const snapshot = await get(this.currentSessionRef);
      const session = snapshot.val();
      console.log('Current session data:', session);

      if (!session) {
        throw new Error('Session not found');
      }

      // Get current game state
      const currentGameState = session.gameState || {};
      console.log('Current game state:', currentGameState);

      // Update players in game state
      const updatedGameState = {
        ...currentGameState,
        players: {
          ...(currentGameState.players || {}),
          [playerName]: playerData
        }
      };
      console.log('Updated game state:', updatedGameState);

      // Update the session with new game state
      const updates = {
        gameState: updatedGameState,
        updatedAt: Date.now()
      };

      console.log('Updating session with:', updates);
      await update(this.currentSessionRef, updates);
      console.log('Player added successfully');

    } catch (error) {
      console.error('Error adding player:', error);
      throw error;
    }
  }

  async removePlayer(playerName: string): Promise<void> {
    if (!this.currentSessionRef) {
      throw new Error('No session selected');
    }
    try {
      console.log('Removing player:', playerName);
      
      // Get current session data
      const snapshot = await get(this.currentSessionRef);
      const session = snapshot.val();
      console.log('Current session data:', session);

      if (!session) {
        throw new Error('Session not found');
      }

      // Get current game state
      const currentGameState = session.gameState || {};
      console.log('Current game state:', currentGameState);

      // Remove player from players object
      const { [playerName]: removedPlayer, ...remainingPlayers } = currentGameState.players || {};

      // Update game state
      const updatedGameState = {
        ...currentGameState,
        players: remainingPlayers
      };
      console.log('Updated game state:', updatedGameState);

      // Update the session with new game state
      const updates = {
        gameState: updatedGameState,
        updatedAt: Date.now()
      };

      console.log('Updating session with:', updates);
      await update(this.currentSessionRef, updates);
      console.log('Player removed successfully');

    } catch (error) {
      console.error('Error removing player:', error);
      throw error;
    }
  }

  async updatePlayer(playerName: string, playerData: Partial<Player>): Promise<void> {
    if (!this.currentSessionRef) {
      throw new Error('No session selected');
    }
    try {
      const playerRef = ref(this.database, `games/${this.currentSessionRef.key}/gameState/players/${playerName}`);
      await update(playerRef, playerData);
    } catch (error) {
      console.error('Error updating player:', error);
      throw error;
    }
  }

  async timeoutPlayer(playerName: string): Promise<void> {
    if (!this.currentSessionRef) {
      throw new Error('No session selected');
    }
    try {
      const playerRef = ref(this.database, `games/${this.currentSessionRef.key}/gameState/players/${playerName}`);
      await update(playerRef, { isTimedOut: true });
    } catch (error) {
      console.error('Error timing out player:', error);
      throw error;
    }
  }

  async unTimeoutPlayer(playerName: string): Promise<void> {
    if (!this.currentSessionRef) {
      throw new Error('No session selected');
    }
    try {
      const playerRef = ref(this.database, `games/${this.currentSessionRef.key}/gameState/players/${playerName}`);
      await update(playerRef, { isTimedOut: false });
    } catch (error) {
      console.error('Error removing timeout from player:', error);
      throw error;
    }
  }

  async submitBid(playerName: string, bid: number): Promise<void> {
    if (!this.currentSessionRef) {
      throw new Error('No session selected');
    }
    try {
      const gameState = await this.getGameState();
      if (!gameState) throw new Error('No game state found');
      
      // Update round bids
      const roundBids = { ...gameState.roundBids, [playerName]: bid };
      
      // Update player status
      const players = { 
        ...gameState.players,
        [playerName]: {
          ...(gameState.players?.[playerName] || {}),
          hasSubmittedBid: true,
          currentBid: bid,
          lastBidTime: Date.now()
        }
      };
      
      // Update both round bids and player status
      await this.updateGameState({ roundBids, players });
    } catch (error) {
      console.error('Error submitting bid:', error);
      throw error;
    }
  }

  async resetGame(): Promise<void> {
    if (!this.currentSessionRef) {
      throw new Error('No session selected');
    }
    try {
      await set(this.currentSessionRef, null);
    } catch (error) {
      console.error('Error resetting game:', error);
      throw error;
    }
  }

  async extendRoundTime(additionalSeconds: number): Promise<void> {
    if (!this.currentSessionRef) {
      throw new Error('No session selected');
    }
    try {
      const gameState = await this.getGameState();
      if (gameState && gameState.roundStartTime !== null) {
        const updatedRoundStartTime = gameState.roundStartTime + (additionalSeconds * 1000);
        await this.updateGameState({ roundStartTime: updatedRoundStartTime });
      }
    } catch (error) {
      console.error('Error extending round time:', error);
      throw error;
    }
  }

  async updateRivalries(rivalries: Record<string, string[]>): Promise<void> {
    if (!this.currentSessionRef) {
      throw new Error('No session selected');
    }
    try {
      await this.updateGameState({ rivalries });
    } catch (error) {
      console.error('Error updating rivalries:', error);
      throw error;
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      const sessionRef = ref(this.database, `games/${sessionId}`);
      await remove(sessionRef);
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  subscribeToGameState(callback: (gameState: GameState) => void): () => void {
    if (!this.currentSessionRef) {
      throw new Error('No session selected');
    }

    console.log('Subscribing to game state for session:', this.currentSessionRef.key);
    
    const unsubscribe = onValue(this.currentSessionRef, (snapshot) => {
      const session = snapshot.val();
      console.log('Received session update:', session);
      
      if (session && session.gameState) {
        console.log('Found game state in session:', session.gameState);
        // Normalize boolean values and ensure required fields exist
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
        console.log('Normalized game state:', normalizedState);
        callback(normalizedState);
      } else {
        console.log('No game state found in session update');
      }
    });

    return () => {
      console.log('Unsubscribing from game state');
      unsubscribe();
    };
  }

  cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}
