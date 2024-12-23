import { StorageAdapter } from './StorageAdapter';
import { GameState, Player, RoundResult } from '../context/GameContext';

export class LocalStorageAdapter implements StorageAdapter {
  private readonly STORAGE_KEY = 'currentGame';
  private listeners: ((gameState: GameState) => void)[] = [];

  private getInitialState(): GameState {
    return {
      hasGameStarted: false,
      isActive: false,
      isEnded: false,
      currentRound: 0,
      totalRounds: 0,
      roundTimeLimit: 0,
      roundStartTime: null,
      minBid: 0,
      maxBid: 0,
      costPerUnit: 0,
      maxPlayers: 0,
      players: {},
      roundBids: {},
      roundHistory: [],
      rivalries: {}
    };
  }

  async getGameState(): Promise<GameState | null> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error getting game state from localStorage:', error);
      return null;
    }
  }

  async updateGameState(gameState: Partial<GameState>): Promise<void> {
    try {
      const currentState = await this.getGameState() || this.getInitialState();
      const newState = { ...currentState, ...gameState };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newState));
      this.notifyListeners(newState as GameState);
    } catch (error) {
      console.error('Error updating game state in localStorage:', error);
      throw error;
    }
  }

  subscribeToGameState(callback: (gameState: GameState) => void): () => void {
    this.listeners.push(callback);
    
    // Initialize with current state if exists
    const currentState = localStorage.getItem(this.STORAGE_KEY);
    if (currentState) {
      callback(JSON.parse(currentState));
    } else {
      callback(this.getInitialState());
    }

    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  async addPlayer(playerName: string, playerData: any): Promise<void> {
    const currentState = await this.getGameState() || this.getInitialState();
    const players = { ...currentState.players };
    players[playerName] = playerData;
    await this.updateGameState({ players });
  }

  async removePlayer(playerName: string): Promise<void> {
    const currentState = await this.getGameState() || this.getInitialState();
    const players = { ...currentState.players };
    delete players[playerName];
    await this.updateGameState({ players });
  }

  async updatePlayer(playerName: string, playerData: any): Promise<void> {
    const currentState = await this.getGameState() || this.getInitialState();
    const players = currentState.players || {};
    players[playerName] = { ...players[playerName], ...playerData };
    await this.updateGameState({ players });
  }

  async updateRound(roundNumber: number, roundData: any): Promise<void> {
    const currentState = await this.getGameState() || this.getInitialState();
    const roundHistory = [...(currentState.roundHistory || [])];
    roundHistory[roundNumber] = roundData;
    await this.updateGameState({ roundHistory });
  }

  private notifyListeners(gameState: GameState): void {
    this.listeners.forEach(listener => listener(gameState));
  }

  cleanup(): void {
    this.listeners = [];
  }
}
