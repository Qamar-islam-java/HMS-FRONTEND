// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Paper,
  Avatar,
  CssBaseline
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Logo from '../components/common/Logo';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.post('/api/auth/signin', { username, password });
      const { token, username: loggedInUser, roles } = response.data;

      let userRole = 'PATIENT';
      if (roles && roles.length > 0) {
        const r = roles[0];
        userRole = typeof r === 'string' ? r : r.authority;
      }

      login({ username: loggedInUser, role: userRole }, token);

      if (userRole.includes('NURSE')) navigate('/nurse/vitals');
      else if (userRole.includes('RECEPTIONIST')) navigate('/receptionist/booking');
      else if (userRole.includes('DOCTOR')) navigate('/doctor/dashboard');
      else navigate('/');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <>
      <CssBaseline />

      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',       // vertical center
          justifyContent: 'center',   // horizontal center
          bgcolor: '#f0f4f4',
          px: 2
        }}
      >
        <Paper
          elevation={6}
          sx={{
            p: 4,
            width: '100%',
            maxWidth: 420,
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <Logo size="large" />

          <Typography
            component="h1"
            variant="h5"
            sx={{ mt: 2, mb: 2, fontWeight: 'bold', color: '#444' }}
          >
            Sign In
          </Typography>

          <Avatar sx={{ mb: 2, bgcolor: '#00796b' }}>
            <LockOutlinedIcon />
          </Avatar>

          {error && (
            <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                bgcolor: '#00796b',
                '&:hover': { bgcolor: '#004d40' },
                py: 1.5
              }}
            >
              Sign In
            </Button>
          </Box>
        </Paper>
      </Box>
    </>
  );
};

export default Login;
