import React from 'react';
import { useGame } from '../../context/GameContext';
import {
  Button,
} from '@mui/material';

const RivalryTable: React.FC = () => {
  const { gameState, updateRivalries } = useGame();

  // Can modify rivals only when round is 1 and not active
  const canModifyRivals = (!gameState?.isActive && gameState?.currentRound === 1);

  const handleAutoAssignRivals = () => {
    if (!canModifyRivals) {
      console.warn('Rivals can only be assigned in round 1 when the round is not active');
      return;
    }

    const players = Object.keys(gameState?.players || {});
    const newRivalries: Record<string, string[]> = {};
    
    // Initialize all players with empty arrays
    players.forEach(player => {
      newRivalries[player] = [];
    });

    if (players.length < 2) {
      updateRivalries(newRivalries);
      return;
    }

    // Create round-robin pairings
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const player1 = players[i];
        const player2 = players[j];
        newRivalries[player1].push(player2);
        newRivalries[player2].push(player1);
      }
    }

    // If odd number of players, ensure each player has at least one rival
    if (players.length % 2 === 1) {
      const playersWithoutRivals = players.filter(player => newRivalries[player].length === 0);
      playersWithoutRivals.forEach(player => {
        const randomRival = players.find(p => p !== player && newRivalries[p].length < 2);
        if (randomRival) {
          newRivalries[player].push(randomRival);
          newRivalries[randomRival].push(player);
        }
      });
    }
    
    updateRivalries(newRivalries);
  };

  const handleUpdateRival = (player1: string, player2: string, checked: boolean) => {
    if (!canModifyRivals) {
      console.warn('Rivals can only be modified in round 1 when the round is not active');
      return;
    }

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
    
    updateRivalries(currentRivalries);
  };

  const players = Object.keys(gameState?.players || {});
  const rivalries = gameState?.rivalries || {};

  return (
    <div>


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
