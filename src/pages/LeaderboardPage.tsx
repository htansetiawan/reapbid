import React from 'react';
import { Container, Typography, Box, Button } from '@mui/material';
import GlobalLeaderboard from '../components/Admin/GlobalLeaderboard';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1">
          Global Leaderboard
        </Typography>
      </Box>
      <GlobalLeaderboard />
    </Container>
  );
};

export default LeaderboardPage;
