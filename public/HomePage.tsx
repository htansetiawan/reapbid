import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SchoolIcon from '@mui/icons-material/School';
import GroupsIcon from '@mui/icons-material/Groups';
import ScienceIcon from '@mui/icons-material/Science';

const HomePage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Hero Section */}
      <Box 
        sx={{ 
          bgcolor: 'primary.main',
          color: 'white',
          pt: { xs: 8, md: 12 },
          pb: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                <Typography 
                  variant="h2" 
                  component="h1" 
                  sx={{ 
                    fontWeight: 700,
                    mb: 2,
                    fontSize: { xs: '2.5rem', md: '3.5rem' }
                  }}
                >
                  ReapBid
                </Typography>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    mb: 4,
                    opacity: 0.9,
                    lineHeight: 1.5
                  }}
                >
                  Explore Game Theory in Action: Experience Repeated Bertrand Competition
                </Typography>
                <Button
                  component={Link}
                  to="/play"
                  variant="contained"
                  size="large"
                  color="secondary"
                  startIcon={<PlayArrowIcon />}
                  sx={{ 
                    mr: 2,
                    mb: { xs: 2, sm: 0 },
                    fontSize: '1.1rem',
                    py: 1.5,
                    px: 4,
                    textTransform: 'none',
                    bgcolor: 'white',
                    color: 'primary.main',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.9)'
                    }
                  }}
                >
                  Start Simulation
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6} sx={{ textAlign: 'center' }}>
              {/* Placeholder for logo/hero image */}
              <Box
                component="img"
                src="/reap192.png"
                alt="ReapBid"
                sx={{
                  maxWidth: '80%',
                  height: 'auto',
                  borderRadius: 2,
                  boxShadow: 0
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Video Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography 
          variant="h3" 
          component="h2" 
          align="center" 
          sx={{ mb: 6, fontWeight: 600 }}
        >
          See It in Action
        </Typography>
        <Box 
          sx={{ 
            position: 'relative',
            paddingBottom: '56.25%', // 16:9 aspect ratio
            height: 0,
            overflow: 'hidden',
            maxWidth: '100%',
            borderRadius: 2,
            boxShadow: 3,
            mb: 8
          }}
        >
          <iframe
            src="https://www.youtube.com/watch?v=tEPNqMP1I0M"
            title="ReapBid Demo"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            }}
          />
        </Box>
      </Container>

      {/* Description Section */}
      <Box sx={{ bgcolor: 'white', py: 8 }}>
        <Container maxWidth="lg">
          <Typography 
            variant="h4" 
            component="h2" 
            align="center" 
            sx={{ mb: 6, fontWeight: 600 }}
          >
            Understanding Market Dynamics
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              fontSize: '1.1rem',
              lineHeight: 1.8,
              maxWidth: '800px',
              mx: 'auto',
              px: 2,
              textAlign: 'justify'
            }}
          >
            In a standard (one-shot) Bertrand competition, firms with the same cost structure race to the bottom by setting prices equal to marginal cost, p=c. However, when competition is repeated over many rounds (or infinitely), the outcome can shift. Firms can potentially sustain higher prices (tacit collusion) by threatening to punish those who undercut.
            <br /><br />
            ReapBid demonstrates this dynamic by running simulations of repeated interactions under various assumptions (discount factors, number of players, strategies, punishment rules, etc.). It's designed for researchers, students, and anyone curious about game-theoretic models of competition.
          </Typography>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', boxShadow: 2 }}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <SchoolIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Educational Tool
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Perfect for teaching game theory concepts in economics and business courses
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', boxShadow: 2 }}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <GroupsIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Multi-Player Support
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Simulate real-world market dynamics with multiple participants
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', boxShadow: 2 }}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <ScienceIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Research Platform
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Conduct experiments and gather data on competitive behavior
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Call to Action */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" component="h2" sx={{ mb: 3 }}>
              Ready to Experience Game Theory?
            </Typography>
            <Button
              component={Link}
              to="/play"
              variant="contained"
              size="large"
              color="secondary"
              sx={{ 
                fontSize: '1.1rem',
                py: 1.5,
                px: 4,
                textTransform: 'none',
                bgcolor: 'white',
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.9)'
                }
              }}
            >
              Start Now
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;
