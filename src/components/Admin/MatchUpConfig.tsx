import React, { useState } from 'react';

interface Player {
  id: string;
  name: string;
}

interface MatchUp {
  id: string;
  players: Player[];
}

const MatchUpConfig: React.FC = () => {
  const [matchUps, setMatchUps] = useState<MatchUp[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  const createMatchUp = () => {
    const newMatchUp: MatchUp = {
      id: Date.now().toString(),
      players: []
    };
    setMatchUps([...matchUps, newMatchUp]);
  };

  const addPlayerToMatchUp = (matchUpId: string, player: Player) => {
    setMatchUps(prevMatchUps =>
      prevMatchUps.map(matchUp =>
        matchUp.id === matchUpId
          ? { ...matchUp, players: [...matchUp.players, player] }
          : matchUp
      )
    );
  };

  const removePlayerFromMatchUp = (matchUpId: string, playerId: string) => {
    setMatchUps(prevMatchUps =>
      prevMatchUps.map(matchUp =>
        matchUp.id === matchUpId
          ? {
              ...matchUp,
              players: matchUp.players.filter(p => p.id !== playerId)
            }
          : matchUp
      )
    );
  };

  return (
    <div className="match-up-config">
      <h2>Match-Up Configuration</h2>
      <button onClick={createMatchUp}>Create New Match-Up</button>
      
      <div className="match-ups-list">
        {matchUps.map(matchUp => (
          <div key={matchUp.id} className="match-up">
            <h3>Match-Up {matchUp.id}</h3>
            <div className="players-list">
              {matchUp.players.map(player => (
                <div key={player.id} className="player">
                  {player.name}
                  <button
                    onClick={() => removePlayerFromMatchUp(matchUp.id, player.id)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <select
              onChange={(e) => {
                const player = players.find(p => p.id === e.target.value);
                if (player) {
                  addPlayerToMatchUp(matchUp.id, player);
                }
              }}
            >
              <option value="">Add Player...</option>
              {players.map(player => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MatchUpConfig;
