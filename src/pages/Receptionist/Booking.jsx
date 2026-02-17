import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Typography, TextField, Button, MenuItem, Box, Paper, Alert } from '@mui/material';
import MainLayout from '../../components/Layout/MainLayout';

const ReceptionistBooking = () => {
  const [specialty, setSpecialty] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [patientId, setPatientId] = useState('1'); 
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (specialty) {
      api.get(`/api/doctor/list/${specialty}`)
        .then(res => setDoctors(res.data))
        .catch(err => console.error(err));
    }
  }, [specialty]);

  const handleBook = async () => {
    if (!selectedDoctor || !patientId) return;
    try {
      const response = await api.post('/api/appointment/book', {
        patientId: parseInt(patientId),
        doctorId: parseInt(selectedDoctor)
      });
      setMessage(`Appointment Booked! Token Number: ${response.data.tokenNumber}`);
    } catch (err) {
      setMessage('Error booking appointment');
    }
  };

  return (
    <MainLayout title="Receptionist Desk">
      {/* This Box centers the card vertically and horizontally */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '70vh' 
        }}
      >
        <Paper 
          elevation={6} 
          sx={{ 
            width: '100%', 
            maxWidth: 500, // Limits the width to a nice card size
            p: 5, 
            borderRadius: 3,
            boxShadow: '0px 10px 25px rgba(0,0,0,0.1)'
          }}
        >
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight="bold" color="#00796b">
              Book New Appointment
            </Typography>
            <Typography variant="body2" color="textSecondary">Select details below</Typography>
          </Box>
          
          <TextField
            fullWidth select label="Specialty" value={specialty}
            onChange={(e) => setSpecialty(e.target.value)} sx={{ mb: 3 }}
          >
            <MenuItem value="Cardiology">Cardiology</MenuItem>
            <MenuItem value="Dermatology">Dermatology</MenuItem>
          </TextField>

          <TextField
            fullWidth select label="Select Doctor" value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)} disabled={!specialty} sx={{ mb: 3 }}
          >
            {doctors.map((doc) => (
              <MenuItem key={doc.id} value={doc.id}>{doc.name}</MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth label="Patient ID" type="number" value={patientId}
            onChange={(e) => setPatientId(e.target.value)} sx={{ mb: 3 }}
            helperText="Enter Patient ID (Use 1 for testing)"
          />

          <Button 
            fullWidth variant="contained" onClick={handleBook} disabled={!selectedDoctor}
            sx={{ py: 1.5, bgcolor: '#00796b', fontSize: '16px', borderRadius: 2 }}
          >
            Confirm Booking
          </Button>

          {message && <Alert severity="success" sx={{ mt: 3 }}>{message}</Alert>}
        </Paper>
      </Box>
    </MainLayout>
  );
};

export default ReceptionistBooking;