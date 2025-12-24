require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Service URLs
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
const MAIN_SERVICE_URL = process.env.MAIN_SERVICE_URL || 'http://main-service:3002';

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes - Pages
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/dashboard', (req, res) => {
  res.render('dashboard');
});

app.get('/patients', (req, res) => {
  res.render('patients');
});

app.get('/doctors', (req, res) => {
  res.render('doctors');
});

app.get('/profile', (req, res) => {
  res.render('profile');
});

app.get('/my-visits', (req, res) => {
  res.render('my-visits');
});

app.get('/doctors-list', (req, res) => {
  res.render('doctors-list');
});

app.get('/referrals', (req, res) => {
  res.render('referrals');
});

// API Proxy Routes - Auth Service
app.post('/api/auth/register', async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/register`, req.body);
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json(error.response?.data || { success: false, message: 'Service tidak tersedia' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/login`, req.body);
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json(error.response?.data || { success: false, message: 'Service tidak tersedia' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const response = await axios.get(`${AUTH_SERVICE_URL}/api/auth/me`, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json(error.response?.data || { success: false, message: 'Service tidak tersedia' });
  }
});

app.get('/api/auth/verify', async (req, res) => {
  try {
    const response = await axios.get(`${AUTH_SERVICE_URL}/api/auth/verify`, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json(error.response?.data || { success: false, message: 'Service tidak tersedia' });
  }
});

app.post('/api/auth/check-email-phone', async (req, res) => {
  try {
    const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/check-email-phone`, req.body);
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json(error.response?.data || { success: false, message: 'Service tidak tersedia' });
  }
});

app.get('/api/auth/users', async (req, res) => {
  try {
    const response = await axios.get(`${AUTH_SERVICE_URL}/api/auth/users`, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json(error.response?.data || { success: false, message: 'Service tidak tersedia' });
  }
});

app.put('/api/auth/users/:id', async (req, res) => {
  try {
    const response = await axios.put(`${AUTH_SERVICE_URL}/api/auth/users/${req.params.id}`, req.body, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json(error.response?.data || { success: false, message: 'Service tidak tersedia' });
  }
});

app.delete('/api/auth/users/:id', async (req, res) => {
  try {
    const response = await axios.delete(`${AUTH_SERVICE_URL}/api/auth/users/${req.params.id}`, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json(error.response?.data || { success: false, message: 'Service tidak tersedia' });
  }
});

// API Proxy Routes - Main Service (Patients)
app.post('/api/patients/check-match', async (req, res) => {
  try {
    const response = await axios.post(`${MAIN_SERVICE_URL}/api/patients/check-match`, req.body);
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json(error.response?.data || { success: false, message: 'Service tidak tersedia' });
  }
});

app.post('/api/patients/auto-bind', async (req, res) => {
  try {
    const response = await axios.post(`${MAIN_SERVICE_URL}/api/patients/auto-bind`, req.body);
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json(error.response?.data || { success: false, message: 'Service tidak tersedia' });
  }
});

app.post('/api/patients/create-from-user', async (req, res) => {
  try {
    const response = await axios.post(`${MAIN_SERVICE_URL}/api/patients/create-from-user`, req.body, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json(error.response?.data || { success: false, message: 'Service tidak tersedia' });
  }
});

app.post('/api/patients/check-user-match', async (req, res) => {
  try {
    const response = await axios.post(`${MAIN_SERVICE_URL}/api/patients/check-user-match`, req.body, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json(error.response?.data || { success: false, message: 'Service tidak tersedia' });
  }
});

app.get('/api/patients/my-bind-requests', async (req, res) => {
  try {
    const response = await axios.get(`${MAIN_SERVICE_URL}/api/patients/my-bind-requests`, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json(error.response?.data || { success: false, message: 'Service tidak tersedia' });
  }
});

app.post('/api/patients/bind-request/approve', async (req, res) => {
  try {
    const response = await axios.post(`${MAIN_SERVICE_URL}/api/patients/bind-request/approve`, req.body, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json(error.response?.data || { success: false, message: 'Service tidak tersedia' });
  }
});

app.post('/api/patients/bind-request/reject', async (req, res) => {
  try {
    const response = await axios.post(`${MAIN_SERVICE_URL}/api/patients/bind-request/reject`, req.body, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json(error.response?.data || { success: false, message: 'Service tidak tersedia' });
  }
});

// API Proxy Routes - Notifications
app.get('/api/notifications', async (req, res) => {
  try {
    const response = await axios.get(`${MAIN_SERVICE_URL}/api/notifications`, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json(error.response?.data || { success: false, message: 'Service tidak tersedia' });
  }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const response = await axios.put(`${MAIN_SERVICE_URL}/api/notifications/${req.params.id}/read`, req.body, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json(error.response?.data || { success: false, message: 'Service tidak tersedia' });
  }
});

app.put('/api/notifications/read-all', async (req, res) => {
  try {
    const response = await axios.put(`${MAIN_SERVICE_URL}/api/notifications/read-all`, req.body, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json(error.response?.data || { success: false, message: 'Service tidak tersedia' });
  }
});

// API Proxy Routes - Visits
app.get('/api/visits', async (req, res) => {
  try {
    const response = await axios.get(`${MAIN_SERVICE_URL}/api/visits`, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json(error.response?.data || { success: false, message: 'Service tidak tersedia' });
  }
});

app.get('/api/visits/my-visits', async (req, res) => {
  try {
    const response = await axios.get(`${MAIN_SERVICE_URL}/api/visits/my-visits`, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json(error.response?.data || { success: false, message: 'Service tidak tersedia' });
  }
});

app.get('/api/visits/patient/:patientId', async (req, res) => {
  try {
    const response = await axios.get(`${MAIN_SERVICE_URL}/api/visits/patient/${req.params.patientId}`, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json(error.response?.data || { success: false, message: 'Service tidak tersedia' });
  }
});

app.post('/api/visits', async (req, res) => {
  try {
    const response = await axios.post(`${MAIN_SERVICE_URL}/api/visits`, req.body, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json(error.response?.data || { success: false, message: 'Service tidak tersedia' });
  }
});

app.put('/api/visits/:id', async (req, res) => {
  try {
    const response = await axios.put(`${MAIN_SERVICE_URL}/api/visits/${req.params.id}`, req.body, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json(error.response?.data || { success: false, message: 'Service tidak tersedia' });
  }
});

app.delete('/api/visits/:id', async (req, res) => {
  try {
    const response = await axios.delete(`${MAIN_SERVICE_URL}/api/visits/${req.params.id}`, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json(error.response?.data || { success: false, message: 'Service tidak tersedia' });
  }
});

app.get('/api/patients', async (req, res) => {
  try {
    const response = await axios.get(`${MAIN_SERVICE_URL}/api/patients`, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json(error.response?.data || { success: false, message: 'Service tidak tersedia' });
  }
});

app.get('/api/patients/search', async (req, res) => {
  try {
    const response = await axios.get(`${MAIN_SERVICE_URL}/api/patients/search`, {
      headers: { Authorization: req.headers.authorization },
      params: req.query
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json(error.response?.data || { success: false, message: 'Service tidak tersedia' });
  }
});

app.get('/api/patients/:id', async (req, res) => {
  try {
    const response = await axios.get(`${MAIN_SERVICE_URL}/api/patients/${req.params.id}`, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json(error.response?.data || { success: false, message: 'Service tidak tersedia' });
  }
});

app.post('/api/patients', async (req, res) => {
  try {
    const response = await axios.post(`${MAIN_SERVICE_URL}/api/patients`, req.body, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json(error.response?.data || { success: false, message: 'Service tidak tersedia' });
  }
});

app.put('/api/patients/:id', async (req, res) => {
  try {
    const response = await axios.put(`${MAIN_SERVICE_URL}/api/patients/${req.params.id}`, req.body, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json(error.response?.data || { success: false, message: 'Service tidak tersedia' });
  }
});

app.delete('/api/patients/:id', async (req, res) => {
  try {
    const response = await axios.delete(`${MAIN_SERVICE_URL}/api/patients/${req.params.id}`, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json(error.response?.data || { success: false, message: 'Service tidak tersedia' });
  }
});

// API Proxy Routes - Main Service (Doctors)
app.get('/api/doctors/public', async (req, res) => {
  try {
    const response = await axios.get(`${MAIN_SERVICE_URL}/api/doctors/public`, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json(error.response?.data || { success: false, message: 'Service tidak tersedia' });
  }
});

app.get('/api/doctors', async (req, res) => {
  try {
    const response = await axios.get(`${MAIN_SERVICE_URL}/api/doctors`, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json(error.response?.data || { success: false, message: 'Service tidak tersedia' });
  }
});

app.get('/api/doctors/search', async (req, res) => {
  try {
    const response = await axios.get(`${MAIN_SERVICE_URL}/api/doctors/search`, {
      headers: { Authorization: req.headers.authorization },
      params: req.query
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json(error.response?.data || { success: false, message: 'Service tidak tersedia' });
  }
});

app.get('/api/doctors/:id', async (req, res) => {
  try {
    const response = await axios.get(`${MAIN_SERVICE_URL}/api/doctors/${req.params.id}`, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json(error.response?.data || { success: false, message: 'Service tidak tersedia' });
  }
});

app.post('/api/doctors', async (req, res) => {
  try {
    const response = await axios.post(`${MAIN_SERVICE_URL}/api/doctors`, req.body, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json(error.response?.data || { success: false, message: 'Service tidak tersedia' });
  }
});

app.put('/api/doctors/:id', async (req, res) => {
  try {
    const response = await axios.put(`${MAIN_SERVICE_URL}/api/doctors/${req.params.id}`, req.body, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json(error.response?.data || { success: false, message: 'Service tidak tersedia' });
  }
});

app.delete('/api/doctors/:id', async (req, res) => {
  try {
    const response = await axios.delete(`${MAIN_SERVICE_URL}/api/doctors/${req.params.id}`, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json(error.response?.data || { success: false, message: 'Service tidak tersedia' });
  }
});

// Stats endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const response = await axios.get(`${MAIN_SERVICE_URL}/api/stats`, {
      headers: { Authorization: req.headers.authorization }
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json(error.response?.data || { success: false, message: 'Service tidak tersedia' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'frontend-gateway' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan server'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('404');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Frontend Gateway running on port ${PORT}`);
});
