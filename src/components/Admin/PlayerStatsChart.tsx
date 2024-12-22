import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface PlayerStatsChartProps {
  playerName: string;
  roundHistory: Array<{
    round: number;
    bids: Record<string, number>;
    marketShares: Record<string, number>;
    profits: Record<string, number>;
  }>;
  rivals: string[];
}

const PlayerStatsChart: React.FC<PlayerStatsChartProps> = ({ playerName, roundHistory, rivals }) => {
  const labels = roundHistory.map(round => `Round ${round.round}`);

  const commonOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  // Bids Chart Data
  const bidsData = {
    labels,
    datasets: [
      {
        label: `${playerName}`,
        data: roundHistory.map(round => round.bids[playerName] || 0),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
      ...rivals.map(rival => ({
        label: rival,
        data: roundHistory.map(round => round.bids[rival] || 0),
        borderColor: 'rgba(75, 192, 192, 0.5)',
        borderDash: [5, 5],
        tension: 0.1,
      })),
    ],
  };

  const bidsOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: true,
        text: 'Bids Over Rounds',
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: 'Bid Amount',
        },
      },
    },
  };

  // Market Share Chart Data
  const marketShareData = {
    labels,
    datasets: [
      {
        label: `${playerName}`,
        data: roundHistory.map(round => (round.marketShares[playerName] || 0) * 100),
        borderColor: 'rgb(153, 102, 255)',
        tension: 0.1,
      },
      ...rivals.map(rival => ({
        label: rival,
        data: roundHistory.map(round => (round.marketShares[rival] || 0) * 100),
        borderColor: 'rgba(153, 102, 255, 0.5)',
        borderDash: [5, 5],
        tension: 0.1,
      })),
    ],
  };

  const marketShareOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: true,
        text: 'Market Share Over Rounds',
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: 'Market Share (%)',
        },
        min: 0,
        max: 100,
      },
    },
  };

  // Profits Chart Data
  const profitsData = {
    labels,
    datasets: [
      {
        label: `${playerName}`,
        data: roundHistory.map(round => round.profits[playerName] || 0),
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
      },
      ...rivals.map(rival => ({
        label: rival,
        data: roundHistory.map(round => round.profits[rival] || 0),
        borderColor: 'rgba(255, 99, 132, 0.5)',
        borderDash: [5, 5],
        tension: 0.1,
      })),
    ],
  };

  const profitsOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: true,
        text: 'Profits Over Rounds',
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: 'Profit',
        },
      },
    },
  };

  return (
    <div style={{ 
      width: '100%', 
      marginTop: '20px',
      backgroundColor: '#fff',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ margin: '0 0 20px 0', textAlign: 'center' }}>
        Statistics for {playerName} vs Rivals
      </h3>
      
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        overflowX: 'auto',
        padding: '10px 0'
      }}>
        <div style={{ 
          flex: '1',
          minWidth: '400px',
          height: '400px',
          padding: '10px',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px'
        }}>
          <Line options={bidsOptions} data={bidsData} />
        </div>
        
        <div style={{ 
          flex: '1',
          minWidth: '400px',
          height: '400px',
          padding: '10px',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px'
        }}>
          <Line options={marketShareOptions} data={marketShareData} />
        </div>
        
        <div style={{ 
          flex: '1',
          minWidth: '400px',
          height: '400px',
          padding: '10px',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px'
        }}>
          <Line options={profitsOptions} data={profitsData} />
        </div>
      </div>
    </div>
  );
};

export default PlayerStatsChart;
