import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Typography,
  Box,
  CircularProgress,
  IconButton
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { useSession } from '../../context/SessionContext';

interface SessionSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectSession: (sessionId: string) => void;
}

const SessionSelectionDialog: React.FC<SessionSelectionDialogProps> = ({
  open,
  onClose,
  onSelectSession
}) => {
  const { sessions, currentSessionId, isLoading, error, refreshSessions } = useSession();

  const activeSessions = sessions.filter(session => session.status === 'active');

  // Refresh sessions when dialog opens
  useEffect(() => {
    if (open && !isLoading) {
      refreshSessions();
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            Select a Game Session
          </Typography>
          <IconButton 
            onClick={() => refreshSessions()} 
            disabled={isLoading}
            size="small"
          >
            <RefreshIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ 
        maxHeight: '60vh', 
        overflowY: 'auto',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#f1f1f1',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#888',
          borderRadius: '4px',
          '&:hover': {
            background: '#555',
          },
        },
      }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" sx={{ p: 2 }}>
            {error}
          </Typography>
        ) : activeSessions.length === 0 ? (
          <Typography sx={{ p: 2 }}>
            No active sessions available. Please wait for an admin to create a new session.
          </Typography>
        ) : (
          <List>
            {activeSessions.map((session) => (
              <React.Fragment key={session.id}>
                <ListItem
                  component="div"
                  disablePadding
                  sx={{ cursor: 'pointer' }}
                >
                  <ListItemButton
                    onClick={() => onSelectSession(session.id)}
                    selected={session.id === currentSessionId}
                    disabled={session.totalPlayers === session.config.maxPlayers}
                  >
                    <ListItemText
                      primary={session.name}
                      secondary={
                        <React.Fragment>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.primary"
                          >
                            Players: {session.totalPlayers ?? 0} / {session.config.maxPlayers}
                          </Typography>
                          {session.totalPlayers === session.config.maxPlayers && (
                            <Typography
                              component="span"
                              variant="body2"
                              color="error"
                              sx={{ ml: 1 }}
                            >
                              (Full)
                            </Typography>
                          )}
                          <br />
                          {session.currentRound !== undefined && session.totalRounds !== undefined && (
                            <Typography component="span" variant="body2">
                              Round: {session.currentRound + 1} / {session.totalRounds}
                            </Typography>
                          )}
                        </React.Fragment>
                      }
                    />
                  </ListItemButton>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SessionSelectionDialog;
