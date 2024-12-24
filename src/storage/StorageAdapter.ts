import { GameState, Player } from '../context/GameContext';
import { SessionMetadata, GameConfig } from './SessionStorageAdapter';

export interface StorageAdapter {
  // Session management
  createSession(name: string, config?: GameConfig): Promise<string>;
  listSessions(): Promise<SessionMetadata[]>;
  updateSessionStatus(sessionId: string, status: 'active' | 'completed' | 'archived'): Promise<void>;
  setCurrentSession(sessionId: string): void;
  deleteSession?(sessionId: string): Promise<void>;

  // Game state management
  getGameState(): Promise<GameState | null>;
  updateGameState(gameState: Partial<GameState>): Promise<void>;
  subscribeToGameState(callback: (gameState: GameState) => void): () => void;
  
  // Player management
  addPlayer(playerName: string, playerData: Player): Promise<void>;
  removePlayer(playerName: string): Promise<void>;
  updatePlayer(playerName: string, playerData: Partial<Player>): Promise<void>;
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
