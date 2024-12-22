import React, { useState } from 'react';
import NameEntry from '../components/User/NameEntry';
import BiddingInterface from '../components/User/BiddingInterface';
import Footer from '../components/Footer';

const PlayPage: React.FC = () => {
  const [playerName, setPlayerName] = useState<string>('');

  return (
    <div className="play-page" style={{ paddingBottom: '50px' }}>
      <h1>ReapBid</h1>
      {!playerName ? (
        <NameEntry onNameSubmit={setPlayerName} />
      ) : (
        <BiddingInterface playerName={playerName} />
      )}
      <Footer />
    </div>
  );
};

export default PlayPage;
