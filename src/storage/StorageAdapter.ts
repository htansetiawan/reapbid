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
  timeoutPlayer(playerName: string): Promise<void>;
  unTimeoutPlayer(playerName: string): Promise<void>;
  submitBid(playerName: string, bid: number): Promise<void>;
  
  // Game operations
  resetGame(): Promise<void>;
  extendRoundTime(additionalSeconds: number): Promise<void>;
  updateRivalries(rivalries: Record<string, string[]>): Promise<void>;
  
  // Cleanup
  cleanup(): void;
}
