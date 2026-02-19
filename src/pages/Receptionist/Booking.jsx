import React, { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js'; // 1. Import library
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
  const [patient, setPatient] = useState(null); 
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [registerData, setRegisterData] = useState({
    name: '',
    dateOfBirth: '',
    contactNumber: ''
  });

  // --- Booking State ---
  const [specialty, setSpecialty] = useState('');
  const [specialties, setSpecialties] = useState([]); 
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [message, setMessage] = useState('');

  // 0. Fetch All Specialties on Load
  useEffect(() => {
    api.get('/api/doctor/specialties')
      .then(res => setSpecialties(res.data))
      .catch(err => console.error("Failed to load specialties", err));
  }, []);

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
      setPatient(response.data); 
      setShowRegisterForm(false);
      setSearchError('');
    } catch (err) {
      setSearchError('Failed to register patient.');
    }
  };

  // 3. Fetch Doctors when Specialty changes
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

    // --- PDF GENERATION FUNCTION ---
  const generateAppointmentSlip = (tokenNumber) => {
    // Find Doctor Name from the list
    const doctorObj = doctors.find(d => d.id === parseInt(selectedDoctor));
    const doctorName = doctorObj ? doctorObj.name : "Unknown Doctor";
    
    // Current Date and Time
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();

    // Create a temporary element to render the PDF content
    const element = document.createElement('div');
    
    // Style it to look like a receipt
    element.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 15px; text-align: center; border: 2px solid #00796b; border-radius: 10px; max-width: 100%; margin: auto; box-sizing: border-box;">
        <h2 style="color: #00796b; margin: 0; font-size: 24px;">CRESCENT</h2>
        <h4 style="color: #555; margin: 5px 0 15px 0; font-size: 14px;">HOSPITAL MANAGEMENT</h4>
        <hr style="border: 1px solid #00796b; margin-bottom: 10px;">
        
        <h4 style="color: #333; margin: 0 0 15px 0; font-size: 18px; text-transform: uppercase;">Appointment Slip</h4>
        
        <table style="width: 100%; table-layout: fixed; border-collapse: collapse; margin-top: 0px; text-align: left; color: #333;">
          <tr>
            <!-- Fixed width columns ensure the receipt width stays constant -->
            <td style="padding: 8px 5px; width: 40%; color: #555; font-size: 13px; font-weight: bold; vertical-align: top;">Token No:</td>
            <td style="padding: 8px 5px; width: 60%; font-weight: bold; color: #00796b; font-size: 18px; vertical-align: top; word-break: break-word;">#${tokenNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 5px; color: #555; font-size: 13px; font-weight: bold; vertical-align: top;">Date:</td>
            <td style="padding: 8px 5px; font-size: 13px; vertical-align: top; word-break: break-word;">${dateStr}</td>
          </tr>
          <tr>
            <td style="padding: 8px 5px; color: #555; font-size: 13px; font-weight: bold; vertical-align: top;">Time:</td>
            <td style="padding: 8px 5px; font-size: 13px; vertical-align: top; word-break: break-word;">${timeStr}</td>
          </tr>
          <tr>
            <td style="padding: 8px 5px; color: #555; font-size: 13px; font-weight: bold; vertical-align: top;">Department:</td>
            <td style="padding: 8px 5px; font-size: 13px; vertical-align: top; word-break: break-word; text-transform: capitalize;">${specialty}</td>
          </tr>
          <tr>
            <td style="padding: 8px 5px; color: #555; font-size: 13px; font-weight: bold; vertical-align: top;">Doctor:</td>
            <!-- word-break: break-word handles long names automatically -->
            <td style="padding: 8px 5px; font-size: 13px; vertical-align: top; word-break: break-word;">${doctorName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 5px; color: #555; font-size: 13px; font-weight: bold; vertical-align: top;">Patient:</td>
            <td style="padding: 8px 5px; font-size: 13px; vertical-align: top; word-break: break-word;">${patient.name}</td>
          </tr>
        </table>

        <div style="margin-top: 20px; color: #777; font-size: 11px; line-height: 1.4;">
          <p style="margin: 0;">Please present this slip at the Nurse Station.</p>
          <p style="margin: 5px 0 0 0;">Thank you for choosing Crescent Hospital.</p>
        </div>
      </div>
    `;

    // PDF Configuration
    const opt = {
      margin:       10,
      filename:     `Appointment_Token_${tokenNumber}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      // Increased height to 300mm so long names don't get cut off at the bottom
      jsPDF:        { unit: 'mm', format: [80, 155], orientation: 'portrait' } 
    };

    // Generate and Open
    html2pdf().set(opt).from(element).output('blob').then((blob) => {
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    });
  };
  // // --- PDF GENERATION FUNCTION ---
  // const generateAppointmentSlip = (tokenNumber) => {
  //   // Find Doctor Name from the list
  //   const doctorObj = doctors.find(d => d.id === parseInt(selectedDoctor));
  //   const doctorName = doctorObj ? doctorObj.name : "Unknown Doctor";
    
  //   // Current Date and Time
  //   const now = new Date();
  //   const dateStr = now.toLocaleDateString();
  //   const timeStr = now.toLocaleTimeString();

  //   // Create a temporary element to render the PDF content
  //   const element = document.createElement('div');
    
  //   // Style it to look like a receipt
  //   element.innerHTML = `
  //     <div style="font-family: Arial, sans-serif; padding: 10px; text-align: center; border: 2px solid #00796b; border-radius: 10px; max-width: 750px; margin: auto;">
  //       <h2 style="color: #00796b; margin: 0;">CRESCENT</h2>
  //       <h4 style="color: #555; margin: 5px 0 20px 0;">HOSPITAL MANAGEMENT</h4>
  //       <hr style="border: 1px solid #00796b; margin-bottom: 1px;">
  //       <h4 style="color: #333;">Appointment Slip</h4>
  //       <table style="width: 50%; margin-top: 1px; text-align: left; font-size: 16px; color: #333;">
  //         <tr>
  //           <td style="padding: 1px;"><strong>Token No:</strong></td>
  //           <td style="padding: 1px; font-weight: bold; color: #00796b; font-size: 20px;">#${tokenNumber}</td>
  //         </tr>
  //         <tr>
  //           <td style="padding: 1px;"><strong>Date:</strong></td>
  //           <td style="padding: 1px;">${dateStr}</td>
  //         </tr>
  //         <tr>
  //           <td style="padding: 1px;"><strong>Time:</strong></td>
  //           <td style="padding: 1px;">${timeStr}</td>
  //         </tr>
  //         <tr>
  //           <td style="padding: 1px;"><strong>Department:</strong></td>
  //           <td style="padding: 1px; text-transform: capitalize;">${specialty}</td>
  //         </tr>
  //         <tr>
  //           <td style="padding: 1px;"><strong>Doctor:</strong></td>
  //           <td style="padding: 1px;">${doctorName}</td>
  //         </tr>
  //         <tr>
  //           <td style="padding: 1px;"><strong>Patient:</strong></td>
  //           <td style="padding: 1px;">${patient.name}</td>
  //         </tr>
  //       </table>

  //       <div style="margin-top: 20px; color: #777; font-size: 12px;">
  //         <p>Please present this slip at the Nurse Station.</p>
  //         <p>Thank you for choosing Crescent Hospital.</p>
  //       </div>
  //     </div>
  //   `;

  //   // PDF Configuration
  //   const opt = {
  //     margin:       10,
  //     filename:     `Appointment_Token_${tokenNumber}.pdf`,
  //     image:        { type: 'jpeg', quality: 0.98 },
  //     html2canvas:  { scale: 2 },
  //     jsPDF:        { unit: 'mm', format: [80, 150], orientation: 'portrait' } // Small receipt size
  //   };

  //   // Generate and Open
  //   html2pdf().set(opt).from(element).output('blob').then((blob) => {
  //     const url = URL.createObjectURL(blob);
  //     window.open(url, '_blank');
  //   });
  // };

  // 4. Book Appointment
  const handleBook = async () => {
    if (!selectedDoctor || !patient) return;
    try {
      const response = await api.post('/api/appointment/book', {
        patientId: patient.id,
        doctorId: parseInt(selectedDoctor)
      });
      
      const tokenNumber = response.data.tokenNumber;
      
      // Generate PDF Slip
      generateAppointmentSlip(tokenNumber);

      setMessage(`Appointment Booked! Token Number: ${tokenNumber}`);
      
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
          
          {patient && !showRegisterForm && (
            <Alert severity="success" sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">{patient.name}</Typography>
                <Typography variant="body2">ID: {patient.nationalId} | DOB: {patient.dateOfBirth}</Typography>
              </Box>
            </Alert>
          )}
        </Paper>

        {/* --- SECTION 2: REGISTRATION FORM --- */}
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

        {/* --- SECTION 3: BOOKING FORM --- */}
        {patient && !showRegisterForm && (
          <Paper elevation={4} sx={{ width: '100%', maxWidth: 600, p: 4, mt: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" color="#333" gutterBottom>
              Book Appointment for {patient.name}
            </Typography>
            
            <TextField
              fullWidth select label="Specialty" value={specialty}
              onChange={(e) => setSpecialty(e.target.value)} sx={{ mb: 3 }}
            >
              {specialties.map((spec) => (
                <MenuItem key={spec} value={spec}>
                  {spec}
                </MenuItem>
              ))}
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
//------------------------------------------------------
// import React, { useState, useEffect } from 'react';
// import api from '../../services/api';
// import { 
//   Typography, TextField, Button, MenuItem, Box, Paper, Alert, 
//   Grid, CircularProgress, Chip 
// } from '@mui/material';
// import { Search as SearchIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material';
// import MainLayout from '../../components/Layout/MainLayout';

// const ReceptionistBooking = () => {
//   // --- Search State ---
//   const [nationalId, setNationalId] = useState('');
//   const [searchLoading, setSearchLoading] = useState(false);
//   const [searchError, setSearchError] = useState('');
  
//   // --- Patient State ---
//   const [patient, setPatient] = useState(null); 
//   const [showRegisterForm, setShowRegisterForm] = useState(false);
//   const [registerData, setRegisterData] = useState({
//     name: '',
//     dateOfBirth: '',
//     contactNumber: ''
//   });

//   // --- Booking State ---
//   const [specialty, setSpecialty] = useState('');
//   const [specialties, setSpecialties] = useState([]); // NEW: List of all specialties
//   const [doctors, setDoctors] = useState([]);
//   const [selectedDoctor, setSelectedDoctor] = useState('');
//   const [message, setMessage] = useState('');

//   // 0. Fetch All Specialties on Load
//   useEffect(() => {
//     api.get('/api/doctor/specialties')
//       .then(res => setSpecialties(res.data))
//       .catch(err => console.error("Failed to load specialties", err));
//   }, []);

//   // 1. Search Patient
//   const handleSearch = async () => {
//     if (!nationalId) return;
    
//     setSearchLoading(true);
//     setSearchError('');
//     setPatient(null);
//     setShowRegisterForm(false);

//     try {
//       const response = await api.get(`/api/patient/search?nationalId=${nationalId}`);
//       setPatient(response.data);
//     } catch (err) {
//       if (err.response && err.response.status === 404) {
//         setShowRegisterForm(true);
//         setSearchError('Patient not found. Please register.');
//       } else {
//         setSearchError('Error searching patient.');
//       }
//     } finally {
//       setSearchLoading(false);
//     }
//   };

//   // 2. Register New Patient
//   const handleRegister = async (e) => {
//     e.preventDefault();
//     try {
//       const payload = {
//         ...registerData,
//         nationalId: nationalId
//       };
//       const response = await api.post('/api/patient/register', payload);
//       setPatient(response.data); 
//       setShowRegisterForm(false);
//       setSearchError('');
//     } catch (err) {
//       setSearchError('Failed to register patient.');
//     }
//   };

//   // 3. Fetch Doctors when Specialty changes
//   useEffect(() => {
//     if (specialty) {
//       api.get(`/api/doctor/list/${specialty}`)
//         .then(res => setDoctors(res.data))
//         .catch(err => console.error(err));
//     } else {
//       setDoctors([]);
//       setSelectedDoctor('');
//     }
//   }, [specialty]);

//   // 4. Book Appointment
//   const handleBook = async () => {
//     if (!selectedDoctor || !patient) return;
//     try {
//       const response = await api.post('/api/appointment/book', {
//         patientId: patient.id,
//         doctorId: parseInt(selectedDoctor)
//       });
//       setMessage(`Appointment Booked! Token Number: ${response.data.tokenNumber}`);
//       setSpecialty('');
//       setSelectedDoctor('');
//       setDoctors([]);
//     } catch (err) {
//       setMessage('Error booking appointment');
//     }
//   };

//   return (
//     <MainLayout title="Receptionist Desk">
//       <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '70vh' }}>
        
//         {/* --- SECTION 1: PATIENT SEARCH CARD --- */}
//         <Paper 
//           elevation={6} 
//           sx={{ 
//             width: '100%', 
//             maxWidth: 600, 
//             p: 4, 
//             borderRadius: 3,
//             boxShadow: '0px 10px 25px rgba(0,0,0,0.1)'
//           }}
//         >
//           <Typography variant="h6" fontWeight="bold" color="#00796b" gutterBottom>
//             Patient Identification
//           </Typography>
//           <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
//             <TextField
//               fullWidth
//               label="National ID"
//               value={nationalId}
//               onChange={(e) => setNationalId(e.target.value)}
//               onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
//             />
//             <Button 
//               variant="contained" 
//               onClick={handleSearch} 
//               disabled={searchLoading}
//               sx={{ bgcolor: '#00796b', minWidth: 100 }}
//             >
//               {searchLoading ? <CircularProgress size={24} color="inherit" /> : <SearchIcon />}
//             </Button>
//           </Box>
//           {searchError && <Alert severity="warning" sx={{ mt: 2 }}>{searchError}</Alert>}
          
//           {patient && !showRegisterForm && (
//             <Alert severity="success" sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
//               <Box>
//                 <Typography variant="subtitle1" fontWeight="bold">{patient.name}</Typography>
//                 <Typography variant="body2">ID: {patient.nationalId} | DOB: {patient.dateOfBirth}</Typography>
//               </Box>
//             </Alert>
//           )}
//         </Paper>

//         {/* --- SECTION 2: REGISTRATION FORM --- */}
//         {showRegisterForm && (
//           <Paper elevation={4} sx={{ width: '100%', maxWidth: 600, p: 4, mt: 3, borderRadius: 3, border: '2px dashed #00796b' }}>
//             <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
//               <PersonAddIcon sx={{ mr: 1, color: '#00796b' }} />
//               <Typography variant="h6" fontWeight="bold">Register New Patient</Typography>
//             </Box>
            
//             <Grid container spacing={2}>
//               <Grid item xs={12}>
//                 <TextField 
//                   fullWidth label="Full Name" 
//                   value={registerData.name}
//                   onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
//                   required 
//                 />
//               </Grid>
//               <Grid item xs={6}>
//                 <TextField 
//                   fullWidth label="Date of Birth" type="date" 
//                   InputLabelProps={{ shrink: true }}
//                   value={registerData.dateOfBirth}
//                   onChange={(e) => setRegisterData({...registerData, dateOfBirth: e.target.value})}
//                   required 
//                 />
//               </Grid>
//               <Grid item xs={6}>
//                 <TextField 
//                   fullWidth label="Contact Number" 
//                   value={registerData.contactNumber}
//                   onChange={(e) => setRegisterData({...registerData, contactNumber: e.target.value})}
//                   required 
//                 />
//               </Grid>
//               <Grid item xs={12}>
//                 <Button fullWidth variant="contained" color="primary" onClick={handleRegister} sx={{ py: 1.5 }}>
//                   Register Patient
//                 </Button>
//               </Grid>
//             </Grid>
//           </Paper>
//         )}

//         {/* --- SECTION 3: BOOKING FORM --- */}
//         {patient && !showRegisterForm && (
//           <Paper elevation={4} sx={{ width: '100%', maxWidth: 600, p: 4, mt: 3, borderRadius: 3 }}>
//             <Typography variant="h6" fontWeight="bold" color="#333" gutterBottom>
//               Book Appointment for {patient.name}
//             </Typography>
            
//             <TextField
//               fullWidth select label="Specialty" value={specialty}
//               onChange={(e) => setSpecialty(e.target.value)} sx={{ mb: 3 }}
//             >
//               {/* DYNAMIC MAPPING OF SPECIALTIES */}
//               {specialties.map((spec) => (
//                 <MenuItem key={spec} value={spec}>
//                   {spec}
//                 </MenuItem>
//               ))}
//             </TextField>

//             <TextField
//               fullWidth select label="Select Doctor" value={selectedDoctor}
//               onChange={(e) => setSelectedDoctor(e.target.value)} disabled={!specialty} sx={{ mb: 3 }}
//             >
//               {doctors.map((doc) => (
//                 <MenuItem key={doc.id} value={doc.id}>{doc.name}</MenuItem>
//               ))}
//             </TextField>

//             <Button 
//               fullWidth variant="contained" onClick={handleBook} disabled={!selectedDoctor}
//               sx={{ py: 1.5, bgcolor: '#00796b', fontSize: '16px', borderRadius: 2 }}
//             >
//               Confirm Booking
//             </Button>

//             {message && <Alert severity="success" sx={{ mt: 3, textAlign: 'center' }}>{message}</Alert>}
//           </Paper>
//         )}
        
//       </Box>
//     </MainLayout>
//   );
// };

// export default ReceptionistBooking;