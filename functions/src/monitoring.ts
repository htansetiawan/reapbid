import * as functions from "firebase-functions";
import { db } from "./init";

interface AutopilotLogEntry {
  timestamp: number;
  gameId: string;
  action: "toggle" | "process_round" | "error";
  status: "success" | "failure";
  details: {
    round?: number;
    totalRounds?: number;
    playerCount?: number;
    processedBids?: number;
    timeoutBids?: number;
    error?: string;
    enabled?: boolean;
  };
}

/**
 * Handles monitoring and logging for the autopilot system
 */
export class AutopilotMonitor {
  private static readonly LOGS_PATH = "monitoring/autopilot";

  /**
   * Logs an autopilot event to Firebase and Cloud Functions logs
   * @param {Omit<AutopilotLogEntry, "timestamp">} entry The log entry to store
   */
  static async logEvent(entry: Omit<AutopilotLogEntry, "timestamp">): Promise<void> {
    const logEntry: AutopilotLogEntry = {
      ...entry,
      timestamp: Date.now(),
    };

    try {
      // Store in monitoring collection
      await db.ref(this.LOGS_PATH).push(logEntry);

      // Log to Cloud Functions console
      const logMessage = `[Autopilot ${entry.action}] Game ${entry.gameId}: ${entry.status}`;
      if (entry.status === "success") {
        functions.logger.info(logMessage, entry.details);
      } else {
        functions.logger.error(logMessage, entry.details);
      }
    } catch (error) {
      console.error("Failed to write log entry:", error);
      functions.logger.error("Failed to write log entry:", { error, entry });
    }
  }

  /**
   * Cleans up old log entries to prevent database bloat
   * @param {number} retentionDays Number of days to retain logs
   */
  static async cleanup(retentionDays = 30): Promise<void> {
    const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);

    try {
      const oldLogs = await db
        .ref(this.LOGS_PATH)
        .orderByChild("timestamp")
        .endAt(cutoffTime)
        .once("value");

      const updates: Record<string, null> = {};
      oldLogs.forEach((snapshot) => {
        updates[snapshot.key as string] = null;
      });

      if (Object.keys(updates).length > 0) {
        await db.ref(this.LOGS_PATH).update(updates);
        functions.logger.info(`Cleaned up ${Object.keys(updates).length} old log entries`);
      }
    } catch (error) {
      console.error("Failed to cleanup old logs:", error);
      functions.logger.error("Failed to cleanup old logs:", error);
    }
  }
}
