import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Typography, TextField, Button, MenuItem, Box, Paper, Alert, 
  Grid, CircularProgress, Chip 
} from '@mui/material';
import { Search as SearchIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material';
import MainLayout from '../../components/Layout/MainLayout';

const ReceptionistBooking = () => {
  // --- Search State ---
  const [nationalId, setNationalId] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  
  // --- Patient State ---
  const [patient, setPatient] = useState(null); // Holds the found/registered patient
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [registerData, setRegisterData] = useState({
    name: '',
    dateOfBirth: '',
    contactNumber: ''
  });

  // --- Booking State ---
  const [specialty, setSpecialty] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [message, setMessage] = useState('');

  // 1. Search Patient
  const handleSearch = async () => {
    if (!nationalId) return;
    
    setSearchLoading(true);
    setSearchError('');
    setPatient(null);
    setShowRegisterForm(false);

    try {
      const response = await api.get(`/api/patient/search?nationalId=${nationalId}`);
      setPatient(response.data);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        // Patient not found -> Show Register Form
        setShowRegisterForm(true);
        setSearchError('Patient not found. Please register.');
      } else {
        setSearchError('Error searching patient.');
      }
    } finally {
      setSearchLoading(false);
    }
  };

  // 2. Register New Patient
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...registerData,
        nationalId: nationalId
      };
      const response = await api.post('/api/patient/register', payload);
      setPatient(response.data); // Auto-fill the patient with the new data
      setShowRegisterForm(false);
      setSearchError('');
    } catch (err) {
      setSearchError('Failed to register patient.');
    }
  };

  // 3. Fetch Doctors for Booking (Existing Logic)
  useEffect(() => {
    if (specialty) {
      api.get(`/api/doctor/list/${specialty}`)
        .then(res => setDoctors(res.data))
        .catch(err => console.error(err));
    } else {
      setDoctors([]);
      setSelectedDoctor('');
    }
  }, [specialty]);

  // 4. Book Appointment (Existing Logic)
  const handleBook = async () => {
    if (!selectedDoctor || !patient) return;
    try {
      const response = await api.post('/api/appointment/book', {
        patientId: patient.id, // Use the actual patient ID
        doctorId: parseInt(selectedDoctor)
      });
      setMessage(`Appointment Booked! Token Number: ${response.data.tokenNumber}`);
      // Reset booking fields but keep patient
      setSpecialty('');
      setSelectedDoctor('');
      setDoctors([]);
    } catch (err) {
      setMessage('Error booking appointment');
    }
  };

  return (
    <MainLayout title="Receptionist Desk">
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '70vh' }}>
        
        {/* --- SECTION 1: PATIENT SEARCH CARD --- */}
        <Paper 
          elevation={6} 
          sx={{ 
            width: '100%', 
            maxWidth: 600, 
            p: 4, 
            borderRadius: 3,
            boxShadow: '0px 10px 25px rgba(0,0,0,0.1)'
          }}
        >
          <Typography variant="h6" fontWeight="bold" color="#00796b" gutterBottom>
            Patient Identification
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="National ID"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button 
              variant="contained" 
              onClick={handleSearch} 
              disabled={searchLoading}
              sx={{ bgcolor: '#00796b', minWidth: 100 }}
            >
              {searchLoading ? <CircularProgress size={24} color="inherit" /> : <SearchIcon />}
            </Button>
          </Box>
          {searchError && <Alert severity="warning" sx={{ mt: 2 }}>{searchError}</Alert>}
          
          {/* Display Found Patient */}
          {patient && !showRegisterForm && (
            <Alert severity="success" sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">{patient.name}</Typography>
                <Typography variant="body2">ID: {patient.nationalId} | DOB: {patient.dateOfBirth}</Typography>
              </Box>
            </Alert>
          )}
        </Paper>

        {/* --- SECTION 2: REGISTRATION FORM (Only if New) --- */}
        {showRegisterForm && (
          <Paper elevation={4} sx={{ width: '100%', maxWidth: 600, p: 4, mt: 3, borderRadius: 3, border: '2px dashed #00796b' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PersonAddIcon sx={{ mr: 1, color: '#00796b' }} />
              <Typography variant="h6" fontWeight="bold">Register New Patient</Typography>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField 
                  fullWidth label="Full Name" 
                  value={registerData.name}
                  onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                  required 
                />
              </Grid>
              <Grid item xs={6}>
                <TextField 
                  fullWidth label="Date of Birth" type="date" 
                  InputLabelProps={{ shrink: true }}
                  value={registerData.dateOfBirth}
                  onChange={(e) => setRegisterData({...registerData, dateOfBirth: e.target.value})}
                  required 
                />
              </Grid>
              <Grid item xs={6}>
                <TextField 
                  fullWidth label="Contact Number" 
                  value={registerData.contactNumber}
                  onChange={(e) => setRegisterData({...registerData, contactNumber: e.target.value})}
                  required 
                />
              </Grid>
              <Grid item xs={12}>
                <Button fullWidth variant="contained" color="primary" onClick={handleRegister} sx={{ py: 1.5 }}>
                  Register Patient
                </Button>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* --- SECTION 3: BOOKING FORM (Only if Patient Found) --- */}
        {patient && !showRegisterForm && (
          <Paper elevation={4} sx={{ width: '100%', maxWidth: 600, p: 4, mt: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" color="#333" gutterBottom>
              Book Appointment for {patient.name}
            </Typography>
            
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

            <Button 
              fullWidth variant="contained" onClick={handleBook} disabled={!selectedDoctor}
              sx={{ py: 1.5, bgcolor: '#00796b', fontSize: '16px', borderRadius: 2 }}
            >
              Confirm Booking
            </Button>

            {message && <Alert severity="success" sx={{ mt: 3, textAlign: 'center' }}>{message}</Alert>}
          </Paper>
        )}
        
      </Box>
    </MainLayout>
  );
};

export default ReceptionistBooking;