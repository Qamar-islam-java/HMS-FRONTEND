// src/pages/Nurse/Vitals.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Container, Typography, TextField, Button, MenuItem, Paper, Box, Grid, Alert, CircularProgress } from '@mui/material';
import MainLayout from '../../components/Layout/MainLayout';

const NurseVitals = () => {
  const [specialty, setSpecialty] = useState('');
  const [specialties, setSpecialties] = useState([]); 
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [tokenNumber, setTokenNumber] = useState('');
  const [appointment, setAppointment] = useState(null);
  const [vitals, setVitals] = useState({ weight: '', height: '', systolicBP: '', diastolicBP: '', temperature: '', pulse: '' });
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // 0. Fetch All Specialties on Load
  useEffect(() => {
    api.get('/api/doctor/specialties')
      .then(res => setSpecialties(res.data))
      .catch(err => console.error("Failed to load specialties", err));
  }, []);


  useEffect(() => {
    if (specialty) {
      api.get(`/api/doctor/list/${specialty}`).then(res => setDoctors(res.data)).catch(console.error);
    } else { setDoctors([]); setSelectedDoctor(''); }
  }, [specialty]);

  const handleSearch = async () => {
    if (!selectedDoctor || !tokenNumber) { setMessage({ text: 'Select Doctor & Token', type: 'error' }); return; }
    setLoadingSearch(true); setMessage({ text: '', type: '' });
    try {
      const response = await api.get(`/api/appointment/search`, { params: { token: tokenNumber, doctorId: selectedDoctor } });
      if (response.data) {
        setAppointment(response.data);
        setMessage({ text: 'Patient Found!', type: 'success' });
        setVitals({ weight: '', height: '', systolicBP: '', diastolicBP: '', temperature: '', pulse: '' });
      } else { setAppointment(null); setMessage({ text: 'Not Found', type: 'error' }); }
    } catch (err) { setMessage({ text: 'Error', type: 'error' }); } finally { setLoadingSearch(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); if (!appointment) return;
    setLoadingSave(true);
    try {
      const payload = {
        weight: parseFloat(vitals.weight), height: parseInt(vitals.height),
        systolicBP: parseInt(vitals.systolicBP), diastolicBP: parseInt(vitals.diastolicBP),
        temperature: parseFloat(vitals.temperature), pulse: vitals.pulse
      };
      await api.post(`/api/appointment/${appointment.id}/vitals`, payload);
      setMessage({ text: 'Vitals Saved!', type: 'success' });
      setAppointment(null); setTokenNumber('');
    } catch (err) { setMessage({ text: 'Failed', type: 'error' }); } finally { setLoadingSave(false); }
  };

  return (
    <MainLayout title="Nurse Station">
      {/* Container to center everything */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '70vh' }}>
        
        {/* SEARCH CARD */}
        <Paper elevation={4} sx={{ p: 4, mb: 3, borderRadius: 3, width: '100%', maxWidth: 800, boxShadow: '0px 10px 25px rgba(0,0,0,0.1)' }}>
          <Typography variant="h6" fontWeight="bold" color="#00796b" gutterBottom>Find Patient</Typography>
          
          <Grid container spacing={2} alignItems="center">
            {/* Specialty */}
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                select
                label="Specialty"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                size="small" // Changed to small for better row alignment
              >
                {specialties.map((spec) => (
                  <MenuItem key={spec} value={spec}>
                    {spec}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Doctor */}
            <Grid item xs={12} sm={3}>
              <TextField 
                fullWidth 
                select 
                label="Doctor" 
                value={selectedDoctor} 
                onChange={e => setSelectedDoctor(e.target.value)} 
                disabled={!specialty}
                size="small"
              >
                {doctors.map((doc) => <MenuItem key={doc.id} value={doc.id}>{doc.name}</MenuItem>)}
              </TextField>
            </Grid>

            {/* Token */}
            <Grid item xs={12} sm={3}>
              <TextField 
                fullWidth 
                label="Token #" 
                type="number" 
                value={tokenNumber} 
                onChange={e => setTokenNumber(e.target.value)} 
                size="small"
              />
            </Grid>

            {/* Button */}
            <Grid item xs={12} sm={3}>
              <Button 
                fullWidth 
                variant="contained" 
                onClick={handleSearch} 
                disabled={loadingSearch || !selectedDoctor} 
                sx={{ py: 1.3, bgcolor: '#00796b', borderRadius: 2 }} // Adjusted py to match small text fields
              >
                {loadingSearch ? <CircularProgress size={24} color="inherit" /> : 'Find'}
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {message.text && <Alert severity={message.type} sx={{ mb: 2, width: '100%', maxWidth: 800 }}>{message.text}</Alert>}

        {/* VITALS FORM CARD */}
        {appointment && (
          <Paper elevation={5} sx={{ p: 4, borderRadius: 3, width: '100%', maxWidth: 800, border: '2px solid #00796b' }}>
            <Box sx={{ mb: 3, p: 2, bgcolor: '#e0f2f1', borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="h5" fontWeight="bold" color="#004d40">Token: #{appointment.tokenNumber}</Typography>
              <Typography variant="body2">Patient ID: {appointment.patientId} | Status: {appointment.status}</Typography>
            </Box>

            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={6} sm={4}><TextField fullWidth label="Weight (kg)" type="number" value={vitals.weight} onChange={e => setVitals({...vitals, weight: e.target.value})} required /></Grid>
                <Grid item xs={6} sm={4}><TextField fullWidth label="Height (cm)" type="number" value={vitals.height} onChange={e => setVitals({...vitals, height: e.target.value})} required /></Grid>
                <Grid item xs={6} sm={4}><TextField fullWidth label="Sys. BP" type="number" value={vitals.systolicBP} onChange={e => setVitals({...vitals, systolicBP: e.target.value})} required /></Grid>
                <Grid item xs={6} sm={4}><TextField fullWidth label="Dia. BP" type="number" value={vitals.diastolicBP} onChange={e => setVitals({...vitals, diastolicBP: e.target.value})} required /></Grid>
                <Grid item xs={6} sm={4}><TextField fullWidth label="Temp (°C)" type="number" value={vitals.temperature} onChange={e => setVitals({...vitals, temperature: e.target.value})} required /></Grid>
                <Grid item xs={6} sm={4}><TextField fullWidth label="Pulse" value={vitals.pulse} onChange={e => setVitals({...vitals, pulse: e.target.value})} required /></Grid>
                <Grid item xs={12}>
                  <Button type="submit" variant="contained" color="success" size="large" fullWidth disabled={loadingSave} sx={{ py: 1.5, borderRadius: 2 }}>
                    {loadingSave ? "Saving..." : "Submit Vitals"}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        )}
      </Box>
    </MainLayout>
  );
};

export default NurseVitals;