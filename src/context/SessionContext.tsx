import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { StorageFactory, StorageType } from '../storage/StorageFactory';
import { SessionMetadata, GameConfig } from '../storage/SessionStorageAdapter';

export interface SessionContextType {
  sessions: SessionMetadata[];
  currentSessionId: string | null;
  isLoading: boolean;
  error: string | null;
  selectSession: (sessionId: string) => void;
  createSession: (name: string, config: GameConfig) => Promise<string>;
  updateSessionStatus: (sessionId: string, status: 'active' | 'completed' | 'archived') => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  refreshSessions: () => Promise<void>;
  exitSession: () => void;  // Keep this for backward compatibility
}

const SessionContext = createContext<SessionContextType | null>(null);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<SessionMetadata[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use SessionStorageAdapter for session management
  const storage = StorageFactory.getInstance(StorageType.Session);

  // Single source of truth for session refresh
  const refreshSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const sessionList = await storage.listSessions();
      setSessions(sessionList);
    } catch (err) {
      console.error('Error loading sessions:', err);
      setError('Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  }, []); // Remove isLoading dependency since we manage it internally

  // Initial load
  useEffect(() => {
    refreshSessions();
  }, []);

  // Simple session selection
  const selectSession = useCallback((sessionId: string) => {
    if (sessionId === currentSessionId) {
      console.log('Session already selected:', sessionId);
      return;
    }

    console.log('Selecting session:', sessionId);
    storage.setCurrentSession(sessionId);
    setCurrentSessionId(sessionId);
  }, [currentSessionId]);

  // Add exitSession for backward compatibility
  const exitSession = useCallback(() => {
    setCurrentSessionId(null);
  }, []);

  // Create session with automatic refresh
  const createSession = useCallback(async (name: string, config: GameConfig) => {
    setIsLoading(true);
    setError(null);
    try {
      const sessionId = await storage.createSession(name, config);
      await refreshSessions();
      return sessionId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create session';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [refreshSessions]);

  // Update session status with automatic refresh
  const updateSessionStatus = useCallback(async (sessionId: string, status: 'active' | 'completed' | 'archived') => {
    setIsLoading(true);
    setError(null);
    try {
      await storage.updateSessionStatus(sessionId, status);
      await refreshSessions();
    } catch (err) {
      setError('Failed to update session status');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshSessions]);

  // Delete session with automatic refresh
  const deleteSession = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      if (typeof storage.deleteSession === 'function') {
        await storage.deleteSession(sessionId);
        if (sessionId === currentSessionId) {
          setCurrentSessionId(null);
        }
        await refreshSessions();
      } else {
        throw new Error('Delete session not supported by current storage adapter');
      }
    } catch (err) {
      setError('Failed to delete session');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentSessionId, refreshSessions]);

  const value = useMemo<SessionContextType>(() => ({
    sessions,
    currentSessionId,
    isLoading,
    error,
    selectSession,
    createSession,
    updateSessionStatus,
    deleteSession,
    refreshSessions,
    exitSession
  }), [
    sessions,
    currentSessionId,
    isLoading,
    error,
    selectSession,
    createSession,
    updateSessionStatus,
    deleteSession,
    refreshSessions,
    exitSession
  ]);

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};
