import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import PlayerTrackingTable from './PlayerTrackingTable';
import RivalryTable from './RivalryTable';
import GameSummaryTable from './GameSummaryTable';

interface PlayerStats {
  totalProfit: number;
  avgMarketShare: number;
  avgBid: number;
  bestRound: number;
  bestProfit: number;
  status: string;
  currentBid: string;
}

const AdminDashboard: React.FC = () => {
  const { gameState, startGame, startRound, endCurrentRound, endGame, extendRoundTime, resetGame } = useGame();
  const [totalRounds, setTotalRounds] = useState('5');
  const [roundTimeLimit, setRoundTimeLimit] = useState('60');
  const [minBid, setMinBid] = useState('0');
  const [maxBid, setMaxBid] = useState('100');
  const [costPerUnit, setCostPerUnit] = useState('50');
  const [maxPlayers, setMaxPlayers] = useState('200');
  const [extendTimeAmount, setExtendTimeAmount] = useState('30');
  const [showSummary, setShowSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartGame = () => {
    startGame({
      totalRounds: parseInt(totalRounds),
      roundTimeLimit: parseInt(roundTimeLimit),
      minBid: parseInt(minBid),
      maxBid: parseInt(maxBid),
      costPerUnit: parseInt(costPerUnit),
      maxPlayers: parseInt(maxPlayers)
    });
  };

  const handleExtendTime = () => {
    const amount = parseInt(extendTimeAmount);
    if (!isNaN(amount) && amount > 0) {
      extendRoundTime(amount);
    }
  };

  const handleNextRound = () => {
    if (gameState?.isActive) {
      endCurrentRound();
    } else {
      const playerCount = Object.keys(gameState?.players || {}).length;
      if (playerCount < 2) {
        setError('Cannot start round: At least 2 players are required to start the game');
        return;
      }

      const playerNames = Object.keys(gameState?.players || {});
      const unassignedPlayers = playerNames.filter(player => {
        const rivals = gameState?.rivalries?.[player] || [];
        return rivals.length === 0;
      });

      if (unassignedPlayers.length > 0) {
        setError(`Cannot start round: The following players don't have rivals assigned: ${unassignedPlayers.join(', ')}`);
        return;
      }
      setError(null);
      startRound();
    }
  };

  const handleStartRound = () => {
    const playerCount = Object.keys(gameState?.players || {}).length;
    if (playerCount < 2) {
      setError(`Cannot start round: Need at least 2 players (currently have ${playerCount})`);
      return;
    }

    if (gameState?.isEnded) {
      setError('Game has ended. Cannot start new round.');
      return;
    }

    if (gameState?.isActive) {
      setError('Cannot start new round while current round is active.');
      return;
    }

    if ((gameState?.currentRound ?? 0) >= (gameState?.totalRounds ?? 0)) {
      setError('Maximum rounds reached. Cannot start new round.');
      return;
    }

    if ((gameState?.currentRound ?? 0) === 0) {
      startRound();
      return;
    }

    const playersWithoutRivals = Object.keys(gameState?.players || {}).filter(
      playerName => !(gameState?.rivalries?.[playerName]?.length ?? 0)
    );

    if (playersWithoutRivals.length > 0) {
      setError(`Cannot start round: The following players don't have rivals assigned: ${playersWithoutRivals.join(', ')}`);
      return;
    }

    startRound();
  };

  const handleEndGame = () => {
    if (window.confirm('Are you sure you want to end the game? This will end the current round and show final statistics to all players.')) {
      if (gameState?.isActive) {
        endCurrentRound();
      }
      endGame();
      setShowSummary(true);
    }
  };

  const calculatePlayerStats = () => {
    const stats: Record<string, PlayerStats> = {};
    const players = Object.entries(gameState?.players || {});

    players.forEach(([playerId, player]) => {
      const currentBid = gameState?.roundBids?.[playerId];
      const roundHistory = gameState?.roundHistory || [];
      
      // Calculate profits and market shares from round history
      const roundData = roundHistory.map(round => ({
        profit: round.profits?.[playerId] || 0,
        marketShare: round.marketShares?.[playerId] || 0,
        bid: round.bids?.[playerId] || 0
      }));

      const totalProfit = roundData.reduce((sum: number, round) => sum + round.profit, 0);
      const avgMarketShare = roundData.length > 0
        ? roundData.reduce((sum: number, round) => sum + round.marketShare, 0) / roundData.length
        : 0;

      // Find the best round (highest profit)
      let bestRound = 0;
      let bestProfit = -Infinity;
      roundData.forEach((round, index: number) => {
        if (round.profit > bestProfit) {
          bestProfit = round.profit;
          bestRound = index + 1;
        }
      });

      stats[playerId] = {
        totalProfit,
        avgMarketShare,
        avgBid: currentBid || 0,
        bestRound,
        bestProfit,
        status: player.isTimedOut ? 'Timed Out' : 
                player.hasSubmittedBid ? 'Submitted' : 'Waiting',
        currentBid: currentBid !== undefined ? `$${currentBid.toFixed(2)}` : '-'
      };
    });

    return stats;
  };

  const isLastRound = (gameState?.currentRound ?? 0) >= (gameState?.totalRounds ?? 0);
  const isFinalRound = (gameState?.currentRound ?? 0) === (gameState?.totalRounds ?? 0);
  const isGameEnded = gameState?.isEnded;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', paddingBottom: '50px' }}>
      <div style={{ padding: '20px' }}>
        {/* Header Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h1>Admin Dashboard</h1>
          <div>
            {/* Round Controls */}
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              {!gameState?.hasGameStarted ? (
                <button
                  onClick={handleStartGame}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Start Game
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Game Configuration Form */}
        {!gameState?.hasGameStarted && (
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h2 style={{ marginBottom: '20px' }}>Game Configuration</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Total Rounds:</label>
                <input
                  type="number"
                  value={totalRounds}
                  onChange={(e) => setTotalRounds(e.target.value)}
                  style={{
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Round Time Limit (seconds):</label>
                <input
                  type="number"
                  value={roundTimeLimit}
                  onChange={(e) => setRoundTimeLimit(e.target.value)}
                  style={{
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Minimum Bid:</label>
                <input
                  type="number"
                  value={minBid}
                  onChange={(e) => setMinBid(e.target.value)}
                  style={{
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Maximum Bid:</label>
                <input
                  type="number"
                  value={maxBid}
                  onChange={(e) => setMaxBid(e.target.value)}
                  style={{
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Cost Per Unit:</label>
                <input
                  type="number"
                  value={costPerUnit}
                  onChange={(e) => setCostPerUnit(e.target.value)}
                  style={{
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px' }}>Maximum Players:</label>
                <input
                  type="number"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(e.target.value)}
                  style={{
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Game Status Display */}
        {gameState?.hasGameStarted && (
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h2 style={{ marginBottom: '20px' }}>Game Status</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              <div>
                <strong>Current Round:</strong> {(gameState?.currentRound ?? 0) === 0 ? 'Round 1 (Not Started)' : (gameState?.currentRound ?? 0)}
              </div>
              <div>
                <strong>Total Rounds:</strong> {(gameState?.totalRounds ?? 0)}
              </div>
              <div>
                <strong>Round Status:</strong> {(gameState?.isActive ? 'Active' : 'Inactive')}
              </div>
              <div>
                <strong>Players:</strong> {Object.keys(gameState?.players || {}).length} / {(gameState?.maxPlayers ?? 0)}
              </div>
            </div>
          </div>
        )}

        {/* Game Controls */}
        {gameState?.hasGameStarted && (
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            marginBottom: '30px',
            border: '1px solid #dee2e6',
            borderRadius: '8px'
          }}>
            {error && (
              <div style={{ color: 'red', marginBottom: '1rem' }}>
                {error}
              </div>
            )}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              marginBottom: '15px'
            }}>
              <div style={{
                fontSize: '16px',
                color: '#495057',
                fontWeight: 500
              }}>
                {(gameState?.isEnded ? (
                  <span style={{ color: '#dc3545' }}>Game Ended</span>
                ) : (
                  <>
                    Round {(gameState?.currentRound ?? 0)} of {(gameState?.totalRounds ?? 0)}
                    {(isFinalRound && (
                      <span style={{ 
                        color: '#dc3545',
                        marginLeft: '10px',
                        fontSize: '14px',
                        fontWeight: 500
                      }}>
                        (Final Round)
                      </span>
                    ))}
                  </>
                ))}
              </div>
              {!gameState?.isEnded && (
                <div style={{
                  fontSize: '16px',
                  color: (gameState?.isActive ? '#28a745' : '#6c757d'),
                  fontWeight: 500
                }}>
                  {(gameState?.isActive ? 'Round in Progress' : 'Round Ended')}
                </div>
              )}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}>
                {!gameState?.isEnded && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {!gameState?.isActive && (
                      <button
                        onClick={handleStartRound}
                        disabled={(isLastRound && !gameState?.isActive)}
                        style={{
                          padding: '12px 24px',
                          backgroundColor: (isLastRound && !gameState?.isActive ? '#6c757d' : '#28a745'),
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: (isLastRound && !gameState?.isActive ? 'not-allowed' : 'pointer'),
                          fontSize: '14px'
                        }}
                      >
                        Start Next Round
                      </button>
                    )}
                    {(gameState?.isActive && (
                      <button
                        onClick={endCurrentRound}
                        disabled={Object.keys(gameState?.players || {}).length === 0}
                        style={{
                          padding: '12px 24px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: Object.keys(gameState?.players || {}).length === 0 ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          opacity: Object.keys(gameState?.players || {}).length === 0 ? '0.65' : '1'
                        }}
                      >
                        End Round {(gameState?.currentRound ?? 0)}
                      </button>
                    ))}
                  </div>
                )}
                {!gameState?.isEnded && !isFinalRound && (
                  <button
                    onClick={handleEndGame}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    End Game Early
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Player Tracking Table */}
        {gameState?.hasGameStarted && (
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginBottom: '20px' }}>Player Tracking</h3>
            <PlayerTrackingTable playerStats={calculatePlayerStats()} />
          </div>
        )}

        {/* Rivalry Table */}
        {gameState?.hasGameStarted && (
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            opacity: (gameState?.currentRound ?? 0) > 0 ? 0.7 : 1,
            pointerEvents: (gameState?.currentRound ?? 0) > 0 ? 'none' : 'auto'
          }}>
            <div style={{ position: 'relative' }}>
              {(gameState?.currentRound ?? 0) > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  padding: '10px 20px',
                  borderRadius: '4px',
                  zIndex: 1
                }}>
                  Rivals cannot be modified after game starts
                </div>
              )}
              <h3 style={{ marginBottom: '20px' }}>Rivalries</h3>
              <RivalryTable />
            </div>
          </div>
        )}

        {/* Game Summary */}
        {gameState?.hasGameStarted && (
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            marginTop: '30px'
          }}>
            <GameSummaryTable />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
