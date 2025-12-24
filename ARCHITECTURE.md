# ARCHITECTURE - Cara Kerja Sistem Detail

Dokumentasi lengkap tentang arsitektur sistem, komponen, dan cara kerjanya.

## 🏗️ Arsitektur Sistem Keseluruhan

```
┌─────────────────────────────────────────────────────────────────┐
│                     DOCKER NETWORK: healthcure-network           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │             FRONTEND GATEWAY (Port 3000)                 │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ • Web Interface (EJS Templates)                          │  │
│  │ • API Gateway / Routing                                  │  │
│  │ • Session Management                                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                   ↓                      ↓                        │
│  ┌─────────────────────────┐  ┌──────────────────────────────┐  │
│  │  AUTH SERVICE (3001)    │  │  MAIN SERVICE (3002)         │  │
│  ├─────────────────────────┤  ├──────────────────────────────┤  │
│  │ • Login/Register        │  │ • Patient CRUD               │  │
│  │ • JWT Token Manager     │  │ • Doctor CRUD                │  │
│  │ • Role Validation       │  │ • Visit/Referral Management  │  │
│  │ • User Model            │  │ • Data Validation            │  │
│  └─────────────────────────┘  └──────────────────────────────┘  │
│           ↓                              ↓                        │
│  ┌─────────────────────────┐  ┌──────────────────────────────┐  │
│  │ MongoDB: auth_db        │  │ MongoDB: main_db             │  │
│  ├─────────────────────────┤  ├──────────────────────────────┤  │
│  │ Collections:            │  │ Collections:                 │  │
│  │ • users                 │  │ • patients                   │  │
│  └─────────────────────────┘  │ • doctors                    │  │
│                                │ • visits                     │  │
│                                │ • notifications              │  │
│                                └──────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                            ↑
                     ┌──────┴──────┐
                     │   Browser   │
                     │ localhost:  │
                     │    3000     │
                     └─────────────┘
```

---

## 📦 Komponen-Komponen Utama

### 1. Frontend Gateway Service (Port 3000)

**File**: `frontend/`

**Fungsi Utama**:
- Web server (Express.js)
- Template rendering (EJS)
- Static file serving (CSS, JS, images)
- API Gateway (forward requests ke auth & main service)

**Struktur**:
```
frontend/
├── src/
│   └── index.js          - Main server
├── views/                - EJS templates
│   ├── index.ejs         - Landing page
│   ├── login.ejs         - Login form
│   ├── register.ejs      - Register form
│   ├── dashboard.ejs     - Admin dashboard
│   ├── patients.ejs      - Patient list & CRUD
│   ├── doctors.ejs       - Doctor list & CRUD
│   ├── referrals.ejs     - Referral management
│   ├── profile.ejs       - User profile
│   ├── my-visits.ejs     - User's visits
│   └── 404.ejs           - Error page
├── public/
│   ├── css/
│   │   └── style.css     - Global styles
│   ├── js/
│   │   └── app.js        - Client-side logic (API calls, UI)
│   └── logo.svg          - Logo
└── package.json
```

**Port & Routes**:
- Port: 3000
- GET `/` - Landing page
- GET `/login` - Login page
- GET `/register` - Register page
- GET `/dashboard` - Dashboard
- GET `/patients` - Patient management
- GET `/doctors` - Doctor management
- GET `/referrals` - Referral management
- GET `/profile` - User profile
- GET `/my-visits` - User's visits

**API Gateway Routes** (dalam `src/index.js`):
```javascript
// Forward ke Auth Service (3001)
app.use('/api/auth', proxy('http://auth-service:3001/api/auth'));

// Forward ke Main Service (3002)
app.use('/api/patients', proxy('http://main-service:3002/api/patients'));
app.use('/api/doctors', proxy('http://main-service:3002/api/doctors'));
app.use('/api/visits', proxy('http://main-service:3002/api/visits'));
app.use('/api/stats', proxy('http://main-service:3002/api/stats'));
```

---

### 2. Auth Service (Port 3001)

**File**: `auth-service/`

**Fungsi Utama**:
- User registration
- User login dengan JWT
- JWT token validation
- Role management (admin/user)

**Struktur**:
```
auth-service/
├── src/
│   ├── controllers/
│   │   └── authController.js     - Logika login, register, verify
│   ├── models/
│   │   └── User.js               - User schema (email, password, role, patientId)
│   ├── routes/
│   │   └── authRoutes.js         - Route definitions
│   ├── middleware/
│   │   └── auth.js               - JWT verification middleware
│   └── index.js                  - Express server setup
└── package.json
```

**Data Model - User**:
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed with bcrypt),
  phone: String,
  name: String,
  role: String (enum: ['admin', 'user']),
  isVerified: Boolean,
  patientId: String (linked patient ID if exists),
  createdAt: Date
}
```

**Endpoints**:
```
POST   /api/auth/register    - Register user baru
POST   /api/auth/login       - Login & return JWT token
GET    /api/auth/verify      - Verify token validity
GET    /api/auth/me          - Get current user info
GET    /api/auth/users       - Get all users (Admin only)
PUT    /api/auth/users/:id   - Update user
DELETE /api/auth/users/:id   - Delete user (Admin only)
```

**Flow Autentikasi**:
```
1. User submit email + password ke /api/auth/login
2. Service cari user di database by email
3. Compare password (bcrypt.compare)
4. Jika cocok → generate JWT token (24 hour expiry)
5. Return token ke client
6. Client simpan token di localStorage
7. Setiap request ke service, kirim token di header: "Authorization: Bearer <token>"
8. Middleware auth.js verify token
9. Jika valid → lanjut request, jika invalid → return 401
```

**JWT Token Structure**:
```javascript
// Header
{ "alg": "HS256", "typ": "JWT" }

// Payload
{ 
  "id": "user_id",
  "email": "user@example.com",
  "name": "User Name",
  "role": "admin",
  "patientId": "patient_id",
  "iat": 1234567890,
  "exp": 1234654290
}

// Signature (secret: JWT_SECRET from env)
```

---

### 3. Main Service (Port 3002)

**File**: `main-service/`

**Fungsi Utama**:
- CRUD Patient
- CRUD Doctor
- CRUD Visit/Referral
- Data validation
- Notification system

**Struktur**:
```
main-service/
├── src/
│   ├── controllers/
│   │   ├── patientController.js  - Patient CRUD logic
│   │   ├── doctorController.js   - Doctor CRUD logic
│   │   ├── visitController.js    - Visit/Referral logic
│   │   └── notificationController.js - Notification logic
│   ├── models/
│   │   ├── Patient.js            - Patient schema
│   │   ├── Doctor.js             - Doctor schema
│   │   ├── Visit.js              - Visit/Referral schema
│   │   ├── Notification.js       - Notification schema
│   │   └── User.js               - User reference (for notifications)
│   ├── routes/
│   │   ├── patientRoutes.js
│   │   ├── doctorRoutes.js
│   │   ├── visitRoutes.js
│   │   └── notificationRoutes.js
│   ├── middleware/
│   │   └── auth.js               - JWT verification (same as auth-service)
│   └── index.js                  - Express server setup
└── package.json
```

**Data Models**:

#### Patient Schema
```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String,
  dateOfBirth: Date,
  gender: String (enum: ['Laki-laki', 'Perempuan']),
  address: String,
  phone: String (unique, required),
  bloodType: String (enum: ['A', 'B', 'AB', 'O', '-']),
  allergies: String,
  medicalHistory: String,
  doctor: ObjectId (ref: 'Doctor'),
  userId: String (linked user ID),
  bindRequest: {
    userId: String,
    userName: String,
    userEmail: String,
    requestedAt: Date,
    status: String (enum: ['pending', 'approved', 'rejected'])
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### Doctor Schema
```javascript
{
  _id: ObjectId,
  nip: String (unique),
  name: String,
  specialization: String,
  phone: String,
  email: String,
  schedule: String,
  room: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### Visit Schema (Referral)
```javascript
{
  _id: ObjectId,
  patient: ObjectId (ref: 'Patient'),
  doctor: ObjectId (ref: 'Doctor'),
  visitDate: Date,
  complaint: String,
  diagnosis: String,
  treatment: String,
  prescription: String,
  notes: String,
  status: String (enum: ['ongoing', 'completed']),
  createdBy: String (admin ID),
  createdAt: Date,
  updatedAt: Date
}
```

**Endpoints**:
```
# Patients
GET    /api/patients              - List all
POST   /api/patients              - Create (Admin)
GET    /api/patients/:id          - Get detail
PUT    /api/patients/:id          - Update
DELETE /api/patients/:id          - Delete (Admin)
GET    /api/patients/search?q=    - Search

# Doctors
GET    /api/doctors               - List all
POST   /api/doctors               - Create (Admin)
GET    /api/doctors/:id           - Get detail
PUT    /api/doctors/:id           - Update (Admin)
DELETE /api/doctors/:id           - Delete (Admin)

# Visits/Referrals
GET    /api/visits                - List all (Admin)
POST   /api/visits                - Create (Admin)
GET    /api/visits/:id            - Get detail
PUT    /api/visits/:id            - Update (Admin)
DELETE /api/visits/:id            - Delete (Admin)
GET    /api/visits/my-visits      - Get user's visits
GET    /api/visits/patient/:id    - Get patient's visits

# Dashboard
GET    /api/stats                 - Get statistics
```

---

## 🔄 Data Flow & Interactions

### Flow 1: Admin Membuat Rujukan

```
1. Admin buka halaman Referrals
2. Click "Buat Rujukan Baru"
3. Search pasien → GET /api/patients/search?q=
4. Select pasien → GET /api/patients/:id
5. Frontend check: apakah data pasien lengkap?
   ✅ Jika lengkap → lanjut ke step 6
   ❌ Jika belum → show warning + form untuk lengkapi data
6. Admin isi detail rujukan:
   - Pilih dokter → GET /api/doctors
   - Keluhan, tanggal, notes
7. Admin click "Simpan Rujukan"
8. POST /api/visits dengan data:
   {
     patientId: "...",
     doctorId: "...",
     visitDate: "...",
     complaint: "...",
     notes: "..."
   }
9. Backend cek: apakah data pasien valid?
   ✅ Valid → create visit
   ❌ Invalid → return error 400
10. Jika patient.userId exist → send notification ke user
11. Return success response
12. Frontend refresh list referrals
```

### Flow 2: User Login

```
1. User buka http://localhost:3000/login
2. User masukkan email + password
3. Click "Masuk"
4. Frontend POST /api/auth/login dengan:
   { email, password }
5. Auth Service:
   - Find user by email
   - Compare password dengan bcrypt
   - Jika cocok → generate JWT token
   - Return { success, token, user }
6. Frontend:
   - Save token ke localStorage
   - Redirect ke /dashboard
7. Setiap request ke API, kirim:
   Authorization: Bearer <token>
```

### Flow 3: User Lihat Data Diri

```
1. User click "Profil Saya"
2. Frontend GET /api/auth/verify (verify token valid)
3. Frontend GET /api/patients/my-data
   (Find patient where userId = current_user_id)
4. Show patient data: nama, email, golongan darah, alergi, alamat
```

### Flow 4: User Lihat Riwayat Kunjungan

```
1. User click "Kunjungan Saya"
2. Frontend GET /api/visits/my-visits
3. Backend find user's patient record
4. Find all visits where patient._id = patient record
5. Return list of visits dengan filter:
   - Ongoing: status = 'ongoing'
   - Completed: status = 'completed'
6. Display dengan detail doctor, diagnosis, treatment
```

---

## 🔐 Role-Based Access Control

### Admin Role
```
✅ ALLOWED:
- Create Patient
- Create Doctor
- Create Visit/Referral
- Update Patient
- Update Doctor
- Update Visit
- Delete Patient
- Delete Doctor
- Delete Visit
- View all patients
- View all doctors
- View all visits
- View statistics
- Verify users

❌ NOT ALLOWED:
- Update other user's data (except as admin)
```

### User Role
```
✅ ALLOWED:
- View own patient record (if linked)
- Update own patient info (limited fields)
- View own visits
- View own profile
- Register
- Login

❌ NOT ALLOWED:
- Create/View/Update other users' data
- Create/View/Update visits
- Create Patient
- Create Doctor
- Delete anything
- Access Admin pages
```

**Implementation** (di middleware/auth.js):
```javascript
// Check admin role
if (req.user.role !== 'admin') {
  return res.status(403).json({ success: false, message: 'Akses ditolak' });
}

// Check own data only
if (req.user.role === 'user' && req.params.patientId !== req.user.patientId) {
  return res.status(403).json({ success: false, message: 'Akses ditolak' });
}
```

---

## 💾 Database & Data Relationships

### Data Relationships

```
User (auth_db.users)
 └─ patientId ──→ Patient (main_db.patients)
                    ├─ doctor ──→ Doctor (main_db.doctors)
                    └─ visits ──→ Visit (main_db.visits)
                                  └─ doctor ──→ Doctor

```

### MongoDB Collections

**auth_db** (User Authentication):
- users

**main_db** (Project Data):
- patients
- doctors
- visits
- notifications

### Indexes untuk Performance

```javascript
// patients
db.patients.createIndex({ phone: 1 });
db.patients.createIndex({ email: 1 });
db.patients.createIndex({ userId: 1 });

// doctors
db.doctors.createIndex({ nip: 1 });

// visits
db.visits.createIndex({ patient: 1 });
db.visits.createIndex({ doctor: 1 });
db.visits.createIndex({ status: 1 });
```

---

## 📝 Data Validation

### Patient Data Validation (di visitController.js)

Sebelum membuat visit/referral, cek apakah patient data lengkap:

```javascript
const missingFields = [];
if (!patient.dateOfBirth) missingFields.push('Tanggal Lahir');
if (!patient.gender) missingFields.push('Jenis Kelamin');
if (!patient.address || patient.address === '-') missingFields.push('Alamat');
if (!patient.bloodType || patient.bloodType === '-') missingFields.push('Golongan Darah');

if (missingFields.length > 0) {
  return res.status(400).json({
    success: false,
    message: 'Data pasien belum lengkap',
    missingFields: missingFields
  });
}
```

### Frontend Validation (di referrals.ejs)

```javascript
function checkPatientDataComplete(patient) {
  const missingFields = [];
  if (!patient.dateOfBirth) missingFields.push('Tanggal Lahir');
  if (!patient.gender) missingFields.push('Jenis Kelamin');
  if (!patient.address || patient.address === '-') missingFields.push('Alamat');
  if (!patient.bloodType || patient.bloodType === '-') missingFields.push('Golongan Darah');
  
  return {
    isComplete: missingFields.length === 0,
    missingFields
  };
}
```

---

## 🔄 Request Flow - Detailed Example

**Use Case: Admin Membuat Referral untuk Pasien**

```
1. FRONTEND (Browser)
   POST /api/visits
   {
     "patientId": "12345",
     "doctorId": "67890",
     "complaint": "Demam tinggi",
     "visitDate": "2025-12-24",
     "notes": "Terasa flu"
   }

2. FRONTEND GATEWAY (Port 3000 - src/index.js)
   - Terima request
   - Ekstrak JWT token dari header
   - Forward ke Auth Service untuk verify token
   - If valid → forward ke Main Service
   - If invalid → return 401

3. AUTH SERVICE (Port 3001 - middleware/auth.js)
   - Verify JWT token
   - Decode token → get user data
   - Check token expiry
   - If valid → next()
   - If invalid → return 401

4. MAIN SERVICE (Port 3002 - controllers/visitController.js)
   - Terima request
   - Validasi input
   - Find patient by id
   - Find doctor by id
   - Check patient data lengkap:
     - dateOfBirth ✅
     - gender ✅
     - address (jika "-" → ❌)
     - bloodType (jika "-" → ❌)
   - If incomplete → return 400 with missingFields
   - If complete → create new Visit document
   - Find patient.userId
   - If userId exist → create notification
   - Save Visit ke database

5. DATABASE (MongoDB - main_db)
   db.visits.insertOne({
     patient: ObjectId("12345"),
     doctor: ObjectId("67890"),
     visitDate: ISODate("2025-12-24"),
     complaint: "Demam tinggi",
     notes: "Terasa flu",
     status: "ongoing",
     createdBy: "admin_id",
     diagnosis: "-",
     treatment: "-",
     prescription: "-",
     createdAt: ISODate(...),
     updatedAt: ISODate(...)
   })

6. RESPONSE (kembali ke Frontend)
   HTTP 201 Created
   {
     "success": true,
     "message": "Kunjungan berhasil dicatat",
     "data": {
       "_id": "visit_id",
       "patient": "12345",
       "doctor": "67890",
       "complaint": "Demam tinggi",
       "status": "ongoing",
       ...
     }
   }

7. FRONTEND
   - Receive response
   - Show success message
   - Refresh visits list
   - Close modal
```

---

## 🔔 Notification System

**Type**: In-application notification (stored in DB, displayed on login)

**Flow**:
```
1. Event terjadi (e.g., referral created, user verified)
2. Main Service create notification document
3. Notification stored di main_db.notifications
4. User login → fetch notifications
5. Display di UI
```

**Notification Schema**:
```javascript
{
  userId: String,
  type: String (enum: ['link_request', 'visit_created', 'visit_completed', ...]),
  title: String,
  message: String,
  data: Object (relasi data),
  isRead: Boolean,
  createdAt: Date
}
```

---

## 🚀 Deployment Architecture

### Docker Compose Setup

```yaml
services:
  # MongoDB Auth Database
  mongodb-auth:
    image: mongo:7.0
    container_name: healthcure-mongodb-auth
    volumes:
      - mongodb_auth_data:/data/db
      - ./docker/mongo-init/init-auth.js:/docker-entrypoint-initdb.d/init-auth.js
    networks:
      - healthcure-network

  # MongoDB Main Database
  mongodb-main:
    image: mongo:7.0
    container_name: healthcure-mongodb-main
    volumes:
      - mongodb_main_data:/data/db
    networks:
      - healthcure-network

  # Auth Service
  auth-service:
    build: ./auth-service
    container_name: healthcure-auth-service
    depends_on:
      mongodb-auth:
        condition: service_healthy
    environment:
      MONGODB_URI: mongodb://mongodb-auth:27017/auth_db
      JWT_SECRET: ${JWT_SECRET}
    networks:
      - healthcure-network

  # Main Service
  main-service:
    build: ./main-service
    container_name: healthcure-main-service
    depends_on:
      mongodb-main:
        condition: service_healthy
    environment:
      MONGODB_URI: mongodb://mongodb-main:27017/main_db
      JWT_SECRET: ${JWT_SECRET}
    networks:
      - healthcure-network

  # Frontend
  frontend:
    build: ./frontend
    container_name: healthcure-frontend
    ports:
      - "3000:3000"
    environment:
      AUTH_SERVICE_URL: http://auth-service:3001
      MAIN_SERVICE_URL: http://main-service:3002
    depends_on:
      - auth-service
      - main-service
    networks:
      - healthcure-network

networks:
  healthcure-network:
    driver: bridge

volumes:
  mongodb_auth_data:
  mongodb_main_data:
```

### Network Communication

```
Frontend (3000)
  ├─→ Auth Service (3001) via Docker DNS (http://auth-service:3001)
  └─→ Main Service (3002) via Docker DNS (http://main-service:3002)

Auth Service (3001)
  └─→ MongoDB Auth (mongodb-auth:27017)

Main Service (3002)
  └─→ MongoDB Main (mongodb-main:27017)
```

---

## 📊 Error Handling & HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | GET request successful |
| 201 | Created | POST request successful, new resource created |
| 400 | Bad Request | Invalid input, validation failed, incomplete patient data |
| 401 | Unauthorized | Missing/invalid JWT token |
| 403 | Forbidden | User doesn't have permission for this action |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Database error, unexpected error |

**Error Response Format**:
```json
{
  "success": false,
  "message": "Deskripsi error yang informatif",
  "error": "Error details (jika development mode)"
}
```

---

## 🔒 Security Implementation

### Password Security
- Hashing: bcrypt (salt rounds: 12)
- Never store plain text password
- Pre-save hook di User model auto-hash

### Token Security
- Algorithm: HS256
- Secret: Stored di environment variable (JWT_SECRET)
- Expiration: 24 hours
- Verified pada setiap protected endpoint

### Input Validation
- Frontend: Form validation sebelum submit
- Backend: express-validator di setiap endpoint
- Data sanitization: Mongoose trim & lowercase

### CORS & Headers
- CORS enabled untuk development
- Security headers configured

---

## 📈 Performance Optimization

### Database Indexes
- Unique indexes pada email, phone, NIP
- Regular indexes pada frequently queried fields
- Compound indexes untuk common query combinations

### Connection Pooling
- Mongoose default pooling (min: 5, max: 10)
- Proper connection closing

### Caching Strategy
- Client-side caching untuk statis assets
- API response caching melalui HTTP headers

---

## 🧪 Testing Points

Key endpoints to test:

1. **Auth Flow**
   - Register new user
   - Login dengan correct credentials
   - Login dengan wrong password
   - Token expiration

2. **Patient Management**
   - Admin create patient dengan data lengkap
   - Admin create patient dengan data incomplete
   - Search patient
   - Update patient
   - Delete patient

3. **Visit/Referral**
   - Create referral dengan incomplete patient data → should fail
   - Create referral dengan complete patient data → should succeed
   - Update referral status
   - View user's visits

4. **Role-Based Access**
   - User tidak bisa akses admin features
   - Admin tidak bisa lihat other users' data
   - User hanya bisa update own data

---

**Terakhir diupdate**: 2025-12-24  
**Version**: 1.1.0
