const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const PATIENT_SERVICE_URL = process.env.PATIENT_SERVICE_URL || 'http://localhost:3002';
const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || 'http://localhost:3003';

console.log(' REAL Gateway Service Starting...');
console.log('Auth Service URL:', AUTH_SERVICE_URL);
console.log('Patient Service URL:', PATIENT_SERVICE_URL);
console.log('Doctor Service URL:', DOCTOR_SERVICE_URL);

// ========== HEALTH CHECK ==========
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'REAL Patient System Gateway',
        timestamp: new Date().toISOString(),
        services: {
            auth: AUTH_SERVICE_URL,
            patient: PATIENT_SERVICE_URL,
            doctor: DOCTOR_SERVICE_URL
        }
    });
});

// ========== ROOT ENDPOINT ==========
app.get('/', (req, res) => {
    res.json({ 
        message: 'Patient Data System - REAL Microservices Gateway',
        version: '2.0',
        description: 'This is REAL gateway connecting to actual microservices',
        endpoints: {
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                verify: 'POST /api/auth/verify'
            },
            patients: {
                getAll: 'GET /api/patients (requires token)',
                create: 'POST /api/patients (admin only)'
            },
            doctors: {
                getAll: 'GET /api/doctors (admin only)',
                create: 'POST /api/doctors (admin only)'
            }
        }
    });
});

// Middleware untuk verify token (internal to Gateway, calls Auth Service's /verify)
const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }
        
        console.log(' Verifying token...');
        const verifyResponse = await axios.post(AUTH_SERVICE_URL + '/verify', {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!verifyResponse.data.valid) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        
        // Attach user info from auth service to request
        req.user = {
            userId: verifyResponse.data.userId,
            role: verifyResponse.data.role
        };
        console.log(' User authenticated:', req.user.userId, 'Role:', req.user.role);
        
        // Pass user info to downstream services via a custom header
        req.headers['x-user-info'] = JSON.stringify(req.user);

        next();
    } catch (error) {
        console.error('Token verification error:', error.message);
        res.status(401).json({ error: 'Authentication failed' });
    }
};

// ========== AUTH ROUTES ==========
app.post('/api/auth/register', async (req, res) => {
    try {
        console.log(' Register request at Gateway - Incoming body:', req.body);
        const response = await axios.post(AUTH_SERVICE_URL + '/register', req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Register error:', error.message);
        res.status(error.response?.status || 500).json({
            error: 'Registration failed',
            details: error.response?.data || error.message
        });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        console.log(' Login request at Gateway - Incoming body:', req.body);
        const response = await axios.post(AUTH_SERVICE_URL + '/login', req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(error.response?.status || 500).json({
            error: 'Login failed',
            details: error.response?.data || error.message
        });
    }
});

app.post('/api/auth/logout', async (req, res) => {
    try {
        const response = await axios.post(AUTH_SERVICE_URL + '/logout');
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({
            error: 'Logout failed'
        });
    }
});

app.post('/api/auth/verify', async (req, res) => {
    try {
        console.log(' Verify request at Gateway - Incoming headers:', req.headers);
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ valid: false, error: 'No token provided' });
        }
        const response = await axios.post(AUTH_SERVICE_URL + '/verify', {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Verify error:', error.message);
        res.status(error.response?.status || 500).json({
            valid: false,
            error: 'Token verification failed'
        });
    }
});

app.get('/api/users', verifyToken, async (req, res) => {
    try {
        const response = await axios.get(AUTH_SERVICE_URL + '/users', {
            headers: { Authorization: req.headers.authorization }
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: 'Failed to fetch users' });
    }
});


// ========== PATIENT ROUTES ==========
app.get('/api/patients', verifyToken, async (req, res) => {
    try {
        console.log(' Get patients request by:', req.user.userId, 'with role:', req.user.role);
        
        const response = await axios.get(PATIENT_SERVICE_URL + '/patients', { headers: { 'x-user-info': req.headers['x-user-info'] } });
        res.json(response.data);
    } catch (error) {
        console.error('Get patients error:', error.message);
        res.status(error.response?.status || 500).json({ 
            error: 'Failed to fetch patients',
            details: error.response?.data || error.message
        });
    }
});

app.post('/api/patients', verifyToken, async (req, res) => {
    try {
        const response = await axios.post(PATIENT_SERVICE_URL + '/patients', req.body, { headers: { 'x-user-info': req.headers['x-user-info'] } });
        res.status(201).json(response.data);
    } catch (error) {
        console.error('Create patient error:', error.message);
        res.status(error.response?.status || 500).json({ 
            error: 'Failed to create patient',
            details: error.response?.data || error.message
        });
    }
});

app.get('/api/patients/:id', verifyToken, async (req, res) => {
    try {
        const response = await axios.get(PATIENT_SERVICE_URL + '/patients/' + req.params.id, { headers: { 'x-user-info': req.headers['x-user-info'] } });
        res.json(response.data);
    } catch (error) {
        console.error('Get single patient error:', error.message);
        res.status(error.response?.status || 500).json({ 
            error: 'Failed to fetch patient',
            details: error.response?.data || error.message
        });
    }
});

app.put('/api/patients/:id', verifyToken, async (req, res) => {
    try {
        const response = await axios.put(PATIENT_SERVICE_URL + '/patients/' + req.params.id, req.body, { headers: { 'x-user-info': req.headers['x-user-info'] } });
        res.json(response.data);
    } catch (error) {
        console.error('Update patient error:', error.message);
        res.status(error.response?.status || 500).json({ 
            error: 'Failed to update patient',
            details: error.response?.data || error.message
        });
    }
});

app.delete('/api/patients/:id', verifyToken, async (req, res) => {
    try {
        const response = await axios.delete(PATIENT_SERVICE_URL + '/patients/' + req.params.id, { headers: { 'x-user-info': req.headers['x-user-info'] } });
        res.json(response.data);
    } catch (error) {
        console.error('Delete patient error:', error.message);
        res.status(error.response?.status || 500).json({ 
            error: 'Failed to delete patient',
            details: error.response?.data || error.message
        });
    }
});

// ========== DOCTOR ROUTES ==========
const forwardToDoctorService = async (req, res) => {
    try {
        const { method, originalUrl, body } = req;
        const url = `${DOCTOR_SERVICE_URL}${originalUrl.replace('/api', '')}`;
        
        const response = await axios({
            method,
            url,
            data: body,
            headers: { 'x-user-info': req.headers['x-user-info'] }
        });
        
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error(`Doctor service error: ${error.message}`);
        res.status(error.response?.status || 500).json({
            error: `Failed to ${req.method} doctor`,
            details: error.response?.data || error.message
        });
    }
};

app.get('/api/doctors', verifyToken, forwardToDoctorService);
app.get('/api/doctors/:id', verifyToken, forwardToDoctorService);
app.post('/api/doctors', verifyToken, forwardToDoctorService);
app.put('/api/doctors/:id', verifyToken, forwardToDoctorService);
app.delete('/api/doctors/:id', verifyToken, forwardToDoctorService);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(' REAL Gateway Service running on port ' + PORT);
    console.log(' Connected to Auth Service:', AUTH_SERVICE_URL);
    console.log(' Connected to Patient Service:', PATIENT_SERVICE_URL);
    console.log(' Connected to Doctor Service:', DOCTOR_SERVICE_URL);
    console.log(' Ready to accept requests!');
});
