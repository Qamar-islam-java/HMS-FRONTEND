import React from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton, Container } from '@mui/material';
import { ExitToApp as LogoutIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import Logo from '../common/Logo';

const MainLayout = ({ children, title }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f4f6f8' }}>
      {/* --- HEADER --- */}
      <AppBar position="static" sx={{ bgcolor: '#00796b', boxShadow: 3 }}>
        <Toolbar>
          <Logo color="white" size="medium" />
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, ml: 2, fontWeight: 500 }}>
            {title}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              Hi, {user?.username || 'User'}
            </Typography>
            <IconButton color="inherit" onClick={handleLogout} title="Logout">
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* --- MAIN CONTENT (CENTERED) --- */}
      <Container 
        maxWidth="xl" 
        sx={{ 
          mt: 4, 
          mb: 4, 
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center', // THIS CENTERS EVERYTHING HORIZONTALLY
          width: '100%'
        }}
      >
        {children}
      </Container>
      
      {/* --- FOOTER --- */}
      <Box component="footer" sx={{ py: 2, textAlign: 'center', bgcolor: '#e0f2f1', color: '#555' }}>
        <Typography variant="body2">© {new Date().getFullYear()} CRESCENT Hospital Management System</Typography>
      </Box>
    </Box>
  );
};

export default MainLayout;
// import React from 'react';
// import { AppBar, Toolbar, Typography, Box, IconButton, Container } from '@mui/material';
// import { ExitToApp as LogoutIcon } from '@mui/icons-material';
// import { useAuth } from '../../context/AuthContext';
// import Logo from '../common/Logo';

// const MainLayout = ({ children, title }) => {
//   const { user, logout } = useAuth();

//   const handleLogout = () => {
//     logout();
//   };

//   return (
//     <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f4f6f8' }}>
//       {/* --- HEADER --- */}
//       <AppBar position="static" sx={{ bgcolor: '#00796b', boxShadow: 3 }}>
//         <Toolbar>
//           <Logo color="white" size="medium" />
          
//           <Typography variant="h6" component="div" sx={{ flexGrow: 1, ml: 2, fontWeight: 500 }}>
//             {title}
//           </Typography>

//           <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
//             <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
//               Hi, {user?.username || 'User'}
//             </Typography>
//             <IconButton color="inherit" onClick={handleLogout} title="Logout">
//               <LogoutIcon />
//             </IconButton>
//           </Box>
//         </Toolbar>
//       </AppBar>

//       {/* --- MAIN CONTENT --- */}
//       <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
//         {children}
//       </Container>
      
//       {/* --- FOOTER --- */}
//       <Box component="footer" sx={{ py: 2, textAlign: 'center', bgcolor: '#e0f2f1', color: '#555' }}>
//         <Typography variant="body2">© {new Date().getFullYear()} CRESCENT Hospital Management System</Typography>
//       </Box>
//     </Box>
//   );
// };

// export default MainLayout;