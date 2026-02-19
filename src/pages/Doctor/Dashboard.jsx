//This page does a lot:
//Fetches the Queue.
//Fetches Patient History when a patient is selected.
//Manages a dynamic list of Medicines.
//Saves everything to the backend.
// src/pages/Doctor/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import api from '../../services/api';
import { 
  Container, Grid, Paper, Typography, Button, List, ListItem, 
  ListItemText, TextField, Box, Divider, IconButton, Card, 
  Chip, Tabs, Tab
} from '@mui/material';
import { Delete as DeleteIcon, Person as PersonIcon, LocalHospital as HospitalIcon, History as HistoryIcon, PictureAsPdf as PdfIcon } from '@mui/icons-material';
import MainLayout from '../../components/Layout/MainLayout';

const DoctorDashboard = () => {
  const DOCTOR_ID = 1; 

  // States
  const [allAppointments, setAllAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [prescriptions, setPrescriptions] = useState([{ medicineName: '', dosage: '', frequency: '', duration: '' }]);

  // Filter State
  const [tabValue, setTabValue] = useState('VITALS_DONE'); 

  // Fetch ALL appointments
  const fetchAllAppointments = () => {
    api.get(`/api/appointment/doctor/${DOCTOR_ID}/all`)
      .then(res => setAllAppointments(res.data))
      .catch(console.error);
  };

  useEffect(() => { fetchAllAppointments(); }, []);

  const getFilteredAppointments = () => {
    if (tabValue === 'ALL') return allAppointments;
    return allAppointments.filter(apt => apt.status === tabValue);
  };
  const filteredList = getFilteredAppointments();

  const handleSelectPatient = (appointment) => {
    setSelectedAppointment(appointment);
    api.get(`/api/medical-record/patient/${appointment.patientId}`)
      .then(res => setHistory(res.data))
      .catch(console.error);

    if (appointment.status === 'COMPLETED') {
       api.get(`/api/medical-record/appointment/${appointment.id}`)
          .then(res => {
            const record = res.data;
            setDiagnosis(record.diagnosis || '');
            setNotes(record.notes || '');
            setPrescriptions(record.prescriptions || []);
          })
          .catch(err => console.log("No record found"));
    } else {
      setDiagnosis(''); setNotes('');
      setPrescriptions([{ medicineName: '', dosage: '', frequency: '', duration: '' }]);
    }
  };

  const handleStartConsultation = async (appointmentId) => {
    try {
      await api.post(`/api/appointment/${appointmentId}/start`);
      fetchAllAppointments();
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
      setSelectedAppointment(null); setHistory([]); fetchAllAppointments();
    } catch (err) { alert("Error saving"); } finally { setLoading(false); }
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('consultation-report');
    const opt = {
      margin:       0.5,
      filename:     `Consultation_Token_${selectedAppointment.tokenNumber}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).output('blob').then((blob) => {
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    });
  };

  return (
    <MainLayout title="Doctor Console">
      <Container maxWidth="xl" sx={{ mt: 2 }}>
        <Grid container spacing={3} justifyContent="center">
          
          {/* LEFT COLUMN */}
          <Grid item xs={12} md={4} lg={3}>
            <Paper sx={{ height: '85vh', display: 'flex', flexDirection: 'column', borderRadius: 2, boxShadow: 3, overflow: 'hidden' }}>
              <Box sx={{ bgcolor: '#e0f2f1', borderBottom: '1px solid #b2dfdb' }}>
                <Tabs value={tabValue} onChange={(e, newVal) => setTabValue(newVal)} variant="fullWidth" sx={{ minHeight: 50 }} TabIndicatorProps={{ style: { background: '#00796b' } }}>
                  <Tab label="Ready" value="VITALS_DONE" sx={{ fontSize: '0.8rem', minHeight: 50 }} />
                  <Tab label="Progress" value="IN_PROGRESS" sx={{ fontSize: '0.8rem', minHeight: 50 }} />
                  <Tab label="Done" value="COMPLETED" sx={{ fontSize: '0.8rem', minHeight: 50 }} />
                  <Tab label="All" value="ALL" sx={{ fontSize: '0.8rem', minHeight: 50 }} />
                </Tabs>
              </Box>
              <List sx={{ flexGrow: 1, overflowY: 'auto', p: 0, bgcolor: '#fafafa' }}>
                {filteredList.length === 0 && (
                  <Box sx={{ p: 3, textAlign: 'center', color: '#999' }}>
                    <Typography variant="body2">No appointments found.</Typography>
                  </Box>
                )}
                {filteredList.map((apt) => (
                  <ListItem button key={apt.id} onClick={() => handleSelectPatient(apt)} selected={selectedAppointment?.id === apt.id} divider
                    sx={{ bgcolor: selectedAppointment?.id === apt.id ? '#e0f2f1' : 'white', borderBottom: '1px solid #eee', '&:hover': { bgcolor: '#f1f8e9' } }}
                  >
                    <ListItemText primary={<Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="subtitle2" fontWeight="bold">Token #{apt.tokenNumber}</Typography><Chip label={apt.status} size="small" color={apt.status === 'COMPLETED' ? 'default' : apt.status === 'IN_PROGRESS' ? 'warning' : 'success'} /></Box>} secondary={<Typography variant="caption" color="textSecondary">Pt ID: {apt.patientId}</Typography>} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* RIGHT COLUMN */}
          <Grid item xs={12} md={8} lg={9}>
            {selectedAppointment ? (
              <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3, height: '85vh', overflowY: 'auto', bgcolor: '#fff' }}>
                
                {/* HEADER */}
                <Grid container spacing={2} mb={2} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#f5f5f5', p: 1.5, borderRadius: 2 }}>
                      <PersonIcon sx={{ mr: 1.5, fontSize: 36, color: '#00796b' }} />
                      <Box><Typography variant="h5" fontWeight="bold" color="#333">Token #{selectedAppointment.tokenNumber}</Typography><Typography variant="body2" color="textSecondary">ID: {selectedAppointment.id} | Pt ID: {selectedAppointment.patientId}</Typography></Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} textAlign="right">
                    {selectedAppointment.status === 'VITALS_DONE' ? (<Button variant="contained" color="primary" onClick={() => handleStartConsultation(selectedAppointment.id)} sx={{ px: 3, py: 1 }}>Start</Button>) : selectedAppointment.status === 'COMPLETED' ? (<><Chip icon={<HistoryIcon />} label="Completed" color="default" sx={{ height: 40, fontSize: '1rem', pl: 1, mr: 1 }} /><Button variant="outlined" startIcon={<PdfIcon />} onClick={handleDownloadPDF}>Report</Button></>) : (<Chip label="In Progress" color="warning" sx={{ height: 40, fontSize: '1rem' }} />)}
                  </Grid>
                </Grid>
                <Divider sx={{ my: 2 }} />

                <div id="consultation-report">
                
                  {/* Vitals */}
                  <Box mb={2} p={2} bgcolor="#e3f2fd" borderRadius={2} border="1px solid #bbdefb">
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="#0d47a1">Vitals</Typography>
                    {selectedAppointment.vitalSigns ? (<Grid container spacing={2}><Grid item><Typography variant="body2">WT: {selectedAppointment.vitalSigns.weight}kg</Typography></Grid><Grid item><Typography variant="body2">HT: {selectedAppointment.vitalSigns.height}cm</Typography></Grid><Grid item><Typography variant="body2">BP: {selectedAppointment.vitalSigns.systolicBP}/{selectedAppointment.vitalSigns.diastolicBP}</Typography></Grid><Grid item><Typography variant="body2">TMP: {selectedAppointment.vitalSigns.temperature}°C</Typography></Grid></Grid>) : <Typography variant="body2">No vitals.</Typography>}
                  </Box>

                  {/* History */}
                  <Box mb={2}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Past History</Typography>
                    {history.length > 0 ? history.map((rec, i) => (<Card key={i} variant="outlined" sx={{ p: 1, mb: 1, bgcolor: '#fafafa', borderColor: '#eee' }}><Typography variant="caption" color="textSecondary">{rec.visitDate}</Typography><Typography variant="body2">{rec.diagnosis}</Typography></Card>)) : <Typography variant="body2" color="textSecondary">No history.</Typography>}
                  </Box>

                  {/* Consultation Form */}
                  <Box sx={{ opacity: 1 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField 
                          fullWidth multiline rows={2} label="Diagnosis" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} 
                          disabled={selectedAppointment.status === 'COMPLETED'}
                          InputProps={{ 
                            sx: { 
                              bgcolor: selectedAppointment.status === 'COMPLETED' ? '#fff' : 'inherit',
                              // FORCE DARKER TEXT
                              '& .MuiInputBase-input': {
                                color: '#000000',
                                WebkitTextFillColor: '#000000',
                                opacity: 1,
                                fontWeight: 500
                              },
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: selectedAppointment.status === 'COMPLETED' ? '#ccc' : undefined }
                            } 
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField 
                          fullWidth multiline rows={2} label="Doctor's Notes" value={notes} onChange={e => setNotes(e.target.value)}
                          disabled={selectedAppointment.status === 'COMPLETED'}
                          InputProps={{ 
                            sx: { 
                              bgcolor: selectedAppointment.status === 'COMPLETED' ? '#fff' : 'inherit',
                              // FORCE DARKER TEXT
                              '& .MuiInputBase-input': {
                                color: '#000000',
                                WebkitTextFillColor: '#000000',
                                opacity: 1,
                                fontWeight: 500
                              },
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: selectedAppointment.status === 'COMPLETED' ? '#ccc' : undefined }
                            } 
                          }}
                        />
                      </Grid>
                    </Grid>

                    <Box mt={2}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Prescription</Typography>
                      {prescriptions.map((med, i) => (
                        <Grid container spacing={1} key={i} mb={1} alignItems="center">
                          <Grid item xs={12} sm={3}><TextField fullWidth size="small" placeholder="Medicine" value={med.medicineName} onChange={e => handlePrescriptionChange(i, 'medicineName', e.target.value)} disabled={selectedAppointment.status === 'COMPLETED'} InputProps={{sx: { 
                                bgcolor: selectedAppointment.status === 'COMPLETED' ? '#fff' : 'inherit',
                                // FORCE DARKER TEXT
                                '& .MuiInputBase-input': {
                                  color: '#000000',
                                  WebkitTextFillColor: '#000000',
                                  opacity: 1,
                                  fontWeight: 500
                                }
                              }}}/></Grid>
                          <Grid item xs={6} sm={2}><TextField fullWidth size="small" placeholder="Dosage" value={med.dosage} onChange={e => handlePrescriptionChange(i, 'dosage', e.target.value)} disabled={selectedAppointment.status === 'COMPLETED'} InputProps={{sx: { 
                                bgcolor: selectedAppointment.status === 'COMPLETED' ? '#fff' : 'inherit',
                                '& .MuiInputBase-input': {
                                  color: '#000000',
                                  WebkitTextFillColor: '#000000',
                                  opacity: 1,
                                  fontWeight: 500
                                }
                              }}}/></Grid>
                          <Grid item xs={6} sm={3}><TextField fullWidth size="small" placeholder="Frequency" value={med.frequency} onChange={e => handlePrescriptionChange(i, 'frequency', e.target.value)} disabled={selectedAppointment.status === 'COMPLETED'} InputProps={{sx: { 
                                bgcolor: selectedAppointment.status === 'COMPLETED' ? '#fff' : 'inherit',
                                '& .MuiInputBase-input': {
                                  color: '#000000',
                                  WebkitTextFillColor: '#000000',
                                  opacity: 1,
                                  fontWeight: 500
                                }
                              }}}/></Grid>
                          <Grid item xs={6} sm={3}><TextField fullWidth size="small" placeholder="Duration" value={med.duration} onChange={e => handlePrescriptionChange(i, 'duration', e.target.value)} disabled={selectedAppointment.status === 'COMPLETED'} InputProps={{sx: { 
                                bgcolor: selectedAppointment.status === 'COMPLETED' ? '#fff' : 'inherit',
                                '& .MuiInputBase-input': {
                                  color: '#000000',
                                  WebkitTextFillColor: '#000000',
                                  opacity: 1,
                                  fontWeight: 500
                                }
                              }}}/></Grid>
                          <Grid item xs={6} sm={1}>{selectedAppointment.status !== 'COMPLETED' && (<IconButton onClick={() => removePrescriptionRow(i)} color="error"><DeleteIcon /></IconButton>)}</Grid>
                        </Grid>
                      ))}
                      {selectedAppointment.status !== 'COMPLETED' && (<Button variant="outlined" size="small" onClick={addPrescriptionRow} sx={{ mt: 1 }}>+ Add Medicine</Button>)}
                    </Box>
                  </Box>
                </div>
                
                {selectedAppointment.status !== 'COMPLETED' && (<Box mt={4} textAlign="right"><Button variant="contained" color="success" size="large" onClick={handleSaveAndComplete} disabled={loading} sx={{ px: 4, py: 1.5, borderRadius: 2 }}>{loading ? "Saving..." : "Save & Complete"}</Button></Box>)}
              </Paper>
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center', height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2, bgcolor: '#f9f9f9' }}>
                <Box>
                  {/* <LocalHospitalIcon sx={{ fontSize: 60, color: '#cfd8dc', mb: 2 }} /> */}
                  <Typography variant="h6" color="textSecondary">Select a patient to begin consultation.</Typography>
                </Box>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Container>
    </MainLayout>
  );
};

export default DoctorDashboard;
//-------------------------------------------------------------------------------------------------------
// import React, { useState, useEffect } from 'react';
// import html2pdf from 'html2pdf.js'; // Import the library
// import api from '../../services/api';
// import { 
//   Container, Grid, Paper, Typography, Button, List, ListItem, 
//   ListItemText, TextField, Box, Divider, IconButton, Card, 
//   Chip, Tabs, Tab, AppBar
// } from '@mui/material';
// import { Delete as DeleteIcon, Person as PersonIcon, LocalHospital as HospitalIcon, History as HistoryIcon, PictureAsPdf as PdfIcon } from '@mui/icons-material';
// import MainLayout from '../../components/Layout/MainLayout';

// const DoctorDashboard = () => {
//   const DOCTOR_ID = 1; 

//   // States
//   const [allAppointments, setAllAppointments] = useState([]);
//   const [selectedAppointment, setSelectedAppointment] = useState(null);
//   const [history, setHistory] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [diagnosis, setDiagnosis] = useState('');
//   const [notes, setNotes] = useState('');
//   const [prescriptions, setPrescriptions] = useState([{ medicineName: '', dosage: '', frequency: '', duration: '' }]);

//   // Filter State
//   const [tabValue, setTabValue] = useState('VITALS_DONE'); 

//   // Fetch ALL appointments
//   const fetchAllAppointments = () => {
//     api.get(`/api/appointment/doctor/${DOCTOR_ID}/all`)
//       .then(res => setAllAppointments(res.data))
//       .catch(console.error);
//   };

//   useEffect(() => { fetchAllAppointments(); }, []);

//   const getFilteredAppointments = () => {
//     if (tabValue === 'ALL') return allAppointments;
//     return allAppointments.filter(apt => apt.status === tabValue);
//   };
//   const filteredList = getFilteredAppointments();

//   const handleSelectPatient = (appointment) => {
//     setSelectedAppointment(appointment);
//     api.get(`/api/medical-record/patient/${appointment.patientId}`)
//       .then(res => setHistory(res.data))
//       .catch(console.error);

//     if (appointment.status === 'COMPLETED') {
//        api.get(`/api/medical-record/appointment/${appointment.id}`)
//           .then(res => {
//             const record = res.data;
//             setDiagnosis(record.diagnosis || '');
//             setNotes(record.notes || '');
//             setPrescriptions(record.prescriptions || []);
//           })
//           .catch(err => console.log("No record found"));
//     } else {
//       setDiagnosis(''); setNotes('');
//       setPrescriptions([{ medicineName: '', dosage: '', frequency: '', duration: '' }]);
//     }
//   };

//   const handleStartConsultation = async (appointmentId) => {
//     try {
//       await api.post(`/api/appointment/${appointmentId}/start`);
//       fetchAllAppointments();
//       setSelectedAppointment(prev => ({ ...prev, status: 'IN_PROGRESS' }));
//     } catch (err) { alert("Failed to start"); }
//   };

//   const handlePrescriptionChange = (index, field, value) => {
//     const newPrescriptions = [...prescriptions];
//     newPrescriptions[index][field] = value;
//     setPrescriptions(newPrescriptions);
//   };
//   const addPrescriptionRow = () => setPrescriptions([...prescriptions, { medicineName: '', dosage: '', frequency: '', duration: '' }]);
//   const removePrescriptionRow = (index) => setPrescriptions(prescriptions.filter((_, i) => i !== index));

//   const handleSaveAndComplete = async () => {
//     if (!selectedAppointment) return;
//     setLoading(true);
//     try {
//       const recordPayload = {
//         appointmentId: selectedAppointment.id, patientId: selectedAppointment.patientId, doctorId: DOCTOR_ID,
//         diagnosis, notes, prescriptions
//       };
//       await api.post('/api/medical-record', recordPayload);
//       await api.post(`/api/appointment/${selectedAppointment.id}/complete`);
//       alert("Saved!");
//       setSelectedAppointment(null); setHistory([]); fetchAllAppointments();
//     } catch (err) { alert("Error saving"); } finally { setLoading(false); }
//   };

//   // --- PDF GENERATION FUNCTION ---
//   const handleDownloadPDF = () => {
//     const element = document.getElementById('consultation-report');
//     const opt = {
//       margin:       0.5,
//       filename:     `Consultation_Token_${selectedAppointment.tokenNumber}.pdf`,
//       image:        { type: 'jpeg', quality: 0.98 },
//       html2canvas:  { scale: 2 },
//       jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
//     };

//     // Generate and Open in New Tab
//     html2pdf().set(opt).from(element).output('blob').then((blob) => {
//       const url = URL.createObjectURL(blob);
//       window.open(url, '_blank');
//     });
//   };

//   return (
//     <MainLayout title="Doctor Console">
//       <Container maxWidth="xl" sx={{ mt: 2 }}>
//         <Grid container spacing={3} justifyContent="center">
          
//           {/* LEFT COLUMN */}
//           <Grid item xs={12} md={4} lg={3}>
//             <Paper sx={{ height: '85vh', display: 'flex', flexDirection: 'column', borderRadius: 2, boxShadow: 3, overflow: 'hidden' }}>
//               <Box sx={{ bgcolor: '#e0f2f1', borderBottom: '1px solid #b2dfdb' }}>
//                 <Tabs value={tabValue} onChange={(e, newVal) => setTabValue(newVal)} variant="fullWidth" sx={{ minHeight: 50 }} TabIndicatorProps={{ style: { background: '#00796b' } }}>
//                   <Tab label="Ready" value="VITALS_DONE" sx={{ fontSize: '0.8rem', minHeight: 50 }} />
//                   <Tab label="Progress" value="IN_PROGRESS" sx={{ fontSize: '0.8rem', minHeight: 50 }} />
//                   <Tab label="Done" value="COMPLETED" sx={{ fontSize: '0.8rem', minHeight: 50 }} />
//                   <Tab label="All" value="ALL" sx={{ fontSize: '0.8rem', minHeight: 50 }} />
//                 </Tabs>
//               </Box>
//               <List sx={{ flexGrow: 1, overflowY: 'auto', p: 0, bgcolor: '#fafafa' }}>
//                 {filteredList.length === 0 && (
//                   <Box sx={{ p: 3, textAlign: 'center', color: '#999' }}>
//                     <Typography variant="body2">No appointments found.</Typography>
//                   </Box>
//                 )}
//                 {filteredList.map((apt) => (
//                   <ListItem button key={apt.id} onClick={() => handleSelectPatient(apt)} selected={selectedAppointment?.id === apt.id} divider
//                     sx={{ bgcolor: selectedAppointment?.id === apt.id ? '#e0f2f1' : 'white', borderBottom: '1px solid #eee', '&:hover': { bgcolor: '#f1f8e9' } }}
//                   >
//                     <ListItemText primary={<Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="subtitle2" fontWeight="bold">Token #{apt.tokenNumber}</Typography><Chip label={apt.status} size="small" color={apt.status === 'COMPLETED' ? 'default' : apt.status === 'IN_PROGRESS' ? 'warning' : 'success'} /></Box>} secondary={<Typography variant="caption" color="textSecondary">Pt ID: {apt.patientId}</Typography>} />
//                   </ListItem>
//                 ))}
//               </List>
//             </Paper>
//           </Grid>

//           {/* RIGHT COLUMN */}
//           <Grid item xs={12} md={8} lg={9}>
//             {selectedAppointment ? (
//               <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3, height: '85vh', overflowY: 'auto', bgcolor: '#fff' }}>
                
//                 {/* HEADER */}
//                 <Grid container spacing={2} mb={2} alignItems="center">
//                   <Grid item xs={12} sm={6}>
//                     <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#f5f5f5', p: 1.5, borderRadius: 2 }}>
//                       <PersonIcon sx={{ mr: 1.5, fontSize: 36, color: '#00796b' }} />
//                       <Box><Typography variant="h5" fontWeight="bold" color="#333">Token #{selectedAppointment.tokenNumber}</Typography><Typography variant="body2" color="textSecondary">ID: {selectedAppointment.id} | Pt ID: {selectedAppointment.patientId}</Typography></Box>
//                     </Box>
//                   </Grid>
//                   <Grid item xs={12} sm={6} textAlign="right">
//                     {selectedAppointment.status === 'VITALS_DONE' ? (<Button variant="contained" color="primary" onClick={() => handleStartConsultation(selectedAppointment.id)} sx={{ px: 3, py: 1 }}>Start</Button>) : selectedAppointment.status === 'COMPLETED' ? (<><Chip icon={<HistoryIcon />} label="Completed" color="default" sx={{ height: 40, fontSize: '1rem', pl: 1, mr: 1 }} /><Button variant="outlined" startIcon={<PdfIcon />} onClick={handleDownloadPDF}>Report</Button></>) : (<Chip label="In Progress" color="warning" sx={{ height: 40, fontSize: '1rem' }} />)}
//                   </Grid>
//                 </Grid>
//                 <Divider sx={{ my: 2 }} />

//                 {/* PDF CONTENT WRAPPER */}
//                 <div id="consultation-report">
                
//                   {/* Vitals */}
//                   <Box mb={2} p={2} bgcolor="#e3f2fd" borderRadius={2} border="1px solid #bbdefb">
//                     <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="#0d47a1">Vitals</Typography>
//                     {selectedAppointment.vitalSigns ? (<Grid container spacing={2}><Grid item><Typography variant="body2">WT: {selectedAppointment.vitalSigns.weight}kg</Typography></Grid><Grid item><Typography variant="body2">HT: {selectedAppointment.vitalSigns.height}cm</Typography></Grid><Grid item><Typography variant="body2">BP: {selectedAppointment.vitalSigns.systolicBP}/{selectedAppointment.vitalSigns.diastolicBP}</Typography></Grid><Grid item><Typography variant="body2">TMP: {selectedAppointment.vitalSigns.temperature}°C</Typography></Grid></Grid>) : <Typography variant="body2">No vitals.</Typography>}
//                   </Box>

//                   {/* History */}
//                   <Box mb={2}>
//                     <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Past History</Typography>
//                     {history.length > 0 ? history.map((rec, i) => (<Card key={i} variant="outlined" sx={{ p: 1, mb: 1, bgcolor: '#fafafa', borderColor: '#eee' }}><Typography variant="caption" color="textSecondary">{rec.visitDate}</Typography><Typography variant="body2">{rec.diagnosis}</Typography></Card>)) : <Typography variant="body2" color="textSecondary">No history.</Typography>}
//                   </Box>

//                   {/* Consultation Form */}
//                   <Box sx={{ opacity: selectedAppointment.status === 'COMPLETED' ? 1 : 1, pointerEvents: selectedAppointment.status === 'COMPLETED' ? 'none' : 'auto' }}>
//                     <Grid container spacing={2}>
//                       <Grid item xs={12}>
//                         <TextField 
//                           fullWidth multiline rows={2} label="Diagnosis" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} 
//                           // IMPROVED VISIBILITY FOR COMPLETED
//                           disabled={selectedAppointment.status === 'COMPLETED'}
//                           InputProps={{ 
//                             sx: { 
//                               bgcolor: selectedAppointment.status === 'COMPLETED' ? '#fff' : 'inherit',
//                               color: selectedAppointment.status === 'COMPLETED' ? '#000' : 'inherit',
//                               '& .MuiOutlinedInput-notchedOutline': { borderColor: selectedAppointment.status === 'COMPLETED' ? '#ccc' : undefined }
//                             } 
//                           }}
//                         />
//                       </Grid>
//                       <Grid item xs={12}>
//                         <TextField 
//                           fullWidth multiline rows={2} label="Doctor's Notes" value={notes} onChange={e => setNotes(e.target.value)}
//                           disabled={selectedAppointment.status === 'COMPLETED'}
//                           InputProps={{ 
//                             sx: { 
//                               bgcolor: selectedAppointment.status === 'COMPLETED' ? '#fff' : 'inherit',
//                               color: selectedAppointment.status === 'COMPLETED' ? '#000' : 'inherit',
//                               '& .MuiOutlinedInput-notchedOutline': { borderColor: selectedAppointment.status === 'COMPLETED' ? '#ccc' : undefined }
//                             } 
//                           }}
//                         />
//                       </Grid>
//                     </Grid>

//                     <Box mt={2}>
//                       <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Prescription</Typography>
//                       {prescriptions.map((med, i) => (
//                         <Grid container spacing={1} key={i} mb={1} alignItems="center">
//                           <Grid item xs={12} sm={3}><TextField fullWidth size="small" placeholder="Medicine" value={med.medicineName} onChange={e => handlePrescriptionChange(i, 'medicineName', e.target.value)} disabled={selectedAppointment.status === 'COMPLETED'} InputProps={{sx: { bgcolor: selectedAppointment.status === 'COMPLETED' ? '#fff' : 'inherit' }}}/></Grid>
//                           <Grid item xs={6} sm={2}><TextField fullWidth size="small" placeholder="Dosage" value={med.dosage} onChange={e => handlePrescriptionChange(i, 'dosage', e.target.value)} disabled={selectedAppointment.status === 'COMPLETED'} InputProps={{sx: { bgcolor: selectedAppointment.status === 'COMPLETED' ? '#fff' : 'inherit' }}}/></Grid>
//                           <Grid item xs={6} sm={3}><TextField fullWidth size="small" placeholder="Frequency" value={med.frequency} onChange={e => handlePrescriptionChange(i, 'frequency', e.target.value)} disabled={selectedAppointment.status === 'COMPLETED'} InputProps={{sx: { bgcolor: selectedAppointment.status === 'COMPLETED' ? '#fff' : 'inherit' }}}/></Grid>
//                           <Grid item xs={6} sm={3}><TextField fullWidth size="small" placeholder="Duration" value={med.duration} onChange={e => handlePrescriptionChange(i, 'duration', e.target.value)} disabled={selectedAppointment.status === 'COMPLETED'} InputProps={{sx: { bgcolor: selectedAppointment.status === 'COMPLETED' ? '#fff' : 'inherit' }}}/></Grid>
//                           <Grid item xs={6} sm={1}>{selectedAppointment.status !== 'COMPLETED' && (<IconButton onClick={() => removePrescriptionRow(i)} color="error"><DeleteIcon /></IconButton>)}</Grid>
//                         </Grid>
//                       ))}
//                       {selectedAppointment.status !== 'COMPLETED' && (<Button variant="outlined" size="small" onClick={addPrescriptionRow} sx={{ mt: 1 }}>+ Add Medicine</Button>)}
//                     </Box>
//                   </Box>
//                 </div>
                
//                 {selectedAppointment.status !== 'COMPLETED' && (<Box mt={4} textAlign="right"><Button variant="contained" color="success" size="large" onClick={handleSaveAndComplete} disabled={loading} sx={{ px: 4, py: 1.5, borderRadius: 2 }}>{loading ? "Saving..." : "Save & Complete"}</Button></Box>)}
//               </Paper>
//             ) : (
//               <Paper sx={{ p: 4, textAlign: 'center', height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2, bgcolor: '#f9f9f9' }}>
//                 <Box>
//                   {/* <LocalHospitalIcon sx={{ fontSize: 60, color: '#cfd8dc', mb: 2 }} /> */}
//                   <Typography variant="h6" color="textSecondary">Select a patient to begin consultation.</Typography>
//                 </Box>
//               </Paper>
//             )}
//           </Grid>
//         </Grid>
//       </Container>
//     </MainLayout>
//   );
// };

// export default DoctorDashboard;
//---------------------------------------------------------------------------------------------------------------------------
// import React, { useState, useEffect } from 'react';
// import api from '../../services/api';
// import { 
//   Container, Grid, Paper, Typography, Button, List, ListItem, 
//   ListItemText, TextField, Box, Divider, IconButton, Card, 
//   Chip, Tabs, Tab, AppBar
// } from '@mui/material';
// import { Delete as DeleteIcon, Person as PersonIcon, LocalHospital as HospitalIcon, History as HistoryIcon, Star as StarIcon, LocalOffer as OfferIcon } from '@mui/icons-material';
// import MainLayout from '../../components/Layout/MainLayout';

// const DoctorDashboard = () => {
//   const DOCTOR_ID = 1; 

//   // States
//   const [allAppointments, setAllAppointments] = useState([]);
//   const [selectedAppointment, setSelectedAppointment] = useState(null);
//   const [history, setHistory] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [diagnosis, setDiagnosis] = useState('');
//   const [notes, setNotes] = useState('');
//   const [prescriptions, setPrescriptions] = useState([{ medicineName: '', dosage: '', frequency: '', duration: '' }]);

//   // Filter State
//   const [tabValue, setTabValue] = useState('VITALS_DONE'); 

//   // Carousel State
//   const [currentSlide, setCurrentSlide] = useState(0);

//   // --- CAROUSEL DATA ---
//   const slides = [
//     {
//       type: 'Success Story',
//       title: "Complex Heart Surgery Success",
//       text: "Dr. Smith successfully performed a rare bypass surgery yesterday. Patient is recovering well.",
//       image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
//       color: "#4caf50"
//     },
//     {
//       type: 'Staff Spotlight',
//       title: "Nurse of the Month: Sarah",
//       text: "Join us in congratulating Nurse Sarah for her exceptional dedication to patient care this month!",
//       image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
//       color: "#2196f3"
//     },
//     {
//       type: 'Special Offer',
//       title: "50% Off on Health Checkups",
//       text: "Exclusive offer for staff members! Get a comprehensive health checkup at half price this week.",
//       image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
//       color: "#ff9800"
//     },
//     {
//       type: 'Technology',
//       title: "New MRI Scanner Installed",
//       text: "Radiology department now features the latest 3T MRI scanner for faster and more accurate diagnosis.",
//       image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
//       color: "#9c27b0"
//     }
//   ];

//   // --- AUTO ROTATE CAROUSEL ---
//   useEffect(() => {
//     const timer = setInterval(() => {
//       setCurrentSlide((prev) => (prev + 1) % slides.length);
//     }, 4000); // Change slide every 4 seconds
//     return () => clearInterval(timer);
//   }, []);

//   // Fetch ALL appointments
//   const fetchAllAppointments = () => {
//     api.get(`/api/appointment/doctor/${DOCTOR_ID}/all`)
//       .then(res => setAllAppointments(res.data))
//       .catch(console.error);
//   };

//   useEffect(() => { fetchAllAppointments(); }, []);

//   const getFilteredAppointments = () => {
//     if (tabValue === 'ALL') return allAppointments;
//     return allAppointments.filter(apt => apt.status === tabValue);
//   };
//   const filteredList = getFilteredAppointments();

//   const handleSelectPatient = (appointment) => {
//     setSelectedAppointment(appointment);
//     api.get(`/api/medical-record/patient/${appointment.patientId}`)
//       .then(res => setHistory(res.data))
//       .catch(console.error);

//     if (appointment.status === 'COMPLETED') {
//        api.get(`/api/medical-record/appointment/${appointment.id}`)
//           .then(res => {
//             const record = res.data;
//             setDiagnosis(record.diagnosis || '');
//             setNotes(record.notes || '');
//             setPrescriptions(record.prescriptions || []);
//           })
//           .catch(err => console.log("No record found"));
//     } else {
//       setDiagnosis(''); setNotes('');
//       setPrescriptions([{ medicineName: '', dosage: '', frequency: '', duration: '' }]);
//     }
//   };

//   const handleStartConsultation = async (appointmentId) => {
//     try {
//       await api.post(`/api/appointment/${appointmentId}/start`);
//       fetchAllAppointments();
//       setSelectedAppointment(prev => ({ ...prev, status: 'IN_PROGRESS' }));
//     } catch (err) { alert("Failed to start"); }
//   };

//   const handlePrescriptionChange = (index, field, value) => {
//     const newPrescriptions = [...prescriptions];
//     newPrescriptions[index][field] = value;
//     setPrescriptions(newPrescriptions);
//   };
//   const addPrescriptionRow = () => setPrescriptions([...prescriptions, { medicineName: '', dosage: '', frequency: '', duration: '' }]);
//   const removePrescriptionRow = (index) => setPrescriptions(prescriptions.filter((_, i) => i !== index));

//   const handleSaveAndComplete = async () => {
//     if (!selectedAppointment) return;
//     setLoading(true);
//     try {
//       const recordPayload = {
//         appointmentId: selectedAppointment.id, patientId: selectedAppointment.patientId, doctorId: DOCTOR_ID,
//         diagnosis, notes, prescriptions
//       };
//       await api.post('/api/medical-record', recordPayload);
//       await api.post(`/api/appointment/${selectedAppointment.id}/complete`);
//       alert("Saved!");
//       setSelectedAppointment(null); setHistory([]); fetchAllAppointments();
//     } catch (err) { alert("Error saving"); } finally { setLoading(false); }
//   };

//   return (
//     <MainLayout title="Doctor Console">
//       <Container maxWidth="xl" sx={{ mt: 2 }}>
//         <Grid container spacing={3} justifyContent="center">
          
//           {/* LEFT COLUMN */}
//           <Grid item xs={12} md={4} lg={3}>
//             <Paper sx={{ height: '85vh', display: 'flex', flexDirection: 'column', borderRadius: 2, boxShadow: 3, overflow: 'hidden' }}>
//               <Box sx={{ bgcolor: '#e0f2f1', borderBottom: '1px solid #b2dfdb' }}>
//                 <Tabs value={tabValue} onChange={(e, newVal) => setTabValue(newVal)} variant="fullWidth" sx={{ minHeight: 50 }} TabIndicatorProps={{ style: { background: '#00796b' } }}>
//                   <Tab label="Ready" value="VITALS_DONE" sx={{ fontSize: '0.8rem', minHeight: 50 }} />
//                   <Tab label="In Progress" value="IN_PROGRESS" sx={{ fontSize: '0.8rem', minHeight: 50 }} />
//                   <Tab label="Done" value="COMPLETED" sx={{ fontSize: '0.8rem', minHeight: 50 }} />
//                   <Tab label="All" value="ALL" sx={{ fontSize: '0.8rem', minHeight: 50 }} />
//                 </Tabs>
//               </Box>
//               <List sx={{ flexGrow: 1, overflowY: 'auto', p: 0, bgcolor: '#fafafa' }}>
//                 {filteredList.length === 0 && (
//                   <Box sx={{ p: 3, textAlign: 'center', color: '#999' }}>
//                     <Typography variant="body2">No appointments found.</Typography>
//                   </Box>
//                 )}
//                 {filteredList.map((apt) => (
//                   <ListItem button key={apt.id} onClick={() => handleSelectPatient(apt)} selected={selectedAppointment?.id === apt.id} divider
//                     sx={{ bgcolor: selectedAppointment?.id === apt.id ? '#e0f2f1' : 'white', borderBottom: '1px solid #eee', '&:hover': { bgcolor: '#f1f8e9' } }}
//                   >
//                     <ListItemText primary={<Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="subtitle2" fontWeight="bold">Token #{apt.tokenNumber}</Typography><Chip label={apt.status} size="small" color={apt.status === 'COMPLETED' ? 'default' : apt.status === 'IN_PROGRESS' ? 'warning' : 'success'} /></Box>} secondary={<Typography variant="caption" color="textSecondary">Pt ID: {apt.patientId}</Typography>} />
//                   </ListItem>
//                 ))}
//               </List>
//             </Paper>
//           </Grid>

//           {/* RIGHT COLUMN */}
//           <Grid item xs={12} md={8} lg={9}>
//             {selectedAppointment ? (
//               // --- APPOINTMENT DETAIL VIEW ---
//               <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3, height: '85vh', overflowY: 'auto', bgcolor: '#fff' }}>
//                 <Grid container spacing={2} mb={2} alignItems="center">
//                   <Grid item xs={12} sm={6}>
//                     <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#f5f5f5', p: 1.5, borderRadius: 2 }}>
//                       <PersonIcon sx={{ mr: 1.5, fontSize: 36, color: '#00796b' }} />
//                       <Box><Typography variant="h5" fontWeight="bold" color="#333">Token #{selectedAppointment.tokenNumber}</Typography><Typography variant="body2" color="textSecondary">ID: {selectedAppointment.id} | Pt ID: {selectedAppointment.patientId}</Typography></Box>
//                     </Box>
//                   </Grid>
//                   <Grid item xs={12} sm={6} textAlign="right">
//                     {selectedAppointment.status === 'VITALS_DONE' ? (<Button variant="contained" color="primary" onClick={() => handleStartConsultation(selectedAppointment.id)} sx={{ px: 3, py: 1 }}>Start Consultation</Button>) : selectedAppointment.status === 'COMPLETED' ? (<Chip icon={<HistoryIcon />} label="Completed Record" color="default" sx={{ height: 40, fontSize: '1rem', pl: 1 }} />) : (<Chip label="In Progress" color="warning" sx={{ height: 40, fontSize: '1rem' }} />)}
//                   </Grid>
//                 </Grid>
//                 <Divider sx={{ my: 2 }} />
//                 <Box mb={2} p={2} bgcolor="#e3f2fd" borderRadius={2} border="1px solid #bbdefb">
//                   <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="#0d47a1">Vitals</Typography>
//                   {selectedAppointment.vitalSigns ? (<Grid container spacing={2}><Grid item><Typography variant="body2">WT: {selectedAppointment.vitalSigns.weight}kg</Typography></Grid><Grid item><Typography variant="body2">HT: {selectedAppointment.vitalSigns.height}cm</Typography></Grid><Grid item><Typography variant="body2">BP: {selectedAppointment.vitalSigns.systolicBP}/{selectedAppointment.vitalSigns.diastolicBP}</Typography></Grid><Grid item><Typography variant="body2">TMP: {selectedAppointment.vitalSigns.temperature}°C</Typography></Grid></Grid>) : <Typography variant="body2">No vitals recorded.</Typography>}
//                 </Box>
//                 <Box mb={2}>
//                   <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Past History</Typography>
//                   {history.length > 0 ? history.map((rec, i) => (<Card key={i} variant="outlined" sx={{ p: 1, mb: 1, bgcolor: '#fafafa', borderColor: '#eee' }}><Typography variant="caption" color="textSecondary">{rec.visitDate}</Typography><Typography variant="body2">{rec.diagnosis}</Typography></Card>)) : <Typography variant="body2" color="textSecondary">No history found.</Typography>}
//                 </Box>
//                 <Box sx={{ opacity: selectedAppointment.status === 'COMPLETED' ? 0.7 : 1, pointerEvents: selectedAppointment.status === 'COMPLETED' ? 'none' : 'auto' }}>
//                   <Grid container spacing={2}><Grid item xs={12}><TextField fullWidth multiline rows={2} label="Diagnosis" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} /></Grid><Grid item xs={12}><TextField fullWidth multiline rows={2} label="Doctor's Notes" value={notes} onChange={e => setNotes(e.target.value)} /></Grid></Grid>
//                   <Box mt={2}>
//                     <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Prescription</Typography>
//                     {prescriptions.map((med, i) => (<Grid container spacing={1} key={i} mb={1} alignItems="center"><Grid item xs={12} sm={3}><TextField fullWidth size="small" placeholder="Medicine" value={med.medicineName} onChange={e => handlePrescriptionChange(i, 'medicineName', e.target.value)} disabled={selectedAppointment.status === 'COMPLETED'} /></Grid><Grid item xs={6} sm={2}><TextField fullWidth size="small" placeholder="Dosage" value={med.dosage} onChange={e => handlePrescriptionChange(i, 'dosage', e.target.value)} disabled={selectedAppointment.status === 'COMPLETED'} /></Grid><Grid item xs={6} sm={3}><TextField fullWidth size="small" placeholder="Frequency" value={med.frequency} onChange={e => handlePrescriptionChange(i, 'frequency', e.target.value)} disabled={selectedAppointment.status === 'COMPLETED'} /></Grid><Grid item xs={6} sm={3}><TextField fullWidth size="small" placeholder="Duration" value={med.duration} onChange={e => handlePrescriptionChange(i, 'duration', e.target.value)} disabled={selectedAppointment.status === 'COMPLETED'} /></Grid><Grid item xs={6} sm={1}>{selectedAppointment.status !== 'COMPLETED' && (<IconButton onClick={() => removePrescriptionRow(i)} color="error"><DeleteIcon /></IconButton>)}</Grid></Grid>))}
//                     {selectedAppointment.status !== 'COMPLETED' && (<Button variant="outlined" size="small" onClick={addPrescriptionRow} sx={{ mt: 1 }}>+ Add Medicine</Button>)}
//                   </Box>
//                 </Box>
//                 {selectedAppointment.status !== 'COMPLETED' && (<Box mt={4} textAlign="right"><Button variant="contained" color="success" size="large" onClick={handleSaveAndComplete} disabled={loading} sx={{ px: 4, py: 1.5, borderRadius: 2 }}>{loading ? "Saving..." : "Save & Complete"}</Button></Box>)}
//               </Paper>
//             ) : (
//               // --- CAROUSEL / EMPTY STATE VIEW ---
//               <Paper sx={{ height: '85vh', borderRadius: 2, overflow: 'hidden', position: 'relative', boxShadow: 3 }}>
//                 {/* Background Image with Transition */}
//                 <Box
//                   sx={{
//                     position: 'absolute',
//                     top: 0, left: 0, right: 0, bottom: 0,
//                     backgroundImage: `url(${slides[currentSlide].image})`,
//                     backgroundSize: 'cover',
//                     backgroundPosition: 'center',
//                     transition: 'opacity 1s ease-in-out',
//                     opacity: 1
//                   }}
//                 />
//                 {/* Dark Overlay for text readability */}
//                 <Box
//                   sx={{
//                     position: 'absolute',
//                     top: 0, left: 0, right: 0, bottom: 0,
//                     bgcolor: 'rgba(0, 0, 0, 0.5)',
//                     display: 'flex',
//                     alignItems: 'center',
//                     justifyContent: 'center'
//                   }}
//                 >
//                   {/* Content Card */}
//                   <Paper 
//                     elevation={6} 
//                     sx={{ 
//                       maxWidth: 600, 
//                       p: 4, 
//                       borderRadius: 3, 
//                       textAlign: 'center', 
//                       bgcolor: 'rgba(255, 255, 255, 0.95)',
//                       backdropFilter: 'blur(5px)',
//                       mx: 2
//                     }}
//                   >
//                     <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
//                       {slides[currentSlide].type === 'Success Story' && <StarIcon sx={{ fontSize: 40, color: slides[currentSlide].color }} />}
//                       {slides[currentSlide].type === 'Staff Spotlight' && <PersonIcon sx={{ fontSize: 40, color: slides[currentSlide].color }} />}
//                       {slides[currentSlide].type === 'Special Offer' && <OfferIcon sx={{ fontSize: 40, color: slides[currentSlide].color }} />}
//                       {/* {slides[currentSlide].type === 'Technology' && <LocalHospitalIcon sx={{ fontSize: 40, color: slides[currentSlide].color }} />} */}
//                     </Box>
                    
//                     <Typography variant="overline" sx={{ color: slides[currentSlide].color, fontWeight: 'bold', letterSpacing: 1, textTransform: 'uppercase' }}>
//                       {slides[currentSlide].type}
//                     </Typography>
                    
//                     <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: '#333' }}>
//                       {slides[currentSlide].title}
//                     </Typography>
                    
//                     <Typography variant="body1" sx={{ color: '#555', lineHeight: 1.6 }}>
//                       {slides[currentSlide].text}
//                     </Typography>

//                     {/* Carousel Indicators */}
//                     <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 3 }}>
//                       {slides.map((_, index) => (
//                         <Box
//                           key={index}
//                           sx={{
//                             width: 10,
//                             height: 10,
//                             borderRadius: '50%',
//                             bgcolor: index === currentSlide ? slides[currentSlide].color : '#ccc',
//                             transition: 'all 0.3s',
//                             cursor: 'pointer'
//                           }}
//                           onClick={() => setCurrentSlide(index)}
//                         />
//                       ))}
//                     </Box>
//                   </Paper>
//                 </Box>
//               </Paper>
//             )}
//           </Grid>
//         </Grid>
//       </Container>
//     </MainLayout>
//   );
// };

// export default DoctorDashboard;
//---------------------------------------------------------------------------------------------------------------------------
// import React, { useState, useEffect } from 'react';
// import api from '../../services/api';
// import { 
//   Container, Grid, Paper, Typography, Button, List, ListItem, 
//   ListItemText, TextField, Box, Divider, IconButton, Card, 
//   Chip, Tabs, Tab, AppBar
// } from '@mui/material';
// import { Delete as DeleteIcon, Person as PersonIcon, LocalHospital as HospitalIcon, History as HistoryIcon } from '@mui/icons-material';
// import MainLayout from '../../components/Layout/MainLayout';

// const DoctorDashboard = () => {
//   // In production, fetch this ID from '/api/doctor/my-profile'
//   const DOCTOR_ID = 1; 

//   // States
//   const [allAppointments, setAllAppointments] = useState([]);
//   const [selectedAppointment, setSelectedAppointment] = useState(null);
//   const [history, setHistory] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [diagnosis, setDiagnosis] = useState('');
//   const [notes, setNotes] = useState('');
//   const [prescriptions, setPrescriptions] = useState([{ medicineName: '', dosage: '', frequency: '', duration: '' }]);

//   // Filter State (Tab Selection)
//   const [tabValue, setTabValue] = useState('VITALS_DONE'); 

//   // Fetch ALL appointments on load
//   const fetchAllAppointments = () => {
//     api.get(`/api/appointment/doctor/${DOCTOR_ID}/all`)
//       .then(res => setAllAppointments(res.data))
//       .catch(console.error);
//   };

//   useEffect(() => {
//     fetchAllAppointments();
//   }, []);

//   // Filter Logic
//   const getFilteredAppointments = () => {
//     if (tabValue === 'ALL') return allAppointments;
//     return allAppointments.filter(apt => apt.status === tabValue);
//   };

//   const filteredList = getFilteredAppointments();

//   const handleSelectPatient = (appointment) => {
//     setSelectedAppointment(appointment);
    
//     // Fetch History for any patient selected
//     api.get(`/api/medical-record/patient/${appointment.patientId}`)
//       .then(res => setHistory(res.data))
//       .catch(console.error);

//     // If completed, load the specific medical record for this appointment to show what was done
//     if (appointment.status === 'COMPLETED') {
//        api.get(`/api/medical-record/appointment/${appointment.id}`)
//           .then(res => {
//             const record = res.data;
//             setDiagnosis(record.diagnosis || '');
//             setNotes(record.notes || '');
//             setPrescriptions(record.prescriptions || []);
//           })
//           .catch(err => console.log("No record found for this completed appointment"));
//     } else {
//       // Reset for new consultation
//       setDiagnosis(''); 
//       setNotes('');
//       setPrescriptions([{ medicineName: '', dosage: '', frequency: '', duration: '' }]);
//     }
//   };

//   const handleStartConsultation = async (appointmentId) => {
//     try {
//       await api.post(`/api/appointment/${appointmentId}/start`);
//       fetchAllAppointments(); // Refresh list to update status
//       setSelectedAppointment(prev => ({ ...prev, status: 'IN_PROGRESS' }));
//     } catch (err) { alert("Failed to start"); }
//   };

//   const handlePrescriptionChange = (index, field, value) => {
//     const newPrescriptions = [...prescriptions];
//     newPrescriptions[index][field] = value;
//     setPrescriptions(newPrescriptions);
//   };

//   const addPrescriptionRow = () => setPrescriptions([...prescriptions, { medicineName: '', dosage: '', frequency: '', duration: '' }]);
//   const removePrescriptionRow = (index) => setPrescriptions(prescriptions.filter((_, i) => i !== index));

//   const handleSaveAndComplete = async () => {
//     if (!selectedAppointment) return;
//     setLoading(true);
//     try {
//       const recordPayload = {
//         appointmentId: selectedAppointment.id, patientId: selectedAppointment.patientId, doctorId: DOCTOR_ID,
//         diagnosis, notes, prescriptions
//       };
//       await api.post('/api/medical-record', recordPayload);
//       await api.post(`/api/appointment/${selectedAppointment.id}/complete`);
//       alert("Saved!");
//       setSelectedAppointment(null); setHistory([]); fetchAllAppointments();
//     } catch (err) { alert("Error saving"); } finally { setLoading(false); }
//   };

//   return (
//     <MainLayout title="Doctor Console">
//       <Container maxWidth="xl" sx={{ mt: 2 }}>
//         <Grid container spacing={3} justifyContent="center">
          
//           {/* LEFT COLUMN: APPOINTMENT LIST & FILTERS */}
//           <Grid item xs={12} md={4} lg={3}>
//             <Paper sx={{ height: '85vh', display: 'flex', flexDirection: 'column', borderRadius: 2, boxShadow: 3, overflow: 'hidden' }}>
//               {/* FILTER TABS */}
//               <Box sx={{ bgcolor: '#e0f2f1', borderBottom: '1px solid #b2dfdb' }}>
//                 <Tabs 
//                   value={tabValue} 
//                   onChange={(e, newVal) => setTabValue(newVal)} 
//                   variant="fullWidth" 
//                   sx={{ minHeight: 50 }}
//                   TabIndicatorProps={{ style: { background: '#00796b' } }}
//                 >
//                   <Tab label="Ready" value="VITALS_DONE" sx={{ fontSize: '0.8rem', minHeight: 50 }} />
//                   <Tab label="In Progress" value="IN_PROGRESS" sx={{ fontSize: '0.8rem', minHeight: 50 }} />
//                   <Tab label="Done" value="COMPLETED" sx={{ fontSize: '0.8rem', minHeight: 50 }} />
//                   <Tab label="All" value="ALL" sx={{ fontSize: '0.8rem', minHeight: 50 }} />
//                 </Tabs>
//               </Box>

//               {/* LIST */}
//               <List sx={{ flexGrow: 1, overflowY: 'auto', p: 0, bgcolor: '#fafafa' }}>
//                 {filteredList.length === 0 && (
//                   <Box sx={{ p: 3, textAlign: 'center', color: '#999' }}>
//                     <Typography variant="body2">No appointments found.</Typography>
//                   </Box>
//                 )}
//                 {filteredList.map((apt) => (
//                   <ListItem 
//                     button key={apt.id} onClick={() => handleSelectPatient(apt)}
//                     selected={selectedAppointment?.id === apt.id} 
//                     divider
//                     sx={{ 
//                       bgcolor: selectedAppointment?.id === apt.id ? '#e0f2f1' : 'white',
//                       borderBottom: '1px solid #eee',
//                       '&:hover': { bgcolor: '#f1f8e9' }
//                     }}
//                   >
//                     <ListItemText 
//                       primary={
//                         <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
//                           <Typography variant="subtitle2" fontWeight="bold">Token #{apt.tokenNumber}</Typography>
//                           <Chip label={apt.status} size="small" 
//                             color={apt.status === 'COMPLETED' ? 'default' : apt.status === 'IN_PROGRESS' ? 'warning' : 'success'} />
//                         </Box>
//                       }
//                       secondary={
//                         <Typography variant="caption" color="textSecondary">
//                           Pt ID: {apt.patientId}
//                         </Typography>
//                       }
//                     />
//                   </ListItem>
//                 ))}
//               </List>
//             </Paper>
//           </Grid>

//           {/* RIGHT COLUMN: DETAILS */}
//           <Grid item xs={12} md={8} lg={9}>
//             {selectedAppointment ? (
//               <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3, height: '85vh', overflowY: 'auto', bgcolor: '#fff' }}>
                
//                 {/* Header */}
//                 <Grid container spacing={2} mb={2} alignItems="center">
//                   <Grid item xs={12} sm={6}>
//                     <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#f5f5f5', p: 1.5, borderRadius: 2 }}>
//                       <PersonIcon sx={{ mr: 1.5, fontSize: 36, color: '#00796b' }} />
//                       <Box>
//                         <Typography variant="h5" fontWeight="bold" color="#333">Token #{selectedAppointment.tokenNumber}</Typography>
//                         <Typography variant="body2" color="textSecondary">ID: {selectedAppointment.id} | Pt ID: {selectedAppointment.patientId}</Typography>
//                       </Box>
//                     </Box>
//                   </Grid>
//                   <Grid item xs={12} sm={6} textAlign="right">
//                     {selectedAppointment.status === 'VITALS_DONE' ? (
//                       <Button variant="contained" color="primary" onClick={() => handleStartConsultation(selectedAppointment.id)} sx={{ px: 3, py: 1 }}>
//                         Start Consultation
//                       </Button>
//                     ) : selectedAppointment.status === 'COMPLETED' ? (
//                        <Chip icon={<HistoryIcon />} label="Completed Record" color="default" sx={{ height: 40, fontSize: '1rem', pl: 1 }} />
//                     ) : (
//                       <Chip label="In Progress" color="warning" sx={{ height: 40, fontSize: '1rem' }} />
//                     )}
//                   </Grid>
//                 </Grid>

//                 <Divider sx={{ my: 2 }} />

//                 {/* Vitals Display */}
//                 <Box mb={2} p={2} bgcolor="#e3f2fd" borderRadius={2} border="1px solid #bbdefb">
//                   <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="#0d47a1">Vitals</Typography>
//                   {selectedAppointment.vitalSigns ? (
//                     <Grid container spacing={2}>
//                       <Grid item><Typography variant="body2">WT: {selectedAppointment.vitalSigns.weight}kg</Typography></Grid>
//                       <Grid item><Typography variant="body2">HT: {selectedAppointment.vitalSigns.height}cm</Typography></Grid>
//                       <Grid item><Typography variant="body2">BP: {selectedAppointment.vitalSigns.systolicBP}/{selectedAppointment.vitalSigns.diastolicBP}</Typography></Grid>
//                       <Grid item><Typography variant="body2">TMP: {selectedAppointment.vitalSigns.temperature}°C</Typography></Grid>
//                     </Grid>
//                   ) : <Typography variant="body2">No vitals recorded.</Typography>}
//                 </Box>

//                 {/* History */}
//                 <Box mb={2}>
//                   <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Past History</Typography>
//                   {history.length > 0 ? history.map((rec, i) => (
//                     <Card key={i} variant="outlined" sx={{ p: 1, mb: 1, bgcolor: '#fafafa', borderColor: '#eee' }}>
//                       <Typography variant="caption" color="textSecondary">{rec.visitDate}</Typography>
//                       <Typography variant="body2">{rec.diagnosis}</Typography>
//                     </Card>
//                   )) : <Typography variant="body2" color="textSecondary">No history found.</Typography>}
//                 </Box>

//                 {/* Consultation Form (Disabled if Completed) */}
//                 <Box sx={{ opacity: selectedAppointment.status === 'COMPLETED' ? 0.7 : 1, pointerEvents: selectedAppointment.status === 'COMPLETED' ? 'none' : 'auto' }}>
//                   <Grid container spacing={2}>
//                     <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Diagnosis" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} /></Grid>
//                     <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Doctor's Notes" value={notes} onChange={e => setNotes(e.target.value)} /></Grid>
//                   </Grid>

//                   <Box mt={2}>
//                     <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Prescription</Typography>
//                     {prescriptions.map((med, i) => (
//                       <Grid container spacing={1} key={i} mb={1} alignItems="center">
//                         <Grid item xs={12} sm={3}><TextField fullWidth size="small" placeholder="Medicine" value={med.medicineName} onChange={e => handlePrescriptionChange(i, 'medicineName', e.target.value)} disabled={selectedAppointment.status === 'COMPLETED'} /></Grid>
//                         <Grid item xs={6} sm={2}><TextField fullWidth size="small" placeholder="Dosage" value={med.dosage} onChange={e => handlePrescriptionChange(i, 'dosage', e.target.value)} disabled={selectedAppointment.status === 'COMPLETED'} /></Grid>
//                         <Grid item xs={6} sm={3}><TextField fullWidth size="small" placeholder="Frequency" value={med.frequency} onChange={e => handlePrescriptionChange(i, 'frequency', e.target.value)} disabled={selectedAppointment.status === 'COMPLETED'} /></Grid>
//                         <Grid item xs={6} sm={3}><TextField fullWidth size="small" placeholder="Duration" value={med.duration} onChange={e => handlePrescriptionChange(i, 'duration', e.target.value)} disabled={selectedAppointment.status === 'COMPLETED'} /></Grid>
//                         <Grid item xs={6} sm={1}>
//                           {selectedAppointment.status !== 'COMPLETED' && (
//                              <IconButton onClick={() => removePrescriptionRow(i)} color="error"><DeleteIcon /></IconButton>
//                           )}
//                         </Grid>
//                       </Grid>
//                     ))}
//                     {selectedAppointment.status !== 'COMPLETED' && (
//                        <Button variant="outlined" size="small" onClick={addPrescriptionRow} sx={{ mt: 1 }}>+ Add Medicine</Button>
//                     )}
//                   </Box>
//                 </Box>

//                 {selectedAppointment.status !== 'COMPLETED' && (
//                   <Box mt={4} textAlign="right">
//                     <Button variant="contained" color="success" size="large" onClick={handleSaveAndComplete} disabled={loading} sx={{ px: 4, py: 1.5, borderRadius: 2 }}>
//                       {loading ? "Saving..." : "Save & Complete"}
//                     </Button>
//                   </Box>
//                 )}
//               </Paper>
//             ) : (
//               <Paper sx={{ p: 4, textAlign: 'center', height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2, bgcolor: '#f9f9f9' }}>
//                 <Box>
//                   {/* <LocalHospitalIcon sx={{ fontSize: 60, color: '#cfd8dc', mb: 2 }} /> */}
//                   <Typography variant="h6" color="textSecondary">Select a patient from the list to view details.</Typography>
//                 </Box>
//               </Paper>
//             )}
//           </Grid>
//         </Grid>
//       </Container>
//     </MainLayout>
//   );
// };

// export default DoctorDashboard;

//--------------------------------------------------------------------------------------------------
// import React, { useState, useEffect } from 'react';
// import api from '../../services/api';
// import { 
//   Container, Grid, Paper, Typography, Button, List, ListItem, 
//   ListItemText, TextField, Box, Divider, IconButton, Card, Chip
// } from '@mui/material';
// import { Delete as DeleteIcon, Person as PersonIcon, LocalHospital as HospitalIcon } from '@mui/icons-material';
// import MainLayout from '../../components/Layout/MainLayout';

// const DoctorDashboard = () => {
//   const DOCTOR_ID = 1;
//   const [queue, setQueue] = useState([]);
//   const [selectedAppointment, setSelectedAppointment] = useState(null);
//   const [history, setHistory] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [diagnosis, setDiagnosis] = useState('');
//   const [notes, setNotes] = useState('');
//   const [prescriptions, setPrescriptions] = useState([{ medicineName: '', dosage: '', frequency: '', duration: '' }]);

//   const fetchQueue = () => {
//     api.get(`/api/appointment/doctor/${DOCTOR_ID}/queue`).then(res => setQueue(res.data)).catch(console.error);
//   };

//   useEffect(() => { fetchQueue(); }, []);

//   const handleSelectPatient = (appointment) => {
//     setSelectedAppointment(appointment);
//     setDiagnosis(''); setNotes('');
//     setPrescriptions([{ medicineName: '', dosage: '', frequency: '', duration: '' }]);
//     api.get(`/api/medical-record/patient/${appointment.patientId}`).then(res => setHistory(res.data)).catch(console.error);
//   };

//   const handleStartConsultation = async (appointmentId) => {
//     try {
//       await api.post(`/api/appointment/${appointmentId}/start`);
//       fetchQueue();
//       setSelectedAppointment(prev => ({ ...prev, status: 'IN_PROGRESS' }));
//     } catch (err) { alert("Failed to start"); }
//   };

//   const handlePrescriptionChange = (index, field, value) => {
//     const newPrescriptions = [...prescriptions];
//     newPrescriptions[index][field] = value;
//     setPrescriptions(newPrescriptions);
//   };

//   const addPrescriptionRow = () => setPrescriptions([...prescriptions, { medicineName: '', dosage: '', frequency: '', duration: '' }]);
//   const removePrescriptionRow = (index) => setPrescriptions(prescriptions.filter((_, i) => i !== index));

//   const handleSaveAndComplete = async () => {
//     if (!selectedAppointment) return;
//     setLoading(true);
//     try {
//       const recordPayload = {
//         appointmentId: selectedAppointment.id, patientId: selectedAppointment.patientId, doctorId: DOCTOR_ID,
//         diagnosis, notes, prescriptions
//       };
//       await api.post('/api/medical-record', recordPayload);
//       await api.post(`/api/appointment/${selectedAppointment.id}/complete`);
//       alert("Saved!");
//       setSelectedAppointment(null); setHistory([]); fetchQueue();
//     } catch (err) { alert("Error saving"); } finally { setLoading(false); }
//   };

//   return (
//     <MainLayout title="Doctor Consultation Room">
//       <Grid container spacing={3}>
//         {/* QUEUE COLUMN */}
//         <Grid item xs={12} md={4}>
//           <Paper sx={{ p: 2, height: '80vh', overflow: 'auto', borderRadius: 2, boxShadow: 3 }}>
//             <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, color: '#00796b' }}>
//               <HospitalIcon sx={{ mr: 1 }} />
//               <Typography variant="h6" fontWeight="bold">Patient Queue</Typography>
//             </Box>
//             <List>
//               {queue.length === 0 && <ListItem><ListItemText primary="Queue is empty" /></ListItem>}
//               {queue.map((apt) => (
//                 <ListItem 
//                   button key={apt.id} onClick={() => handleSelectPatient(apt)}
//                   selected={selectedAppointment?.id === apt.id} divider
//                   sx={{ borderRadius: 1, mb: 1, bgcolor: selectedAppointment?.id === apt.id ? '#e0f2f1' : 'inherit' }}
//                 >
//                   <ListItemText 
//                     primary={`Token: ${apt.tokenNumber}`} 
//                     secondary={<Chip label={apt.status} size="small" color={apt.status === 'IN_PROGRESS' ? 'warning' : 'success'} />}
//                   />
//                 </ListItem>
//               ))}
//             </List>
//           </Paper>
//         </Grid>

//         {/* CONSULTATION COLUMN */}
//         <Grid item xs={12} md={8}>
//           {selectedAppointment ? (
//             <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
//               <Grid container spacing={2} mb={2} alignItems="center">
//                 <Grid item xs={6}>
//                   <Box sx={{ display: 'flex', alignItems: 'center' }}>
//                     <PersonIcon sx={{ mr: 1, fontSize: 32, color: '#00796b' }} />
//                     <Box>
//                       <Typography variant="h5" fontWeight="bold">Token #{selectedAppointment.tokenNumber}</Typography>
//                       <Typography variant="body2" color="textSecondary">ID: {selectedAppointment.id}</Typography>
//                     </Box>
//                   </Box>
//                 </Grid>
//                 <Grid item xs={6} textAlign="right">
//                   {selectedAppointment.status === 'VITALS_DONE' ? (
//                     <Button variant="contained" color="primary" onClick={() => handleStartConsultation(selectedAppointment.id)}>
//                       Start Consultation
//                     </Button>
//                   ) : (
//                     <Chip label="In Progress" color="warning" />
//                   )}
//                 </Grid>
//               </Grid>

//               <Divider sx={{ my: 2 }} />

//               {/* Vitals Display */}
//               <Box mb={2} p={2} bgcolor="#f5f5f5" borderRadius={1}>
//                 <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Recent Vitals</Typography>
//                 {selectedAppointment.vitalSigns ? (
//                   <Grid container spacing={2}>
//                     <Grid item><Typography variant="body2">WT: {selectedAppointment.vitalSigns.weight}kg</Typography></Grid>
//                     <Grid item><Typography variant="body2">BP: {selectedAppointment.vitalSigns.systolicBP}/{selectedAppointment.vitalSigns.diastolicBP}</Typography></Grid>
//                     <Grid item><Typography variant="body2">TMP: {selectedAppointment.vitalSigns.temperature}°C</Typography></Grid>
//                   </Grid>
//                 ) : <Typography variant="body2">No vitals recorded.</Typography>}
//               </Box>

//               {/* History */}
//               <Box mb={2}>
//                 <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Past History</Typography>
//                 {history.length > 0 ? history.map((rec, i) => (
//                   <Card key={i} variant="outlined" sx={{ p: 1, mb: 1, bgcolor: '#fafafa' }}>
//                     <Typography variant="caption" color="textSecondary">{rec.visitDate}</Typography>
//                     <Typography variant="body2">{rec.diagnosis}</Typography>
//                   </Card>
//                 )) : <Typography variant="body2">No history.</Typography>}
//               </Box>

//               {/* Inputs */}
//               <Grid container spacing={2}>
//                 <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Diagnosis" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} /></Grid>
//                 <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Notes" value={notes} onChange={e => setNotes(e.target.value)} /></Grid>
//               </Grid>

//               {/* Rx */}
//               <Box mt={2}>
//                 <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Prescription</Typography>
//                 {prescriptions.map((med, i) => (
//                   <Grid container spacing={1} key={i} mb={1}>
//                     <Grid item xs={3}><TextField fullWidth size="small" placeholder="Medicine" value={med.medicineName} onChange={e => handlePrescriptionChange(i, 'medicineName', e.target.value)} /></Grid>
//                     <Grid item xs={2}><TextField fullWidth size="small" placeholder="Dosage" value={med.dosage} onChange={e => handlePrescriptionChange(i, 'dosage', e.target.value)} /></Grid>
//                     <Grid item xs={3}><TextField fullWidth size="small" placeholder="Frequency" value={med.frequency} onChange={e => handlePrescriptionChange(i, 'frequency', e.target.value)} /></Grid>
//                     <Grid item xs={3}><TextField fullWidth size="small" placeholder="Duration" value={med.duration} onChange={e => handlePrescriptionChange(i, 'duration', e.target.value)} /></Grid>
//                     <Grid item xs={1}><IconButton onClick={() => removePrescriptionRow(i)} color="error"><DeleteIcon /></IconButton></Grid>
//                   </Grid>
//                 ))}
//                 <Button variant="outlined" size="small" onClick={addPrescriptionRow}>+ Add Medicine</Button>
//               </Box>

//               <Box mt={3} textAlign="right">
//                 <Button variant="contained" color="success" size="large" onClick={handleSaveAndComplete} disabled={loading}>
//                   {loading ? "Saving..." : "Save & Complete"}
//                 </Button>
//               </Box>
//             </Paper>
//           ) : (
//             <Paper sx={{ p: 4, textAlign: 'center', height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2 }}>
//               <Typography variant="h6" color="textSecondary">Select a patient from the queue to begin.</Typography>
//             </Paper>
//           )}
//         </Grid>
//       </Grid>
//     </MainLayout>
//   );
// };

// export default DoctorDashboard;
//--------------------------------------------------------------------------------------------------------------------------------
// // import React, { useState, useEffect } from 'react';
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