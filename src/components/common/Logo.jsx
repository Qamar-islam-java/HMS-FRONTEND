import React from 'react';
import { Box, Typography } from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';

const Logo = ({ color = "#00796b", size = "medium", showText = true }) => {
  const iconSize = size === "large" ? 40 : size === "small" ? 24 : 32;
  const fontSize = size === "large" ? "h4" : size === "small" ? "h6" : "h5";

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', color: color }}>
      <LocalHospitalIcon sx={{ fontSize: iconSize, mr: 1 }} />
      {showText && (
        <Typography 
          variant={fontSize} 
          fontWeight="bold" 
          sx={{ letterSpacing: 1, fontFamily: 'Arial, sans-serif' }}
        >
          CRESCENT
        </Typography>
      )}
    </Box>
  );
};

export default Logo;