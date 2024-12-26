import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { AutopilotState } from "../../src/types/autopilot";
import { GameState, DatabaseGame } from "../../src/types/game";
import { AutopilotMonitor } from "./monitoring";
import { db } from "./init";

const DEFAULT_MARKET_SIZE = 1000;

/**
 * Process a single game round, calculating market shares and profits
 * @param {admin.database.Reference} gameRef Reference to the game in Firebase
 * @param {GameState} gameState Current state of the game
 */
async function processGameRound(
  gameRef: admin.database.Reference,
  gameState: GameState,
): Promise<void> {
  const gameId = gameRef.key as string;

  try {
    const {
      players,
      roundBids,
      maxBid,
      costPerUnit,
    } = gameState;

    // Handle players who haven't submitted bids
    const updatedBids = { ...roundBids };
    let timeoutCount = 0;
    Object.entries(players).forEach(([playerId, player]) => {
      if (!player.hasSubmittedBid) {
        updatedBids[playerId] = maxBid; // Set max bid for non-participating players
        timeoutCount++;
      }
    });

    // Calculate market shares
    const totalBids = Object.values(updatedBids).reduce((sum, bid) => sum + bid, 0);
    const marketShares = Object.entries(updatedBids).reduce((shares, [playerId, bid]) => ({
      ...shares,
      [playerId]: bid / totalBids,
    }), {} as Record<string, number>);

    // Calculate profits
    const profits = Object.entries(updatedBids).reduce((result, [playerId, bid]) => ({
      ...result,
      [playerId]: (marketShares[playerId] * DEFAULT_MARKET_SIZE) - (bid * costPerUnit),
    }), {} as Record<string, number>);

    // Prepare round result
    const roundResult = {
      round: gameState.currentRound,
      bids: updatedBids,
      marketShares,
      profits,
      timestamp: Date.now(),
    };

    // Update game state
    const updates: Partial<GameState> = {
      roundHistory: [...(gameState.roundHistory || []), roundResult],
      currentRound: gameState.currentRound + 1,
      roundStartTime: null,
      roundBids: {},
      autopilot: {
        enabled: gameState.autopilot?.enabled ?? false,
        lastUpdateTime: Date.now(),
      },
    };

    // Check if this was the last round
    if (gameState.currentRound >= gameState.totalRounds) {
      updates.isActive = false;
      updates.isEnded = true;
      if (updates.autopilot) {
        updates.autopilot.enabled = false;
      }
    }

    // Reset player states for next round
    const updatedPlayers = { ...players };
    Object.keys(players).forEach((playerId) => {
      updatedPlayers[playerId] = {
        ...players[playerId],
        hasSubmittedBid: false,
        currentBid: null,
      };
    });
    updates.players = updatedPlayers;

    // Apply updates atomically
    await gameRef.update(updates);

    // Log successful round processing
    await AutopilotMonitor.logEvent({
      gameId,
      action: "process_round",
      status: "success",
      details: {
        round: gameState.currentRound,
        totalRounds: gameState.totalRounds,
        playerCount: Object.keys(players).length,
        processedBids: Object.keys(updatedBids).length,
        timeoutBids: timeoutCount,
      },
    });
  } catch (error) {
    // Log error in round processing
    await AutopilotMonitor.logEvent({
      gameId,
      action: "process_round",
      status: "failure",
      details: {
        round: gameState.currentRound,
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
    throw error;
  }
}

// Cleanup old logs every day
export const cleanupAutopilotLogs = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async () => {
    await AutopilotMonitor.cleanup(30); // Keep 30 days of logs
    return null;
  });

export const processAutopilot = functions.pubsub
  .schedule("every 5 minutes")
  .onRun(async () => {
    const gamesRef = db.ref("games");

    try {
      // Get all active games
      const snapshot = await gamesRef
        .orderByChild("gameState/isActive")
        .equalTo(true)
        .once("value");

      const games = snapshot.val() as Record<string, DatabaseGame>;
      if (!games) {
        console.log("No active games found");
        return null;
      }

      // Process each active game
      const gamePromises = Object.entries(games).map(async ([gameId, game]) => {
        const { gameState } = game;
        const gameRef = gamesRef.child(gameId);

        // Skip if autopilot is not enabled
        if (!gameState.autopilot?.enabled) {
          return;
        }

        // Check if we need to process this round
        const roundStartTime = gameState.roundStartTime;
        const currentTime = Date.now();
        const roundTimeLimit = gameState.roundTimeLimit * 1000; // Convert to ms

        if (roundStartTime && (currentTime - roundStartTime) >= roundTimeLimit) {
          await processGameRound(gameRef, gameState);
        }
      });

      await Promise.all(gamePromises);
      return null;
    } catch (error) {
      console.error("Error processing autopilot:", error);
      return null;
    }
  });

export const toggleAutopilot = functions.https.onCall(async (data: { gameId: string; enabled: boolean }, context) => {
  // Verify admin access
  if (!context?.auth?.token.admin) {
    throw new functions.https.HttpsError("permission-denied", "Only admins can toggle autopilot");
  }

  const { gameId, enabled } = data;
  const gameRef = db.ref(`games/${gameId}`);

  try {
    // Update autopilot state
    const autopilotState: AutopilotState = {
      enabled,
      lastUpdateTime: enabled ? Date.now() : null,
    };

    await gameRef.child("gameState/autopilot").set(autopilotState);

    // Log the toggle action
    await AutopilotMonitor.logEvent({
      gameId,
      action: "toggle",
      status: "success",
      details: { enabled },
    });

    return { success: true, message: `Autopilot ${enabled ? "enabled" : "disabled"} for game ${gameId}` };
  } catch (error) {
    // Log the error
    await AutopilotMonitor.logEvent({
      gameId,
      action: "toggle",
      status: "failure",
      details: {
        enabled,
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });

    console.error("Error toggling autopilot:", error);
    throw new functions.https.HttpsError("internal", "Failed to toggle autopilot");
  }
});
