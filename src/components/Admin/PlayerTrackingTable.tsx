import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';

interface PlayerStats {
  totalProfit: number;
  avgMarketShare: number;
  avgBid: number;
  bestRound: number;
  bestProfit: number;
  status: string;
  currentBid: string;
}

interface PlayerTrackingTableProps {
  playerStats: Record<string, PlayerStats>;
}

const cellStyle = {
  padding: '12px 20px',
  borderBottom: '1px solid #dee2e6',
  fontSize: '14px',
  whiteSpace: 'nowrap' as const
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Submitted':
      return '#28a745';  // Green for submitted
    case 'Timed Out':
      return '#dc3545';  // Red for timed out
    case 'Active':
      return '#ffc107';  // Yellow for active
    default:
      return '#6c757d';  // Grey for unknown status
  }
};

const getStatusStyle = (status: string) => ({
  ...cellStyle,
  color: '#fff',
  backgroundColor: getStatusColor(status),
  borderRadius: '4px',
  padding: '4px 8px',
  textAlign: 'center' as const,
  display: 'inline-block',
  minWidth: '80px'
});

const ROWS_PER_PAGE = 10;

const PlayerTrackingTable: React.FC<PlayerTrackingTableProps> = ({ playerStats }) => {
  const { gameState, unregisterPlayer, timeoutPlayer, unTimeoutPlayer } = useGame();
  const [currentPage, setCurrentPage] = useState(1);
  
  const players = Object.entries(playerStats);
  const totalPages = Math.ceil(players.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const displayedPlayers = players.slice(startIndex, startIndex + ROWS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleUnregister = (playerName: string) => {
    if (window.confirm(`Are you sure you want to unregister ${playerName}?`)) {
      unregisterPlayer(playerName);
    }
  };

  const handleTimeout = (playerName: string) => {
    if (window.confirm(`Are you sure you want to timeout ${playerName}?`)) {
      timeoutPlayer(playerName);
    }
  };

  const handleUnTimeout = (playerName: string) => {
    if (window.confirm(`Are you sure you want to remove timeout for ${playerName}?`)) {
      unTimeoutPlayer(playerName);
    }
  };

  if (players.length === 0) {
    return (
      <div style={{
        padding: '0 20px 20px',
        textAlign: 'center',
        color: '#6c757d'
      }}>
        No players registered
      </div>
    );
  }

  return (
    <>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ 
          width: '100%',
          borderCollapse: 'collapse'
        }}>
          <thead>
            <tr style={{
              backgroundColor: '#e9ecef'
            }}>
              <th style={{ ...cellStyle, textAlign: 'left', width: '15%' }}>Player</th>
              <th style={{ ...cellStyle, width: '10%' }}>Status</th>
              <th style={{ ...cellStyle, width: '15%' }}>Current Bid</th>
              <th style={{ ...cellStyle, width: '15%' }}>Total Profit</th>
              <th style={{ ...cellStyle, width: '15%' }}>Avg Market Share</th>
              <th style={{ ...cellStyle, width: '15%' }}>Best Round</th>
              <th style={{ ...cellStyle, width: '15%' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedPlayers.map(([playerId, stats]) => (
              <tr key={playerId} style={{
                backgroundColor: 'white'
              }}>
                <td style={{ ...cellStyle, fontWeight: 500 }}>{playerId}</td>
                <td style={cellStyle}>
                  <div style={getStatusStyle(stats.status)}>
                    {stats.status}
                  </div>
                </td>
                <td style={cellStyle}>{stats.currentBid}</td>
                <td style={cellStyle}>${stats.totalProfit.toFixed(2)}</td>
                <td style={cellStyle}>{(stats.avgMarketShare * 100).toFixed(1)}%</td>
                <td style={cellStyle}>{stats.bestRound}</td>
                <td style={cellStyle}>
                  <div style={{ 
                    display: 'flex',
                    gap: '8px'
                  }}>
                    {stats.status === 'Timed Out' ? (
                      <button
                        onClick={() => handleUnTimeout(playerId)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Un-timeout
                      </button>
                    ) : (
                      <button
                        onClick={() => handleTimeout(playerId)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Timeout
                      </button>
                    )}
                    <button
                      onClick={() => handleUnregister(playerId)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Unregister
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          padding: '20px'
        }}>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              padding: '6px 12px',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              backgroundColor: currentPage === 1 ? '#f8f9fa' : 'white',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              style={{
                padding: '6px 12px',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                backgroundColor: currentPage === page ? '#0d6efd' : 'white',
                color: currentPage === page ? 'white' : '#212529',
                cursor: 'pointer'
              }}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{
              padding: '6px 12px',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              backgroundColor: currentPage === totalPages ? '#f8f9fa' : 'white',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Next
          </button>
        </div>
      )}
    </>
  );
};

export default PlayerTrackingTable;
