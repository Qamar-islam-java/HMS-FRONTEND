//This page does a lot:
//Fetches the Queue.
//Fetches Patient History when a patient is selected.
//Manages a dynamic list of Medicines.
//Saves everything to the backend.
// src/pages/Doctor/Dashboard.jsx
//--------------------------------------------------------------------------------------------------
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Container, Grid, Paper, Typography, Button, List, ListItem, 
  ListItemText, TextField, Box, Divider, IconButton, Card, Chip
} from '@mui/material';
import { Delete as DeleteIcon, Person as PersonIcon, LocalHospital as HospitalIcon } from '@mui/icons-material';
import MainLayout from '../../components/Layout/MainLayout';

const DoctorDashboard = () => {
  const DOCTOR_ID = 1;
  const [queue, setQueue] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [prescriptions, setPrescriptions] = useState([{ medicineName: '', dosage: '', frequency: '', duration: '' }]);

  const fetchQueue = () => {
    api.get(`/api/appointment/doctor/${DOCTOR_ID}/queue`).then(res => setQueue(res.data)).catch(console.error);
  };

  useEffect(() => { fetchQueue(); }, []);

  const handleSelectPatient = (appointment) => {
    setSelectedAppointment(appointment);
    setDiagnosis(''); setNotes('');
    setPrescriptions([{ medicineName: '', dosage: '', frequency: '', duration: '' }]);
    api.get(`/api/medical-record/patient/${appointment.patientId}`).then(res => setHistory(res.data)).catch(console.error);
  };

  const handleStartConsultation = async (appointmentId) => {
    try {
      await api.post(`/api/appointment/${appointmentId}/start`);
      fetchQueue();
      setSelectedAppointment(prev => ({ ...prev, status: 'IN_PROGRESS' }));
    } catch (err) { alert("Failed to start"); }
  };

  const handlePrescriptionChange = (index, field, value) => {
    const newPrescriptions = [...prescriptions];
    newPrescriptions[index][field] = value;
    setPrescriptions(newPrescriptions);
  };

  const addPrescriptionRow = () => setPrescriptions([...prescriptions, { medicineName: '', dosage: '', frequency: '', duration: '' }]);
  const removePrescriptionRow = (index) => setPrescriptions(prescriptions.filter((_, i) => i !== index));

  const handleSaveAndComplete = async () => {
    if (!selectedAppointment) return;
    setLoading(true);
    try {
      const recordPayload = {
        appointmentId: selectedAppointment.id, patientId: selectedAppointment.patientId, doctorId: DOCTOR_ID,
        diagnosis, notes, prescriptions
      };
      await api.post('/api/medical-record', recordPayload);
      await api.post(`/api/appointment/${selectedAppointment.id}/complete`);
      alert("Saved!");
      setSelectedAppointment(null); setHistory([]); fetchQueue();
    } catch (err) { alert("Error saving"); } finally { setLoading(false); }
  };

  return (
    <MainLayout title="Doctor Consultation Room">
      <Grid container spacing={3}>
        {/* QUEUE COLUMN */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '80vh', overflow: 'auto', borderRadius: 2, boxShadow: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, color: '#00796b' }}>
              <HospitalIcon sx={{ mr: 1 }} />
              <Typography variant="h6" fontWeight="bold">Patient Queue</Typography>
            </Box>
            <List>
              {queue.length === 0 && <ListItem><ListItemText primary="Queue is empty" /></ListItem>}
              {queue.map((apt) => (
                <ListItem 
                  button key={apt.id} onClick={() => handleSelectPatient(apt)}
                  selected={selectedAppointment?.id === apt.id} divider
                  sx={{ borderRadius: 1, mb: 1, bgcolor: selectedAppointment?.id === apt.id ? '#e0f2f1' : 'inherit' }}
                >
                  <ListItemText 
                    primary={`Token: ${apt.tokenNumber}`} 
                    secondary={<Chip label={apt.status} size="small" color={apt.status === 'IN_PROGRESS' ? 'warning' : 'success'} />}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* CONSULTATION COLUMN */}
        <Grid item xs={12} md={8}>
          {selectedAppointment ? (
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
              <Grid container spacing={2} mb={2} alignItems="center">
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PersonIcon sx={{ mr: 1, fontSize: 32, color: '#00796b' }} />
                    <Box>
                      <Typography variant="h5" fontWeight="bold">Token #{selectedAppointment.tokenNumber}</Typography>
                      <Typography variant="body2" color="textSecondary">ID: {selectedAppointment.id}</Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={6} textAlign="right">
                  {selectedAppointment.status === 'VITALS_DONE' ? (
                    <Button variant="contained" color="primary" onClick={() => handleStartConsultation(selectedAppointment.id)}>
                      Start Consultation
                    </Button>
                  ) : (
                    <Chip label="In Progress" color="warning" />
                  )}
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Vitals Display */}
              <Box mb={2} p={2} bgcolor="#f5f5f5" borderRadius={1}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Recent Vitals</Typography>
                {selectedAppointment.vitalSigns ? (
                  <Grid container spacing={2}>
                    <Grid item><Typography variant="body2">WT: {selectedAppointment.vitalSigns.weight}kg</Typography></Grid>
                    <Grid item><Typography variant="body2">BP: {selectedAppointment.vitalSigns.systolicBP}/{selectedAppointment.vitalSigns.diastolicBP}</Typography></Grid>
                    <Grid item><Typography variant="body2">TMP: {selectedAppointment.vitalSigns.temperature}°C</Typography></Grid>
                  </Grid>
                ) : <Typography variant="body2">No vitals recorded.</Typography>}
              </Box>

              {/* History */}
              <Box mb={2}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Past History</Typography>
                {history.length > 0 ? history.map((rec, i) => (
                  <Card key={i} variant="outlined" sx={{ p: 1, mb: 1, bgcolor: '#fafafa' }}>
                    <Typography variant="caption" color="textSecondary">{rec.visitDate}</Typography>
                    <Typography variant="body2">{rec.diagnosis}</Typography>
                  </Card>
                )) : <Typography variant="body2">No history.</Typography>}
              </Box>

              {/* Inputs */}
              <Grid container spacing={2}>
                <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Diagnosis" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} /></Grid>
                <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Notes" value={notes} onChange={e => setNotes(e.target.value)} /></Grid>
              </Grid>

              {/* Rx */}
              <Box mt={2}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Prescription</Typography>
                {prescriptions.map((med, i) => (
                  <Grid container spacing={1} key={i} mb={1}>
                    <Grid item xs={3}><TextField fullWidth size="small" placeholder="Medicine" value={med.medicineName} onChange={e => handlePrescriptionChange(i, 'medicineName', e.target.value)} /></Grid>
                    <Grid item xs={2}><TextField fullWidth size="small" placeholder="Dosage" value={med.dosage} onChange={e => handlePrescriptionChange(i, 'dosage', e.target.value)} /></Grid>
                    <Grid item xs={3}><TextField fullWidth size="small" placeholder="Frequency" value={med.frequency} onChange={e => handlePrescriptionChange(i, 'frequency', e.target.value)} /></Grid>
                    <Grid item xs={3}><TextField fullWidth size="small" placeholder="Duration" value={med.duration} onChange={e => handlePrescriptionChange(i, 'duration', e.target.value)} /></Grid>
                    <Grid item xs={1}><IconButton onClick={() => removePrescriptionRow(i)} color="error"><DeleteIcon /></IconButton></Grid>
                  </Grid>
                ))}
                <Button variant="outlined" size="small" onClick={addPrescriptionRow}>+ Add Medicine</Button>
              </Box>

              <Box mt={3} textAlign="right">
                <Button variant="contained" color="success" size="large" onClick={handleSaveAndComplete} disabled={loading}>
                  {loading ? "Saving..." : "Save & Complete"}
                </Button>
              </Box>
            </Paper>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center', height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2 }}>
              <Typography variant="h6" color="textSecondary">Select a patient from the queue to begin.</Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </MainLayout>
  );
};

export default DoctorDashboard;
// import React, { useState, useEffect } from 'react';
// import api from '../../services/api';
// import { 
//   Container, Grid, Paper, Typography, Button, List, ListItem, 
//   ListItemText, TextField, Box, Divider, IconButton, Card 
// } from '@mui/material';
// import { Delete as DeleteIcon } from '@mui/icons-material';

// const DoctorDashboard = () => {
//   // Hardcoding Doctor ID to 1 for this demo (Dr. Smith)
//   // In production, you would get this from the logged-in user's context
//   const DOCTOR_ID = 1;

//   const [queue, setQueue] = useState([]);
//   const [selectedAppointment, setSelectedAppointment] = useState(null);
//   const [history, setHistory] = useState([]);
//   const [loading, setLoading] = useState(false);

//   // Form State
//   const [diagnosis, setDiagnosis] = useState('');
//   const [notes, setNotes] = useState('');
  
//   // Prescription State (Array of objects)
//   const [prescriptions, setPrescriptions] = useState([{ 
//     medicineName: '', dosage: '', frequency: '', duration: '' 
//   }]);

//   // 1. Fetch Queue on Load
//   const fetchQueue = () => {
//     api.get(`/api/appointment/doctor/${DOCTOR_ID}/queue`)
//       .then(res => setQueue(res.data))
//       .catch(err => console.error("Error fetching queue", err));
//   };

//   useEffect(() => {
//     fetchQueue();
//   }, []);

//   // 2. Handle Selecting a Patient
//   const handleSelectPatient = (appointment) => {
//     setSelectedAppointment(appointment);
//     setDiagnosis('');
//     setNotes('');
//     setPrescriptions([{ medicineName: '', dosage: '', frequency: '', duration: '' }]);

//     // Fetch Patient History
//     api.get(`/api/medical-record/patient/${appointment.patientId}`)
//       .then(res => setHistory(res.data))
//       .catch(err => console.error("Error fetching history", err));
//   };

//   // 3. Handle Starting Consultation
//   const handleStartConsultation = async (appointmentId) => {
//     try {
//       await api.post(`/api/appointment/${appointmentId}/start`);
//       fetchQueue(); // Refresh queue to remove this patient from "Ready" list
//       // Update local state to show we are in progress
//       setSelectedAppointment(prev => ({ ...prev, status: 'IN_PROGRESS' }));
//     } catch (err) {
//       alert("Failed to start consultation");
//     }
//   };

//   // 4. Handle Prescription Input Changes
//   const handlePrescriptionChange = (index, field, value) => {
//     const newPrescriptions = [...prescriptions];
//     newPrescriptions[index][field] = value;
//     setPrescriptions(newPrescriptions);
//   };

//   const addPrescriptionRow = () => {
//     setPrescriptions([...prescriptions, { medicineName: '', dosage: '', frequency: '', duration: '' }]);
//   };

//   const removePrescriptionRow = (index) => {
//     const newPrescriptions = prescriptions.filter((_, i) => i !== index);
//     setPrescriptions(newPrescriptions);
//   };

//   // 5. Save Consultation & Complete
//   const handleSaveAndComplete = async () => {
//     if (!selectedAppointment) return;

//     setLoading(true);

//     try {
//       // A. Save Medical Record
//       const recordPayload = {
//         appointmentId: selectedAppointment.id,
//         patientId: selectedAppointment.patientId,
//         doctorId: DOCTOR_ID,
//         diagnosis: diagnosis,
//         notes: notes,
//         prescriptions: prescriptions
//       };

//       await api.post('/api/medical-record', recordPayload);

//       // B. Mark Appointment as Completed
//       await api.post(`/api/appointment/${selectedAppointment.id}/complete`);

//       alert("Consultation Saved & Completed!");
      
//       // Reset UI
//       setSelectedAppointment(null);
//       setHistory([]);
//       fetchQueue(); // Refresh queue

//     } catch (err) {
//       console.error(err);
//       alert("Error saving consultation");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Container maxWidth="xl" sx={{ mt: 4 }}>
//       <Grid container spacing={3}>
        
//         {/* LEFT COLUMN: Queue */}
//         <Grid item xs={12} md={4}>
//           <Paper sx={{ p: 2, height: '80vh', overflow: 'auto' }}>
//             <Typography variant="h6" gutterBottom>Patient Queue</Typography>
//             <List>
//               {queue.length === 0 && <ListItem><ListItemText primary="No patients waiting" /></ListItem>}
//               {queue.map((apt) => (
//                 <ListItem 
//                   button 
//                   key={apt.id} 
//                   onClick={() => handleSelectPatient(apt)}
//                   selected={selectedAppointment?.id === apt.id}
//                   divider
//                 >
//                   <ListItemText 
//                     primary={`Token: ${apt.tokenNumber}`} 
//                     secondary={`Status: ${apt.status}`} 
//                   />
//                 </ListItem>
//               ))}
//             </List>
//           </Paper>
//         </Grid>

//         {/* RIGHT COLUMN: Consultation */}
//         <Grid item xs={12} md={8}>
//           {selectedAppointment ? (
//             <Paper sx={{ p: 3 }}>
//               <Grid container spacing={2} mb={2}>
//                 <Grid item xs={6}>
//                   <Typography variant="h5">Token: {selectedAppointment.tokenNumber}</Typography>
//                   <Typography color="textSecondary">Appointment ID: {selectedAppointment.id}</Typography>
//                 </Grid>
//                 <Grid item xs={6} textAlign="right">
//                   {selectedAppointment.status === 'VITALS_DONE' ? (
//                     <Button 
//                       variant="contained" 
//                       color="primary"
//                       onClick={() => handleStartConsultation(selectedAppointment.id)}
//                     >
//                       Start Consultation
//                     </Button>
//                   ) : (
//                     <Typography variant="overline" color="success.main">In Progress</Typography>
//                   )}
//                 </Grid>
//               </Grid>

//               <Divider sx={{ mb: 2 }} />

//               {/* Vitals Display */}
//               <Box mb={2}>
//                 <Typography variant="h6" gutterBottom>Vitals (Nurse)</Typography>
//                 {selectedAppointment.vitalSigns ? (
//                   <Grid container spacing={2}>
//                     <Grid item><strong>Weight:</strong> {selectedAppointment.vitalSigns.weight} kg</Grid>
//                     <Grid item><strong>BP:</strong> {selectedAppointment.vitalSigns.systolicBP}/{selectedAppointment.vitalSigns.diastolicBP}</Grid>
//                     <Grid item><strong>Temp:</strong> {selectedAppointment.vitalSigns.temperature} °C</Grid>
//                   </Grid>
//                 ) : (
//                   <Typography color="error">Vitals not recorded yet.</Typography>
//                 )}
//               </Box>

//               {/* History Display */}
//               <Box mb={2}>
//                 <Typography variant="h6" gutterBottom>Past History</Typography>
//                 {history.length > 0 ? (
//                   history.map((record, idx) => (
//                     <Card key={idx} variant="outlined" sx={{ p: 1, mb: 1 }}>
//                       <Typography variant="body2"><strong>{record.visitDate}:</strong> {record.diagnosis}</Typography>
//                     </Card>
//                   ))
//                 ) : (
//                   <Typography variant="body2" color="textSecondary">No past records found.</Typography>
//                 )}
//               </Box>

//               <Divider sx={{ mb: 2 }} />

//               {/* Consultation Form */}
//               <Grid container spacing={2}>
//                 <Grid item xs={12}>
//                   <TextField
//                     fullWidth
//                     label="Diagnosis"
//                     multiline
//                     rows={2}
//                     value={diagnosis}
//                     onChange={(e) => setDiagnosis(e.target.value)}
//                   />
//                 </Grid>
//                 <Grid item xs={12}>
//                   <TextField
//                     fullWidth
//                     label="Doctor's Notes"
//                     multiline
//                     rows={2}
//                     value={notes}
//                     onChange={(e) => setNotes(e.target.value)}
//                   />
//                 </Grid>
//               </Grid>

//               {/* Prescription Section */}
//               <Box mt={2}>
//                 <Typography variant="h6" gutterBottom>Prescription</Typography>
//                 {prescriptions.map((med, index) => (
//                   <Grid container spacing={1} key={index} mb={1}>
//                     <Grid item xs={3}>
//                       <TextField 
//                         fullWidth size="small" placeholder="Medicine" 
//                         value={med.medicineName}
//                         onChange={(e) => handlePrescriptionChange(index, 'medicineName', e.target.value)}
//                       />
//                     </Grid>
//                     <Grid item xs={2}>
//                       <TextField 
//                         fullWidth size="small" placeholder="Dosage" 
//                         value={med.dosage}
//                         onChange={(e) => handlePrescriptionChange(index, 'dosage', e.target.value)}
//                       />
//                     </Grid>
//                     <Grid item xs={3}>
//                       <TextField 
//                         fullWidth size="small" placeholder="Frequency" 
//                         value={med.frequency}
//                         onChange={(e) => handlePrescriptionChange(index, 'frequency', e.target.value)}
//                       />
//                     </Grid>
//                     <Grid item xs={3}>
//                       <TextField 
//                         fullWidth size="small" placeholder="Duration" 
//                         value={med.duration}
//                         onChange={(e) => handlePrescriptionChange(index, 'duration', e.target.value)}
//                       />
//                     </Grid>
//                     <Grid item xs={1}>
//                       <IconButton onClick={() => removePrescriptionRow(index)} color="error">
//                         <DeleteIcon />
//                       </IconButton>
//                     </Grid>
//                   </Grid>
//                 ))}
//                 <Button variant="outlined" size="small" onClick={addPrescriptionRow}>+ Add Medicine</Button>
//               </Box>

//               <Box mt={3} textAlign="right">
//                 <Button 
//                   variant="contained" 
//                   color="success" 
//                   size="large"
//                   onClick={handleSaveAndComplete}
//                   disabled={loading}
//                 >
//                   {loading ? "Saving..." : "Save & Complete"}
//                 </Button>
//               </Box>

//             </Paper>
//           ) : (
//             <Paper sx={{ p: 4, textAlign: 'center', height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//               <Typography variant="h6" color="textSecondary">Select a patient from the queue to begin.</Typography>
//             </Paper>
//           )}
//         </Grid>
//       </Grid>
//     </Container>
//   );
// };

// export default DoctorDashboard;
/*
How to Test This
Prepare Data:
Ensure you have a patient with a booked appointment.
Login as a Nurse (or simulate the API call) to submit Vitals for that appointment. The appointment status must be VITALS_DONE for it to appear in the Doctor's queue.
Login as Doctor:
Go to the React app.
Login as dr_smith (or whichever user has ROLE_DOCTOR).
The Workflow:
You should see the Token in the list on the left.
Click the Token.
Click "Start Consultation".
Fill in Diagnosis and add a Paracetamol prescription.
Click "Save & Complete".
The patient should disappear from the list, and the data is now in the system!
This dashboard connects the Appointment Service, Medical Record Service, and uses data from the Nurse's input. It's a fully functional clinical screen!
*/