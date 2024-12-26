import { ref, get, set, onValue, off, update, runTransaction, Database } from 'firebase/database';
import { database } from '../firebase/config';
import { StorageAdapter } from './StorageAdapter';
import { GameState, Player } from '../context/GameContext';
import { SessionMetadata } from './SessionStorageAdapter';

export class FirebaseStorageAdapter implements StorageAdapter {
  private database: Database;
  private currentSessionRef: any = null;
  private unsubscribe: (() => void) | null = null;

  constructor(sessionId?: string) {
    this.database = database;
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

  async getGameState(): Promise<GameState | null> {
    if (!this.currentSessionRef) {
      throw new Error('No session selected');
    }
    try {
      const snapshot = await get(this.currentSessionRef);
      const session = snapshot.val();
      return session?.gameState || null;
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
      // If updating autopilot, use a transaction to ensure atomic update
      if (gameState.autopilot !== undefined) {
        const gameStateRef = ref(this.database, `games/${this.currentSessionRef.key}/gameState`);
        await runTransaction(gameStateRef, (currentState) => {
          if (currentState === null) {
            return gameState;
          }
          return {
            ...currentState,
            ...gameState,
            autopilot: {
              ...currentState.autopilot,
              ...gameState.autopilot
            }
          };
        });
      } else {
        await update(this.currentSessionRef, {
          gameState: gameState
        });
      }
    } catch (error) {
      console.error('Error updating game state:', error);
      throw error;
    }
  }

  subscribeToGameState(callback: (gameState: GameState) => void): () => void {
    if (!this.currentSessionRef) {
      throw new Error('No session selected');
    }

    // Unsubscribe from previous subscription if exists
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    // Create new subscription
    const unsubscribe = onValue(this.currentSessionRef, (snapshot) => {
      const session = snapshot.val();
      if (session?.gameState) {
        callback(session.gameState);
      }
    });

    // Store unsubscribe function
    this.unsubscribe = unsubscribe;

    return unsubscribe;
  }

  async addPlayer(playerName: string, playerData: Player): Promise<void> {
    if (!this.currentSessionRef) {
      throw new Error('No session selected');
    }
    try {
      const playerRef = ref(this.database, `games/${this.currentSessionRef.key}/gameState/players/${playerName}`);
      await set(playerRef, playerData);
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
      const playerRef = ref(this.database, `games/${this.currentSessionRef.key}/gameState/players/${playerName}`);
      await set(playerRef, null);
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
    await this.updatePlayer(playerName, { isTimedOut: true });
  }

  async unTimeoutPlayer(playerName: string): Promise<void> {
    await this.updatePlayer(playerName, { isTimedOut: false });
  }

  async submitBid(playerName: string, bid: number): Promise<void> {
    if (!this.currentSessionRef) {
      throw new Error('No session selected');
    }
    try {
      const updates: any = {};
      updates[`games/${this.currentSessionRef.key}/gameState/roundBids/${playerName}`] = bid;
      updates[`games/${this.currentSessionRef.key}/gameState/players/${playerName}`] = {
        currentBid: bid,
        hasSubmittedBid: true,
        lastBidTime: Date.now()
      };
      await update(ref(this.database), updates);
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
      const snapshot = await get(this.currentSessionRef);
      const session = snapshot.val();
      if (session?.gameState && session.gameState.roundStartTime !== null) {
        const updatedRoundStartTime = session.gameState.roundStartTime + (additionalSeconds * 1000);
        await update(this.currentSessionRef, { gameState: { ...session.gameState, roundStartTime: updatedRoundStartTime } });
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
      await update(this.currentSessionRef, { gameState: { ...this.getGameState(), rivalries } });
    } catch (error) {
      console.error('Error updating rivalries:', error);
      throw error;
    }
  }

  async createSession(name: string): Promise<string> {
    // Legacy implementation for backward compatibility
    return 'firebase-session';
  }

  async listSessions(): Promise<SessionMetadata[]> {
    throw new Error('Session management not supported in legacy adapter');
  }

  async updateSessionStatus(sessionId: string, status: 'active' | 'completed' | 'archived'): Promise<void> {
    throw new Error('Session management not supported in legacy adapter');
  }

  async loadSession(sessionId: string): Promise<GameState | null> {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }
    try {
      const sessionRef = ref(this.database, `games/${sessionId}`);
      const snapshot = await get(sessionRef);
      const session = snapshot.val();
      return session?.gameState || null;
    } catch (error) {
      console.error('Error loading session:', error);
      return null;
    }
  }

  async saveSession(sessionId: string, gameState: GameState): Promise<void> {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }
    try {
      const sessionRef = ref(this.database, `games/${sessionId}`);
      await update(sessionRef, { gameState });
    } catch (error) {
      console.error('Error saving session:', error);
      throw error;
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }
    try {
      const sessionRef = ref(this.database, `games/${sessionId}`);
      await set(sessionRef, null);
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  cleanup(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}
