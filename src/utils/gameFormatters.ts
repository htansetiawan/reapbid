/**
 * Utility functions for formatting game-related information
 */

/**
 * Formats the current round and total rounds into a user-friendly string
 * @param currentRound - The current round number (0-based)
 * @param totalRounds - The total number of rounds
 * @returns A string in the format "current/total" or "-" if either value is undefined
 */
export const displayRound = (currentRound: number | undefined, totalRounds: number | undefined): string => {
  if (currentRound === undefined || totalRounds === undefined) {
    return '-';
  }
  const displayCurrentRound = Math.min(currentRound, totalRounds);
  return `${displayCurrentRound}/${totalRounds}`;
};
