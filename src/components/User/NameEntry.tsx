import React, { useState } from 'react';

interface NameEntryProps {
  onNameSubmit: (name: string) => void;
}

const NameEntry: React.FC<NameEntryProps> = ({ onNameSubmit }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }

    onNameSubmit(name.trim());
  };

  return (
    <div className="name-entry">
      <h2>Enter Your Name</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="Your name"
            maxLength={30}
          />
        </div>
        {error && <div className="error">{error}</div>}
        <button type="submit">Join Game</button>
      </form>
    </div>
  );
};

export default NameEntry;
