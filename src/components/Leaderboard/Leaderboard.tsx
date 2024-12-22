import React from 'react';

interface Player {
  id: string;
  name: string;
  currentBid: number | null;
  roundProfit: number;
  totalProfit: number;
}

const Leaderboard: React.FC = () => {
  // This would typically be passed as props or managed by a global state
  const [players, setPlayers] = React.useState<Player[]>([]);

  return (
    <div className="leaderboard">
      <h2>Leaderboard</h2>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Current Bid</th>
            <th>Round Profit</th>
            <th>Total Profit</th>
          </tr>
        </thead>
        <tbody>
          {players
            .sort((a, b) => b.totalProfit - a.totalProfit)
            .map((player, index) => (
              <tr key={player.id}>
                <td>{index + 1}</td>
                <td>{player.name}</td>
                <td>{player.currentBid !== null ? `$${player.currentBid.toFixed(2)}` : '-'}</td>
                <td>${player.roundProfit.toFixed(2)}</td>
                <td>${player.totalProfit.toFixed(2)}</td>
              </tr>
            ))}
        </tbody>
      </table>
      {players.length === 0 && (
        <p>No players have joined yet.</p>
      )}
    </div>
  );
};

export default Leaderboard;
