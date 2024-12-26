# ReapBid Cloud Functions

The cloud functions are run periodically to process bids and update game state.

When the game is in autopilot mode, the cloud functions are triggered periodically to process bids and update game state.

## Quickstart

To install, build, and deploy to firebase, run:

```bash
npm install
```

```bash
npm run build
```

```bash
npm run deploy
```

## Game Engine Documentation

### Overview

This documentation covers the core game processing functionality and administrative controls for our multiplayer bidding game system.

### Core Game Processing

#### processGameRound

A function that handles the execution of each game round, including bid processing, market share calculations, and state updates.

```typescript
async function processGameRound(
  gameRef: admin.database.Reference,
  gameState: GameState
): Promise<void>
```

##### Features
- Processes all player bids for the current round
- Handles inactive players with automatic maximum bid assignment
- Calculates market shares based on bid proportions
- Computes player profits using market share and cost per unit
- Updates game state for next round progression
- Maintains round history
- Supports autopilot mode for automated progression

##### Game State Updates
- Round history
- Current round counter
- Round start time
- Player states (bids, submission status)
- Game completion status
- Autopilot settings

##### Monitoring
- Logs successful round processing
- Tracks timeout occurrences
- Records error events
- Maintains processing statistics

### Administrative Controls

#### toggleAutopilot

A Firebase Cloud Function that controls automated game progression.

```typescript
export const toggleAutopilot = functions.https.onCall(
  async (data: { gameId: string; enabled: boolean }, context)
)
```

##### Security
- Restricted to admin users
- Authenticated access only

##### Input Parameters
- `gameId`: String - Target game identifier
- `enabled`: Boolean - Autopilot state flag

##### Database Updates
Modifies the following structure:
```
games/{gameId}/gameState/autopilot: {
  enabled: boolean,
  lastUpdateTime: number | null
}
```

##### Return Value
```typescript
{
  success: boolean,
  message: string
}
```

##### Error Handling
- Permission validation
- Operation logging
- Error event tracking

### Monitoring System

Both components integrate with AutopilotMonitor for comprehensive event logging:
- Success/failure status
- Operation timestamps
- Detailed event data
- Error information
- Performance metrics

### Implementation Details

#### Firebase Integration
- Uses Realtime Database for state management
- Implements atomic updates
- Maintains data consistency
- Supports real-time synchronization

#### Error Management
- Comprehensive error catching
- Detailed error logging
- Appropriate error responses
- Maintains system stability

### Operations

To view function logs, run:

```bash
firebase functions:log
```

To check the cloud functions and schedulers status, run:

https://console.cloud.google.com/cloudscheduler
https://console.cloud.google.com/functions