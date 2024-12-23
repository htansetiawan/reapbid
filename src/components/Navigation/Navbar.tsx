import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { LogoutOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar
          sx={{
            height: 64,
            px: { xs: 2, sm: 3 },
          }}
        >
          {/* Logo */}
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 600,
              color: 'primary.main',
              letterSpacing: '-0.5px',
              flexGrow: 1,
            }}
          >
            ReapBid
          </Typography>

          {/* User Email */}
          {user && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                {user.email}
              </Typography>

              {/* Logout Button */}
              <Button
                variant="outlined"
                color="inherit"
                onClick={handleLogout}
                startIcon={<LogoutOutlined />}
                sx={{
                  textTransform: 'none',
                  borderColor: 'divider',
                  color: 'text.primary',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'background.paper',
                  },
                }}
              >
                {isMobile ? '' : 'Logout'}
              </Button>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
