import { ref, get, set, onValue, off, update } from 'firebase/database';
import { database } from '../firebase/config';
import { StorageAdapter } from './StorageAdapter';
import { GameState, Player } from '../context/GameContext';

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

  async addPlayer(playerName: string, playerData: Player): Promise<void> {
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

  async updatePlayer(playerName: string, playerData: Partial<Player>): Promise<void> {
    try {
      const playerRef = ref(database, `games/current/players/${playerName}`);
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
    try {
      const updates: any = {};
      updates[`games/current/roundBids/${playerName}`] = bid;
      updates[`games/current/players/${playerName}`] = {
        currentBid: bid,
        hasSubmittedBid: true,
        lastBidTime: Date.now()
      };
      await update(ref(database), updates);
    } catch (error) {
      console.error('Error submitting bid:', error);
      throw error;
    }
  }

  async resetGame(): Promise<void> {
    try {
      await set(this.gameRef, null);
    } catch (error) {
      console.error('Error resetting game:', error);
      throw error;
    }
  }

  async extendRoundTime(additionalSeconds: number): Promise<void> {
    try {
      const snapshot = await get(this.gameRef);
      const currentState = snapshot.val() as GameState;
      if (!currentState) return;

      await update(this.gameRef, {
        roundTimeLimit: currentState.roundTimeLimit + additionalSeconds
      });
    } catch (error) {
      console.error('Error extending round time:', error);
      throw error;
    }
  }

  async updateRivalries(rivalries: Record<string, string[]>): Promise<void> {
    try {
      console.log('FirebaseStorageAdapter - Updating rivalries:', rivalries);
      const updates = {
        'rivalries': rivalries  // Use explicit path to update only rivalries
      };
      await update(this.gameRef, updates);
    } catch (error) {
      console.error('Error updating rivalries:', error);
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
