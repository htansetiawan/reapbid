import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';

type SortField = 'name' | 'bid' | 'marketShare' | 'profit' | 'totalProfit';
type SortDirection = 'asc' | 'desc';

interface TabProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

interface RoundResult {
  round: number;
  bids: Record<string, number>;
  marketShares: Record<string, number>;
  profits: Record<string, number>;
  timestamp: number;
}

const SortableHeader: React.FC<{
  label: string;
  field: SortField;
  currentSort: { field: SortField; direction: SortDirection };
  onSort: (field: SortField) => void;
}> = ({ label, field, currentSort, onSort }) => {
  const isActive = currentSort.field === field;
  
  return (
    <th 
      onClick={() => onSort(field)}
      style={{ 
        padding: '12px', 
        textAlign: field === 'name' ? 'left' : 'right', 
        borderBottom: '2px solid #dee2e6',
        cursor: 'pointer',
        userSelect: 'none',
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: field === 'name' ? 'flex-start' : 'flex-end' }}>
        {label}
        {isActive && (
          <span style={{ marginLeft: '4px' }}>
            {currentSort.direction === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );
};

const Tab: React.FC<TabProps> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: '10px 20px',
      backgroundColor: isActive ? '#fff' : '#f8f9fa',
      border: '1px solid #dee2e6',
      borderBottom: isActive ? 'none' : '1px solid #dee2e6',
      marginBottom: isActive ? '-1px' : '0',
      cursor: 'pointer',
      color: isActive ? '#495057' : '#6c757d',
      fontWeight: isActive ? 500 : 400,
      borderRadius: '4px 4px 0 0',
      position: 'relative',
      zIndex: isActive ? 1 : 0
    }}
  >
    {label}
  </button>
);

const GameSummaryTable: React.FC = () => {
  const { gameState } = useGame();
  const [activeRound, setActiveRound] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState<{ field: SortField; direction: SortDirection }>({
    field: 'totalProfit',
    direction: 'desc'
  });
  const itemsPerPage = 10;

  console.log('GameSummaryTable render:', {
    currentRound: gameState.currentRound,
    roundHistory: gameState.roundHistory,
    roundHistoryLength: gameState.roundHistory?.length || 0,
    hasGameStarted: gameState.hasGameStarted
  });

  // If there's no round history, show a message
  if (!gameState.roundHistory) {
    console.log('No round history array found');
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
        No rounds completed yet. Round summary will appear here after the first round.
      </div>
    );
  }

  if (gameState.roundHistory.length === 0) {
    console.log('Round history array is empty');
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
        No rounds completed yet. Round summary will appear here after the first round.
      </div>
    );
  }

  console.log('Processing round history:', gameState.roundHistory);

  const handleSort = (field: SortField) => {
    setSort(prevSort => ({
      field,
      direction: prevSort.field === field && prevSort.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
  };

  // Get all unique players across all rounds
  const allPlayers = new Set<string>();
  gameState.roundHistory.forEach(round => {
    Object.keys(round.bids).forEach(player => allPlayers.add(player));
  });

  console.log('GameSummaryTable - allPlayers:', Array.from(allPlayers));

  // Get aggregated data for all rounds
  const aggregatedData = Array.from(allPlayers).reduce((acc, player) => {
    acc[player] = {
      bids: [],
      marketShares: [],
      profits: [],
      totalProfit: 0,
      averageBid: 0,
      averageMarketShare: 0
    };
    gameState.roundHistory.forEach(round => {
      if (round.bids[player] !== undefined) {
        acc[player].bids.push(round.bids[player]);
        acc[player].marketShares.push(round.marketShares[player]);
        acc[player].profits.push(round.profits[player]);
        acc[player].totalProfit += round.profits[player];
      }
    });
    // Calculate averages
    if (acc[player].bids.length > 0) {
      acc[player].averageBid = acc[player].bids.reduce((sum, bid) => sum + bid, 0) / acc[player].bids.length;
      acc[player].averageMarketShare = acc[player].marketShares.reduce((sum, share) => sum + share, 0) / acc[player].marketShares.length;
    }
    return acc;
  }, {} as Record<string, {
    bids: number[];
    marketShares: number[];
    profits: number[];
    totalProfit: number;
    averageBid: number;
    averageMarketShare: number;
  }>);

  console.log('GameSummaryTable - aggregatedData:', aggregatedData);

  const rounds = ['Overall', ...Array.from({ length: gameState.roundHistory.length }, (_, i) => `Round ${i + 1}`)];
  
  const getSortedPlayers = (players: string[], roundData?: RoundResult) => {
    return [...players].sort((a, b) => {
      const multiplier = sort.direction === 'asc' ? 1 : -1;
      
      if (activeRound === 0) {
        // Overall view sorting
        switch (sort.field) {
          case 'name':
            return multiplier * a.localeCompare(b);
          case 'bid':
            return multiplier * (aggregatedData[a].averageBid - aggregatedData[b].averageBid);
          case 'marketShare':
            return multiplier * (aggregatedData[a].averageMarketShare - aggregatedData[b].averageMarketShare);
          case 'profit':
            return multiplier * (aggregatedData[a].profits[aggregatedData[a].profits.length - 1] - 
                               aggregatedData[b].profits[aggregatedData[b].profits.length - 1]);
          case 'totalProfit':
            return multiplier * (aggregatedData[a].totalProfit - aggregatedData[b].totalProfit);
          default:
            return 0;
        }
      } else {
        // Single round view sorting
        if (!roundData) return 0;
        switch (sort.field) {
          case 'name':
            return multiplier * a.localeCompare(b);
          case 'bid':
            return multiplier * ((roundData.bids[a] || 0) - (roundData.bids[b] || 0));
          case 'marketShare':
            return multiplier * ((roundData.marketShares[a] || 0) - (roundData.marketShares[b] || 0));
          case 'profit':
            return multiplier * ((roundData.profits[a] || 0) - (roundData.profits[b] || 0));
          case 'totalProfit':
            return multiplier * (aggregatedData[a].totalProfit - aggregatedData[b].totalProfit);
          default:
            return 0;
        }
      }
    });
  };

  let currentPlayers: string[] = [];
  let totalPages = 1;

  if (activeRound === 0) {
    // Overall view
    const sortedPlayers = getSortedPlayers(Array.from(allPlayers));
    totalPages = Math.ceil(sortedPlayers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    currentPlayers = sortedPlayers.slice(startIndex, endIndex);
  } else {
    // Single round view
    const roundData = gameState.roundHistory[activeRound - 1] || {
      round: activeRound,
      bids: {},
      marketShares: {},
      profits: {},
      timestamp: Date.now()
    };
    const sortedPlayers = getSortedPlayers(Object.keys(roundData.bids), roundData);
    totalPages = Math.ceil(sortedPlayers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    currentPlayers = sortedPlayers.slice(startIndex, endIndex);
  }

  return (
    <div style={{
      backgroundColor: '#fff',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      padding: '20px',
      marginTop: '20px'
    }}>
      <h3 style={{ marginBottom: '20px', color: '#212529' }}>Game Summary</h3>
      
      {/* Tabs */}
      <div style={{ 
        display: 'flex',
        gap: '4px',
        marginBottom: '20px',
        overflowX: 'auto',
        padding: '4px'
      }}>
        {rounds.map((round, index) => (
          <Tab
            key={index}
            label={round}
            isActive={activeRound === index}
            onClick={() => {
              setActiveRound(index);
              setCurrentPage(1);
            }}
          />
        ))}
      </div>

      {/* Summary Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ 
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <SortableHeader
                label="Player"
                field="name"
                currentSort={sort}
                onSort={handleSort}
              />
              <SortableHeader
                label={activeRound === 0 ? 'All Bids' : 'Bid'}
                field="bid"
                currentSort={sort}
                onSort={handleSort}
              />
              <SortableHeader
                label={activeRound === 0 ? 'All Market Shares' : 'Market Share'}
                field="marketShare"
                currentSort={sort}
                onSort={handleSort}
              />
              <SortableHeader
                label={activeRound === 0 ? 'All Profits' : 'Round Profit'}
                field="profit"
                currentSort={sort}
                onSort={handleSort}
              />
              <SortableHeader
                label="Total Profit"
                field="totalProfit"
                currentSort={sort}
                onSort={handleSort}
              />
            </tr>
          </thead>
          <tbody>
            {currentPlayers.map(playerName => {
              if (activeRound === 0) {
                // Overall view
                const playerData = aggregatedData[playerName];
                return (
                  <tr key={playerName}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{playerName}</td>
                    <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>
                      {playerData.bids.map(bid => `$${bid.toFixed(2)}`).join(', ')}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>
                      {playerData.marketShares.map(share => `${(share * 100).toFixed(1)}%`).join(', ')}
                    </td>
                    <td style={{ 
                      padding: '12px', 
                      textAlign: 'right', 
                      borderBottom: '1px solid #dee2e6'
                    }}>
                      {playerData.profits.map(profit => (
                        `${profit >= 0 ? '+' : ''}${profit.toFixed(2)}`
                      )).join(', ')}
                    </td>
                    <td style={{ 
                      padding: '12px', 
                      textAlign: 'right', 
                      borderBottom: '1px solid #dee2e6',
                      color: playerData.totalProfit >= 0 ? '#28a745' : '#dc3545',
                      fontWeight: 'bold'
                    }}>
                      ${playerData.totalProfit.toFixed(2)}
                    </td>
                  </tr>
                );
              } else {
                // Single round view
                const roundData = gameState.roundHistory[activeRound - 1];
                return (
                  <tr key={playerName}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{playerName}</td>
                    <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>
                      ${roundData.bids[playerName]?.toFixed(2) || '-'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>
                      {(roundData.marketShares[playerName] * 100).toFixed(1)}%
                    </td>
                    <td style={{ 
                      padding: '12px', 
                      textAlign: 'right', 
                      borderBottom: '1px solid #dee2e6',
                      color: roundData.profits[playerName] >= 0 ? '#28a745' : '#dc3545'
                    }}>
                      ${roundData.profits[playerName]?.toFixed(2) || '-'}
                    </td>
                    <td style={{ 
                      padding: '12px', 
                      textAlign: 'right', 
                      borderBottom: '1px solid #dee2e6',
                      color: aggregatedData[playerName].totalProfit >= 0 ? '#28a745' : '#dc3545',
                      fontWeight: 'bold'
                    }}>
                      ${aggregatedData[playerName].totalProfit.toFixed(2)}
                    </td>
                  </tr>
                );
              }
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px',
          marginTop: '20px'
        }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '8px 12px',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              backgroundColor: currentPage === 1 ? '#f8f9fa' : '#fff',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            Previous
          </button>
          <span style={{ color: '#6c757d' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '8px 12px',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              backgroundColor: currentPage === totalPages ? '#f8f9fa' : '#fff',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default GameSummaryTable;
