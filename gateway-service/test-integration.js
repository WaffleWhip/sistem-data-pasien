const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let adminToken = '';
let userToken = '';
let adminUserId = '';
let regularUserId = '';
let createdDoctorId = '';
let createdPatientId = '';

const timestamp = Date.now();
const adminUser = {
    username: `admin_${timestamp}`,
    email: `admin_${timestamp}@test.com`,
    password: 'password123',
    role: 'admin'
};

const regularUser = {
    username: `user_${timestamp}`,
    email: `user_${timestamp}@test.com`,
    password: 'password123',
    role: 'user'
};

const log = (msg, type = 'info') => {
    const symbols = {
        info: 'ℹ️',
        success: '✅',
        error: '❌',
        warn: '⚠️'
    };
    console.log(`${symbols[type]} ${msg}`);
};

const runTest = async () => {
    console.log(`\n🚀 Starting Integration Test on ${BASE_URL}\n`);

    try {
        // 1. Health Check
        try {
            const health = await axios.get(`${BASE_URL}/health`);
            log(`Health Check: ${health.data.status}`, 'success');
        } catch (e) {
            log(`Health Check Failed: ${e.message}`, 'error');
            process.exit(1);
        }

        // ================= AUTHENTICATION =================

        // 2. Register Admin
        try {
            log(`Registering Admin: ${adminUser.username}...`);
            const res = await axios.post(`${BASE_URL}/api/auth/register`, adminUser);
            log(`Admin Registered: ${res.status === 201 ? 'OK' : res.status}`, 'success');
        } catch (e) {
            log(`Admin Registration Failed: ${e.response?.data?.error || e.message}`, 'error');
        }

        // 3. Login Admin
        try {
            log('Logging in Admin...');
            const res = await axios.post(`${BASE_URL}/api/auth/login`, {
                username: adminUser.username,
                password: adminUser.password
            });
            adminToken = res.data.data.token;
            adminUserId = res.data.data.user.id;
            log(`Admin Logged In. Token: ${adminToken.substring(0, 10)}...`, 'success');
        } catch (e) {
            log(`Admin Login Failed: ${e.response?.data?.error || e.message}`, 'error');
            process.exit(1);
        }

        // 4. Register Regular User
        try {
            log(`Registering User: ${regularUser.username}...`);
            const res = await axios.post(`${BASE_URL}/api/auth/register`, regularUser);
            log(`User Registered: ${res.status === 201 ? 'OK' : res.status}`, 'success');
        } catch (e) {
            log(`User Registration Failed: ${e.response?.data?.error || e.message}`, 'error');
        }

        // 5. Login Regular User
        try {
            log('Logging in User...');
            const res = await axios.post(`${BASE_URL}/api/auth/login`, {
                username: regularUser.username,
                password: regularUser.password
            });
            userToken = res.data.data.token;
            regularUserId = res.data.data.user.id;
            log(`User Logged In. Token: ${userToken.substring(0, 10)}...`, 'success');
        } catch (e) {
            log(`User Login Failed: ${e.response?.data?.error || e.message}`, 'error');
        }

        // ================= DOCTOR MANAGEMENT (ADMIN) =================

        // 6. Create Doctor (Admin)
        try {
            log('Creating Doctor (as Admin)...');
            const doctorData = {
                name: `Dr. Test ${timestamp}`,
                specialty: 'General Test',
                phone: '1234567890',
                email: `dr.${timestamp}@test.com`
            };
            const res = await axios.post(`${BASE_URL}/api/doctors`, doctorData, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            createdDoctorId = res.data.data._id;
            log(`Doctor Created. ID: ${createdDoctorId}`, 'success');
        } catch (e) {
            log(`Create Doctor Failed: ${e.response?.data?.error || e.message}`, 'error');
        }

        // 7. Get Doctors (Admin)
        try {
            log('Fetching Doctors (as Admin)...');
            const res = await axios.get(`${BASE_URL}/api/doctors`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            const found = res.data.find(d => d._id === createdDoctorId);
            if (found) log(`Doctor found in list: ${found.name}`, 'success');
            else log('Doctor NOT found in list', 'error');
        } catch (e) {
            log(`Get Doctors Failed: ${e.response?.data?.error || e.message}`, 'error');
        }

        // 8. Update Doctor (Admin)
        try {
            log('Updating Doctor (as Admin)...');
            const res = await axios.put(`${BASE_URL}/api/doctors/${createdDoctorId}`, {
                name: `Dr. Updated ${timestamp}`,
                specialty: 'Updated Specialty',
                phone: '0987654321'
            }, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            log(`Doctor Updated: ${res.data.data.name}`, 'success');
        } catch (e) {
            log(`Update Doctor Failed: ${e.response?.data?.error || e.message}`, 'error');
        }

        // 9. Doctor Access Check (User - Should Fail)
        try {
            log('Attempting to access Doctors (as User) - Should Fail...');
            await axios.get(`${BASE_URL}/api/doctors`, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            log('User ACCESSED Doctors (Unexpected)', 'error');
        } catch (e) {
            if (e.response && e.response.status === 403) {
                log('User correctly denied access to Doctors (403 Forbidden)', 'success');
            } else {
                log(`User Doctor Access failed with unexpected error: ${e.message}`, 'warn');
            }
        }

        // ================= PATIENT MANAGEMENT =================

        // 10. Create Patient (Admin - Linked to Regular User)
        try {
            log(`Creating Patient linked to User ID: ${regularUserId} (as Admin)...`);
            const patientData = {
                name: `Patient ${timestamp}`,
                age: 30,
                gender: 'Male',
                address: '123 Test St',
                phone: '555-0199000',
                diagnosis: 'Testing Syndrome',
                userId: regularUserId // Linking to the regular user
            };
            const res = await axios.post(`${BASE_URL}/api/patients`, patientData, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            createdPatientId = res.data.data._id;
            log(`Patient Created. ID: ${createdPatientId}`, 'success');
        } catch (e) {
            log(`Create Patient Failed: ${e.response?.data?.error || e.message}`, 'error');
            console.error(e.response?.data);
        }

        // 11. Create Patient (User - Should Fail)
        try {
            log('Attempting to Create Patient (as User) - Should Fail...');
            const patientData = {
                name: `User Patient ${timestamp}`,
                age: 25,
                gender: 'Female',
                address: '456 User Way',
                phone: '555-0188000',
                diagnosis: 'User Created',
                userId: regularUserId
            };
            await axios.post(`${BASE_URL}/api/patients`, patientData, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            log('User CREATED Patient (Unexpected)', 'error');
        } catch (e) {
            if (e.response && e.response.status === 403) {
                log('User correctly denied creation of Patient (403 Forbidden)', 'success');
            } else {
                log(`User Patient Create failed with unexpected error: ${e.message}`, 'warn');
            }
        }

        // 12. Get Patients (User - Should see own)
        try {
            log('Fetching Patients (as User)...');
            const res = await axios.get(`${BASE_URL}/api/patients`, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            const myPatient = res.data.find(p => p._id === createdPatientId);
            
            if (myPatient) {
                log(`User can see their patient record: ${myPatient.name}`, 'success');
            } else {
                log('User CANNOT see their patient record', 'error');
                console.log('Available patients:', res.data);
            }
        } catch (e) {
            log(`Get Patients (User) Failed: ${e.response?.data?.error || e.message}`, 'error');
        }

        // 13. Update Patient (User - Update own)
        try {
            log('Updating Patient (as User)...');
            // First fetch the patient to get all fields
            const getRes = await axios.get(`${BASE_URL}/api/patients/${createdPatientId}`, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            const originalPatient = getRes.data;

            const updatedData = {
                ...originalPatient,
                phone: '555-9999000' // Valid length
            };
            // Remove internal fields that shouldn't be sent back
            delete updatedData._id;
            delete updatedData.createdAt;
            delete updatedData.updatedAt;
            delete updatedData.__v;
            delete updatedData.createdBy;

            const res = await axios.put(`${BASE_URL}/api/patients/${createdPatientId}`, updatedData, {
                headers: { Authorization: `Bearer ${userToken}` }
            });
            
            if (res.data.data.phone === '555-9999000') {
                log('User successfully updated their patient record', 'success');
            } else {
                log('User update did not reflect changes', 'error');
            }
        } catch (e) {
            log(`Update Patient (User) Failed: ${e.response?.data?.error || e.message}`, 'error');
            console.error(JSON.stringify(e.response?.data, null, 2));
        }

        // ================= CLEANUP =================
        
        // 14. Delete Patient (Admin)
        try {
            log('Deleting Patient (as Admin)...');
            await axios.delete(`${BASE_URL}/api/patients/${createdPatientId}`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            log('Patient deleted successfully', 'success');
        } catch (e) {
            log(`Delete Patient Failed: ${e.response?.data?.error || e.message}`, 'error');
        }

        // 15. Delete Doctor (Admin)
        try {
            log('Deleting Doctor (as Admin)...');
            await axios.delete(`${BASE_URL}/api/doctors/${createdDoctorId}`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            log('Doctor deleted successfully', 'success');
        } catch (e) {
            log(`Delete Doctor Failed: ${e.response?.data?.error || e.message}`, 'error');
        }

        console.log('\n✨ Test Complete ✨');

    } catch (error) {
        console.error('Fatal Test Error:', error);
    }
};

runTest();
