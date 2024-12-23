import { ref, get, set, onValue, off, update } from 'firebase/database';
import { database } from '../firebase/config';
import { StorageAdapter } from './StorageAdapter';
import { GameState } from '../context/GameContext';

export class FirebaseStorageAdapter implements StorageAdapter {
  private gameRef = ref(database, 'games/current');
  private unsubscribe: (() => void) | null = null;

  async getGameState(): Promise<GameState | null> {
    try {
      const snapshot = await get(this.gameRef);
      return snapshot.val() as GameState;
    } catch (error) {
      console.error('Error getting game state:', error);
      return null;
    }
  }

  async updateGameState(gameState: Partial<GameState>): Promise<void> {
    try {
      await update(this.gameRef, gameState);
    } catch (error) {
      console.error('Error updating game state:', error);
      throw error;
    }
  }

  subscribeToGameState(callback: (gameState: GameState) => void): () => void {
    // Unsubscribe from previous subscription if exists
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    // Create new subscription
    const unsubscribe = onValue(this.gameRef, (snapshot) => {
      const gameState = snapshot.val() as GameState;
      if (gameState) {
        callback(gameState);
      }
    });

    // Store unsubscribe function
    this.unsubscribe = unsubscribe;

    return unsubscribe;
  }

  async addPlayer(playerName: string, playerData: any): Promise<void> {
    try {
      const playerRef = ref(database, `games/current/players/${playerName}`);
      await set(playerRef, playerData);
    } catch (error) {
      console.error('Error adding player:', error);
      throw error;
    }
  }

  async removePlayer(playerName: string): Promise<void> {
    try {
      const playerRef = ref(database, `games/current/players/${playerName}`);
      await set(playerRef, null);
    } catch (error) {
      console.error('Error removing player:', error);
      throw error;
    }
  }

  async updatePlayer(playerName: string, playerData: any): Promise<void> {
    try {
      const playerRef = ref(database, `games/current/players/${playerName}`);
      await update(playerRef, playerData);
    } catch (error) {
      console.error('Error updating player:', error);
      throw error;
    }
  }

  async updateRound(roundNumber: number, roundData: any): Promise<void> {
    try {
      const roundRef = ref(database, `games/current/roundHistory/${roundNumber}`);
      await set(roundRef, roundData);
    } catch (error) {
      console.error('Error updating round:', error);
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
