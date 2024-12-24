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
  Paper,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SchoolIcon from '@mui/icons-material/School';
import GroupsIcon from '@mui/icons-material/Groups';
import ScienceIcon from '@mui/icons-material/Science';
import InfoIcon from '@mui/icons-material/Info';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';

const HomePage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: '#ffffff',
      overflowX: 'hidden'
    }}>
      {/* Hero Section with Gradient Background */}
      <Box sx={{ 
        position: 'relative',
        background: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)',
        color: 'white',
        pt: { xs: 6, md: 8 },
        pb: { xs: 6, md: 8 },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("/pattern.png")',
          opacity: 0.1,
          zIndex: 1
        }
      }}>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Box sx={{ 
            textAlign: 'center',
            animation: 'fadeIn 1s ease-out'
          }}>
            <Box 
              component="img"
              src="/reap192_cropped.png"
              alt="ReapBid"
              sx={{
                width: '372px',
                height: 'auto',
                mb: 0,
                display: 'inline-block'
              }}
            />
            <Typography 
              variant="h4" 
              sx={{ 
                mb: 4,
                opacity: 0.9,
                fontWeight: 300,
                lineHeight: 1.6,
                maxWidth: '800px',
                mx: 'auto'
              }}
            >
              Explore the Dynamics of Repeated Competition
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                component={Link}
                to="/play"
                variant="contained"
                size="large"
                sx={{ 
                  py: 1.5,
                  px: 4,
                  bgcolor: '#ffffff',
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.9)'
                  }
                }}
              >
                Get Started
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{ 
                  py: 1.5,
                  px: 4,
                  color: '#ffffff',
                  borderColor: '#ffffff',
                  '&:hover': {
                    borderColor: 'rgba(255,255,255,0.9)',
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
                href="#learn-more"
              >
                Learn More
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Video Section */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8, position: 'relative', zIndex: 3 }}>
        <Box sx={{ 
          position: 'relative',
          pt: '56.25%',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          bgcolor: '#000'
        }}>
          <iframe
            src="https://www.youtube.com/embed/4nDFIlrG6MQ"
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

      {/* What is ReapBid Section */}
      <Container maxWidth="lg" sx={{ py: 10 }} id="learn-more">
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
              What is ReapBid?
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'text.secondary', mb: 3 }}>
              ReapBid is a cutting-edge simulation platform designed to unlock the complexities of competitive market dynamics. At its core, ReapBid models repeated Bertrand competition, where firms traditionally race to the bottom by pricing at marginal cost. However, in long-term or infinite interactions, something fascinating happens: firms can sustain higher prices through tacit collusion, leveraging strategic punishments to enforce cooperation.
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'text.secondary' }}>
              ReapBid brings these game-theoretic principles to life, allowing users to explore how strategies evolve across repeated interactions. With customizable simulations for variables like discount factors, the number of players, and punishment rules, ReapBid empowers researchers, educators, and curious innovators to push the boundaries of economic and behavioral insights.
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ 
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -20,
                right: -20,
                width: '100%',
                height: '100%',
                bgcolor: 'primary.main',
                opacity: 0.1,
                borderRadius: 4,
                zIndex: 0
              }
            }}>
              <Paper elevation={0} sx={{ 
                p: 4, 
                borderRadius: 4,
                bgcolor: '#f8f9fa',
                position: 'relative',
                zIndex: 1
              }}>
                <Grid container spacing={3}>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <AutoGraphIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                      <Typography variant="h6">Dynamic Analysis</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <GroupsIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                      <Typography variant="h6">Multi-Player</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <SchoolIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                      <Typography variant="h6">Educational</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <ScienceIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                      <Typography variant="h6">Research</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Features Section */}
      <Box sx={{ bgcolor: '#f8f9fa', py: 10 }}>
        <Container maxWidth="lg">
          <Typography 
            variant="h3" 
            align="center" 
            gutterBottom 
            sx={{ fontWeight: 700, mb: 6 }}
          >
            Why Choose ReapBid?
          </Typography>
          <Grid container spacing={4}>
            {[
              {
                icon: <SchoolIcon sx={{ fontSize: 40 }} />,
                title: 'Dynamic Simulations',
                description: 'Run simulations with customizable parameters for in-depth analysis'
              },
              {
                icon: <ScienceIcon sx={{ fontSize: 40 }} />,
                title: 'Game-Theoretic Insights',
                description: 'Explore strategies, punishment rules, and competitive dynamics'
              },
              {
                icon: <GroupsIcon sx={{ fontSize: 40 }} />,
                title: 'Easy-to-Use Interface',
                description: 'Intuitive design for researchers, students, and enthusiasts'
              }
            ].map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 4,
                    height: '100%',
                    textAlign: 'center',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-8px)'
                    }
                  }}
                >
                  <Box sx={{ color: 'primary.main', mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Call to Action */}
      <Box 
        sx={{ 
          py: 10,
          background: 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)',
          color: 'white',
          textAlign: 'center'
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
            Ready to Experience Game Theory?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            Join researchers and students in exploring competitive dynamics
          </Typography>
          <Button
            component={Link}
            to="/play"
            variant="contained"
            size="large"
            sx={{ 
              py: 2,
              px: 6,
              bgcolor: '#ffffff',
              color: 'primary.main',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.9)'
              }
            }}
          >
            Start Now
          </Button>
        </Container>
      </Box>

      {/* Footer */}
      <Box 
        component="footer" 
        sx={{ 
          py: 3,
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
          textAlign: 'center'
        }}
      >
        <Container maxWidth="lg">
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1
            }}
          >
            Powered by AI Kitchen, incubated at MIT and brought to you by the one and only EMBA26 cohort | (c) 2024.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;
