import React, { useState } from 'react';
import api from '../../services/api';
import { 
  Typography, TextField, Button, Paper, Box, 
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Alert, CircularProgress 
} from '@mui/material';
import MedicationIcon from '@mui/icons-material/Medication';
import MainLayout from '../../components/Layout/MainLayout';

const PharmacyDashboard = () => {
  const [tokenNumber, setTokenNumber] = useState('');
  const [prescriptionData, setPrescriptionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle Search using the new backend endpoint
  const handleSearch = async () => {
    if (!tokenNumber) return;

    setLoading(true);
    setError('');
    setPrescriptionData(null);

    try {
      // Calling the endpoint you just created: /api/pharmacy/find?token=105
      const response = await api.get(`/api/pharmacy/find?token=${tokenNumber}`);
      
      if (response.data) {
        setPrescriptionData(response.data);
      } else {
        setError('No prescription found for this token.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch prescription. Check the Token Number.');
    } finally {
      setLoading(false);
    }
  };

  const handleDispense = () => {
    alert(`Medicines for Token #${tokenNumber} dispensed successfully!`);
    // Reset form for next patient
    setTokenNumber('');
    setPrescriptionData(null);
  };

  return (
    <MainLayout title="Pharmacy Counter">
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          minHeight: '70vh' 
        }}
      >
        {/* SEARCH CARD */}
        <Paper 
          elevation={6} 
          sx={{ 
            width: '100%', 
            maxWidth: 600, 
            p: 4, 
            borderRadius: 3,
            boxShadow: '0px 10px 25px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}
        >
          <MedicationIcon sx={{ fontSize: 48, color: '#00796b', mb: 2 }} />
          <Typography variant="h5" fontWeight="bold" color="#333" gutterBottom>
            Dispense Medicine
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Enter patient token number to view prescription
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <TextField
              label="Token Number"
              variant="outlined"
              value={tokenNumber}
              onChange={(e) => setTokenNumber(e.target.value)}
              type="number"
              sx={{ width: '200px' }}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button 
              variant="contained" 
              onClick={handleSearch} 
              disabled={loading}
              sx={{ bgcolor: '#00796b', px: 3, py: 1.5, borderRadius: 2 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Find'}
            </Button>
          </Box>
        </Paper>

        {error && <Alert severity="error" sx={{ mt: 3, width: '100%', maxWidth: 600 }}>{error}</Alert>}

        {/* PRESCRIPTION RESULT CARD */}
        {prescriptionData && (
          <Paper 
            elevation={4} 
            sx={{ 
              mt: 3, 
              width: '100%', 
              maxWidth: 800, 
              p: 4, 
              borderRadius: 3,
              border: '2px solid #00796b'
            }}
          >
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h5" fontWeight="bold" color="#00796b">
                  Token #{tokenNumber}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Doctor's Diagnosis: {prescriptionData.diagnosis || 'N/A'}
                </Typography>
              </Box>
              <Button 
                variant="contained" 
                color="success" 
                onClick={handleDispense}
                sx={{ borderRadius: 2, px: 4, py: 1.5 }}
              >
                Confirm Dispense
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#e0f2f1' }}>
                  <TableRow>
                    <TableCell><strong>Medicine Name</strong></TableCell>
                    <TableCell><strong>Dosage</strong></TableCell>
                    <TableCell><strong>Frequency</strong></TableCell>
                    <TableCell><strong>Duration</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {prescriptionData.prescriptions && prescriptionData.prescriptions.length > 0 ? (
                    prescriptionData.prescriptions.map((med, index) => (
                      <TableRow key={index}>
                        <TableCell>{med.medicineName}</TableCell>
                        <TableCell>{med.dosage}</TableCell>
                        <TableCell>{med.frequency}</TableCell>
                        <TableCell>{med.duration}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No medicines prescribed.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {prescriptionData.notes && (
              <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold">Doctor's Notes:</Typography>
                <Typography variant="body2">{prescriptionData.notes}</Typography>
              </Box>
            )}
          </Paper>
        )}
      </Box>
    </MainLayout>
  );
};

export default PharmacyDashboard;