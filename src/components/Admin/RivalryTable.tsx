import React from 'react';
import { useGame } from '../../context/GameContext';

const RivalryTable: React.FC = () => {
  const { gameState, updateRivalries } = useGame();

  const handleAutoAssignRivals = () => {
    const players = Object.keys(gameState?.players || {});
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
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
    
    // Handle odd number of players
    if (shuffledPlayers.length % 2 === 1) {
      const lastPlayer = shuffledPlayers[Math.floor(shuffledPlayers.length / 2)];
      const randomPairIndex = Math.floor(Math.random() * Math.floor(shuffledPlayers.length / 2));
      const player1 = shuffledPlayers[randomPairIndex];
      const player2 = shuffledPlayers[shuffledPlayers.length - 1 - randomPairIndex];
      
      newRivalries[lastPlayer].push(player1, player2);
      newRivalries[player1].push(lastPlayer);
      newRivalries[player2].push(lastPlayer);
    }
    
    updateRivalries(newRivalries);
  };

  const handleUpdateRival = (player1: string, player2: string, checked: boolean) => {
    const currentRivalries = { ...(gameState?.rivalries || {}) };
    
    // Ensure all players have an array, even if empty
    Object.keys(gameState?.players || {}).forEach(player => {
      if (!currentRivalries[player]) {
        currentRivalries[player] = [];
      }
    });
    
    if (checked) {
      if (!currentRivalries[player1].includes(player2)) {
        currentRivalries[player1] = [...currentRivalries[player1], player2];
      }
      if (!currentRivalries[player2].includes(player1)) {
        currentRivalries[player2] = [...currentRivalries[player2], player1];
      }
    } else {
      currentRivalries[player1] = currentRivalries[player1].filter(p => p !== player2);
      currentRivalries[player2] = currentRivalries[player2].filter(p => p !== player1);
    }
    
    console.log('RivalryTable - Updating rivalries:', {
      currentRivalries,
      player1,
      player2,
      checked,
      beforeUpdate: gameState?.rivalries
    });
    
    updateRivalries(currentRivalries);
  };

  const players = Object.keys(gameState?.players || {});
  const rivalries = gameState?.rivalries || {};

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <button 
          onClick={handleAutoAssignRivals}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#45a049';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#4CAF50';
          }}
        >
          Auto-Assign Rivals
        </button>
      </div>
      
      <div style={{ 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          backgroundColor: 'white',
        }}>
          <thead>
            <tr style={{ 
              backgroundColor: '#f8f9fa',
              borderBottom: '2px solid #dee2e6'
            }}>
              <th style={{ 
                padding: '12px 20px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#495057'
              }}>
                Player
              </th>
              <th style={{ 
                padding: '12px 20px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#495057'
              }}>
                Rivals
              </th>
            </tr>
          </thead>
          <tbody>
            {players.map((player1, index) => (
              <tr 
                key={player1}
                style={{ 
                  borderBottom: index < players.length - 1 ? '1px solid #dee2e6' : 'none',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                <td style={{ 
                  padding: '12px 20px',
                  color: '#212529',
                  fontWeight: '500'
                }}>
                  {player1}
                </td>
                <td style={{ 
                  padding: '12px 20px',
                  color: '#495057'
                }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {players.filter(player2 => player1 !== player2).map((player2) => (
                      <div
                        key={player2}
                        onClick={() => handleUpdateRival(player1, player2, !rivalries[player1]?.includes(player2))}
                        style={{
                          padding: '4px 12px',
                          backgroundColor: rivalries[player1]?.includes(player2) ? '#e9ecef' : 'transparent',
                          borderRadius: '16px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          border: '1px solid #dee2e6',
                          userSelect: 'none',
                          color: rivalries[player1]?.includes(player2) ? '#212529' : '#6c757d'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = rivalries[player1]?.includes(player2) ? '#dee2e6' : '#f8f9fa';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = rivalries[player1]?.includes(player2) ? '#e9ecef' : 'transparent';
                        }}
                      >
                        {player2}
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RivalryTable;
