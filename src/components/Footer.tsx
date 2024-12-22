import React from 'react';

const Footer: React.FC = () => (
  <div style={{
    position: 'fixed',
    bottom: 0,
    left: 0,
    width: '100%',
    backgroundColor: '#f8f9fa',
    borderTop: '1px solid #dee2e6',
    padding: '10px 0',
    textAlign: 'center',
    fontSize: '14px',
    color: '#6c757d'
  }}>
    Powered by <span style={{ fontWeight: 'bold' }}>AI Kitchen</span>
  </div>
);

export default Footer;
