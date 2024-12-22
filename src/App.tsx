import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminPage from './pages/AdminPage';
import PlayPage from './pages/PlayPage';
import { GameProvider } from './context/GameContext';

const App: React.FC = () => {
  return (
    <GameProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/play" element={<PlayPage />} />
            <Route path="/" element={<PlayPage />} />
          </Routes>
        </div>
      </Router>
    </GameProvider>
  );
};

export default App;
