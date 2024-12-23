import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { GameProvider } from './context/GameContext';
import PrivateRoute from './components/Auth/PrivateRoute';
import Login from './components/Auth/Login';
import AdminPage from './pages/AdminPage';
import PlayPage from './pages/PlayPage';
import Navbar from './components/Navigation/Navbar';
import { useAuth } from './context/AuthContext';

// Layout component for protected routes
const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

// Root component to handle auth-based redirects
const Root: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If user is not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is authenticated, redirect to play page
  return <Navigate to="/play" replace />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <GameProvider>
        <Router>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />

            {/* Protected routes */}
            <Route
              path="/admin"
              element={
                <PrivateRoute adminOnly>
                  <ProtectedLayout>
                    <AdminPage />
                  </ProtectedLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/play"
              element={
                <PrivateRoute>
                  <ProtectedLayout>
                    <PlayPage />
                  </ProtectedLayout>
                </PrivateRoute>
              }
            />

            {/* Root route handler */}
            <Route path="/" element={<Root />} />

            {/* Catch all other routes and redirect to root */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </GameProvider>
    </AuthProvider>
  );
};

export default App;
