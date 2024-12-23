import { GameState } from '../context/GameContext';

export interface StorageAdapter {
  // Basic operations
  getGameState(): Promise<GameState | null>;
  updateGameState(gameState: Partial<GameState>): Promise<void>;
  
  // Subscription
  subscribeToGameState(callback: (gameState: GameState) => void): () => void;
  
  // Player operations
  addPlayer(playerName: string, playerData: any): Promise<void>;
  removePlayer(playerName: string): Promise<void>;
  updatePlayer(playerName: string, playerData: any): Promise<void>;
  
  // Round operations
  updateRound(roundNumber: number, roundData: any): Promise<void>;
  
  // Cleanup
  cleanup(): void;
}
