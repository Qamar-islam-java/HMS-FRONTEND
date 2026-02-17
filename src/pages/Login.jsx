// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  TextField, Button, Typography, Box, Alert, 
  Paper, CssBaseline, Grid, Link
} from '@mui/material';
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
    <Grid container component="main" sx={{ height: '100vh' }}>
      <CssBaseline />
      {/* Left Side: Form */}
      <Grid
        item
        xs={12}
        sm={8}
        md={5}
        component={Paper}
        elevation={6}
        square
        sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4 }}
      >
        <Box sx={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Logo size="large" color="#00796b" />
          <Typography component="h1" variant="h5" sx={{ mt: 2, mb: 2, color: '#333' }}>
            Sign In
          </Typography>
          {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
          
          <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
            <TextField
              margin="normal" required fullWidth label="Username" autoFocus
              value={username} onChange={(e) => setUsername(e.target.value)}
            />
            <TextField
              margin="normal" required fullWidth label="Password" type="password"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2, bgcolor: '#00796b', py: 1.5 }}
            >
              Sign In
            </Button>
          </Box>
        </Box>
      </Grid>

      {/* Right Side: Decorative Image/Branding */}
      <Grid
        item
        xs={false}
        sm={4}
        md={7}
        sx={{
          backgroundImage: 'url(https://source.unsplash.com/random?hospital)',
          backgroundRepeat: 'no-repeat',
          backgroundColor: (t) => t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#004d40'
        }}
      >
         {/* Fallback if image fails to load */}
         <Box sx={{ textAlign: 'center', color: 'white' }}>
            <Logo size="large" color="white" />
            <Typography variant="h3" fontWeight="bold" sx={{ mt: 2 }}>CRESCENT</Typography>
            <Typography variant="h6">Excellence in Healthcare</Typography>
         </Box>
      </Grid>
    </Grid>
  );
};

export default Login;

//-------------------------------------------------------------------------------------------------------------------//
// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import api from '../services/api';
// import { 
//   Container, TextField, Button, Typography, Box, Alert, 
//   Paper, Avatar, CssBaseline 
// } from '@mui/material';
// import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
// import Logo from '../components/common/Logo'; // Import the Logo

// const Login = () => {
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const { login } = useAuth();
//   const navigate = useNavigate();

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     try {
//       const response = await api.post('/api/auth/signin', { username, password });
//       const { token, username: loggedInUser, roles } = response.data;
      
//       // Determine role logic (simple check)
//       const role = roles && roles.length > 0 ? roles[0] : 'PATIENT';

//       login({ username: loggedInUser, role }, token);
      
//       // Redirect based on role
//       if (role.includes('RECEPTIONIST')) {
//         navigate('/receptionist/booking');
//       } else if (role.includes('DOCTOR')) {
//         navigate('/doctor/dashboard');
//       } else if (role.includes('NURSE')) {
//         navigate('/nurse/vitals');
//       } else {
//         navigate('/'); 
//       }
//     } catch (err) {
//       setError('Invalid credentials');
//     }
//   };

//   return (
//     <Container component="main" maxWidth="xs">
//       <CssBaseline />
//       <Box
//         sx={{
//           marginTop: 8,
//           display: 'flex',
//           flexDirection: 'column',
//           alignItems: 'center',
//           minHeight: '100vh',
//           justifyContent: 'center',
//           bgcolor: '#f0f4f4', // Light medical teal/grey background
//         }}
//       >
//         <Paper 
//           elevation={6} 
//           sx={{ 
//             padding: 4, 
//             display: 'flex', 
//             flexDirection: 'column', 
//             alignItems: 'center',
//             width: '100%',
//             borderRadius: 2
//           }}
//         >
//           {/* Logo */}
//           <Logo size="large" />
          
//           <Typography component="h1" variant="h6" sx={{ mt: 2, color: '#555' }}>
//             Hospital Management System
//           </Typography>

//           <Avatar sx={{ m: 1, bgcolor: '#00796b' }}>
//             <LockOutlinedIcon />
//           </Avatar>

//           {error && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}
          
//           <Box component="form" onSubmit={handleLogin} sx={{ mt: 1, width: '100%' }}>
//             <TextField
//               margin="normal"
//               required
//               fullWidth
//               label="Username"
//               autoFocus
//               variant="outlined"
//               value={username}
//               onChange={(e) => setUsername(e.target.value)}
//               sx={{ bgcolor: '#fff' }}
//             />
//             <TextField
//               margin="normal"
//               required
//               fullWidth
//               label="Password"
//               type="password"
//               variant="outlined"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               sx={{ bgcolor: '#fff' }}
//             />
//             <Button 
//               type="submit" 
//               fullWidth 
//               variant="contained" 
//               sx={{ 
//                 mt: 3, 
//                 mb: 2, 
//                 bgcolor: '#00796b', 
//                 '&:hover': { bgcolor: '#004d40' },
//                 padding: '10px 0',
//                 fontSize: '16px'
//               }}
//             >
//               Sign In
//             </Button>
//           </Box>
//         </Paper>
//         <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 4 }}>
//           © {new Date().getFullYear()} CRESCENT Hospitals
//         </Typography>
//       </Box>
//     </Container>
//   );
// };

// export default Login;
//---------------------------------------------------------------------------------------------------------------------------//
// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import api from '../services/api';
// import { Container, TextField, Button, Typography, Box, Alert } from '@mui/material';

// const Login = () => {
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const { login } = useAuth();
//   const navigate = useNavigate();

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     try {
//       const response = await api.post('/api/auth/signin', { username, password });
//       const { token, username: loggedInUser, roles } = response.data;
      
//       // Determine role logic (simple check)
//       const role = roles && roles.length > 0 ? roles[0] : 'PATIENT';

//       login({ username: loggedInUser, role }, token);
      
//       // Redirect based on role
//       if (role.includes('RECEPTIONIST')) {
//         navigate('/receptionist/booking');
//       } else if (role.includes('DOCTOR')) {
//         navigate('/doctor/dashboard');
//       } else {
//         navigate('/'); // Or a default dashboard
//       }
//     } catch (err) {
//       setError('Invalid credentials');
//     }
//   };

//   return (
//     <Container maxWidth="xs">
//       <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
//         <Typography component="h1" variant="h5">Hospital HMS Login</Typography>
//         {error && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}
//         <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
//           <TextField
//             margin="normal"
//             required
//             fullWidth
//             label="Username"
//             autoFocus
//             value={username}
//             onChange={(e) => setUsername(e.target.value)}
//           />
//           <TextField
//             margin="normal"
//             required
//             fullWidth
//             label="Password"
//             type="password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//           />
//           <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
//             Sign In
//           </Button>
//         </Box>
//       </Box>
//     </Container>
//   );
// };

// export default Login;