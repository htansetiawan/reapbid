import React from 'react';
import { useGame } from '../../context/GameContext';

const RivalryTable: React.FC = () => {
  const { gameState, updateRivalries } = useGame();

  const handleAutoAssignRivals = () => {
    // Get all players
    const players = Object.keys(gameState.players);
    
    // Shuffle the players array
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
    
    // Create new rivalries object
    const newRivalries: Record<string, string[]> = {};
    
    // Initialize all players with empty arrays
    shuffledPlayers.forEach(player => {
      newRivalries[player] = [];
    });
    
    // Pair players: first with last, second with second-to-last, etc.
    for (let i = 0; i < Math.floor(shuffledPlayers.length / 2); i++) {
      const player1 = shuffledPlayers[i];
      const player2 = shuffledPlayers[shuffledPlayers.length - 1 - i];
      newRivalries[player1].push(player2);
      newRivalries[player2].push(player1);
    }
    
    // Handle odd number of players by pairing the last one with a random existing pair
    if (shuffledPlayers.length % 2 === 1) {
      const lastPlayer = shuffledPlayers[Math.floor(shuffledPlayers.length / 2)];
      // Pick a random player from the first half of the shuffled array
      const randomIndex = Math.floor(Math.random() * Math.floor(shuffledPlayers.length / 2));
      const randomPlayer = shuffledPlayers[randomIndex];
      const randomPlayerRival = newRivalries[randomPlayer][0]; // Get the first rival
      
      // Create a three-way rivalry
      newRivalries[lastPlayer].push(randomPlayer);
      newRivalries[randomPlayer].push(lastPlayer);
      newRivalries[randomPlayerRival].push(lastPlayer);
      newRivalries[lastPlayer].push(randomPlayerRival);
    }
    
    // Update the rivalries in the game state
    updateRivalries(newRivalries);
  };

  return (
    <>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ 
          borderCollapse: 'collapse',
          backgroundColor: 'white',
          borderRadius: '4px'
        }}>
          <thead>
            <tr style={{
              backgroundColor: '#f8f9fa'
            }}>
              <th style={{ 
                padding: '12px 20px', 
                borderBottom: '2px solid #dee2e6', 
                textAlign: 'left' 
              }}>
                Player
              </th>
              <th style={{ 
                padding: '12px 20px', 
                borderBottom: '2px solid #dee2e6', 
                textAlign: 'left' 
              }}>
                Rivals
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(gameState.players).map(([playerId]) => (
              <tr key={playerId} style={{
                backgroundColor: 'white'
              }}>
                <td style={{ 
                  padding: '12px 20px', 
                  borderBottom: '1px solid #dee2e6' 
                }}>
                  {playerId}
                </td>
                <td style={{ 
                  padding: '12px 20px', 
                  borderBottom: '1px solid #dee2e6' 
                }}>
                  {(gameState.rivalries[playerId] || []).join(', ') || 'No rivals assigned'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ 
        padding: '20px', 
        display: 'flex', 
        justifyContent: 'flex-end' 
      }}>
        <button
          onClick={handleAutoAssignRivals}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Auto-Assign Rivals
        </button>
      </div>
    </>
  );
};

export default RivalryTable;
