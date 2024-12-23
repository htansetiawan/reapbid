import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Container,
  useTheme,
  useMediaQuery,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Google as GoogleIcon,
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login: React.FC = () => {
  const { user, loading, error: authError, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  React.useEffect(() => {
    if (user && !loading) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, location]);

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      await signInWithGoogle();
    } catch (err) {
      setError('Failed to sign in with Google. Please try again.');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError('');
      setIsSubmitting(true);
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="background.default"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth={false} disableGutters>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          p: 2,
        }}
      >
        <Card
          elevation={3}
          sx={{
            width: '100%',
            maxWidth: 400,
            borderRadius: 2,
            bgcolor: 'background.paper',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* Logo */}
            <Typography
              variant="h4"
              component="div"
              align="center"
              sx={{
                fontWeight: 600,
                color: 'primary.main',
                mb: 3,
                letterSpacing: '-0.5px',
              }}
            >
              ReapBid
            </Typography>

            {/* Welcome Text */}
            <Typography
              variant="h5"
              align="center"
              gutterBottom
              sx={{ fontWeight: 500 }}
            >
              {isSignUp ? 'Create Account' : 'Welcome back'}
            </Typography>
            <Typography
              variant="body2"
              align="center"
              color="text.secondary"
              sx={{ mb: 4 }}
            >
              {isSignUp
                ? 'Sign up to join the bidding platform'
                : 'Sign in to access the bidding platform'}
            </Typography>

            {/* Error Alert */}
            {(error || authError) && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error || authError}
              </Alert>
            )}

            {/* Email & Password Form */}
            <form onSubmit={handleEmailAuth}>
              <TextField
                fullWidth
                label="Email address"
                variant="outlined"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                fullWidth
                label="Password"
                variant="outlined"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 3 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Submit Button */}
              <Button
                fullWidth
                variant="contained"
                size="large"
                type="submit"
                disabled={isSubmitting}
                sx={{
                  mb: 2,
                  height: 48,
                  textTransform: 'none',
                  fontSize: '1rem',
                }}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : isSignUp ? (
                  'Sign up'
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            {/* Toggle Sign Up/In */}
            <Box sx={{ mb: 3 }}>
              <Button
                fullWidth
                color="primary"
                onClick={() => setIsSignUp(!isSignUp)}
                sx={{ textTransform: 'none' }}
              >
                {isSignUp
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"}
              </Button>
            </Box>

            {/* Divider */}
            <Box sx={{ my: 2, position: 'relative' }}>
              <Divider>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    px: 2,
                    bgcolor: 'background.paper',
                  }}
                >
                  or continue with
                </Typography>
              </Divider>
            </Box>

            {/* Google Sign In */}
            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={handleGoogleSignIn}
              startIcon={<GoogleIcon />}
              sx={{
                height: 48,
                textTransform: 'none',
                fontSize: '1rem',
                borderColor: 'divider',
                color: 'text.primary',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'background.paper',
                },
              }}
            >
              Google
            </Button>

            {/* Terms */}
            <Typography
              variant="caption"
              align="center"
              color="text.secondary"
              sx={{ mt: 3, display: 'block' }}
            >
              By signing in, you agree to our{' '}
              <Typography
                component="a"
                variant="caption"
                href="#"
                sx={{
                  color: 'primary.main',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Terms of Service
              </Typography>{' '}
              and{' '}
              <Typography
                component="a"
                variant="caption"
                href="#"
                sx={{
                  color: 'primary.main',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Privacy Policy
              </Typography>
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Login;
