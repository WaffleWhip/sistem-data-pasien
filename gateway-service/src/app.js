const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Proxy Simulator
app.post("/api/auth/register", (req, res) => {
  console.log("Register request:", req.body);
  res.json({
    success: true,
    message: "User registered successfully",
    data: {
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-jwt-token-123",
      user: {
        id: "1",
        username: req.body.username,
        email: req.body.email,
        role: req.body.role
      }
    }
  });
});

app.post("/api/auth/login", (req, res) => {
  console.log("Login request:", req.body);
  res.json({
    success: true,
    message: "Login successful",
    data: {
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-jwt-token-456",
      user: {
        id: "1",
        username: req.body.username,
        role: "admin"
      }
    }
  });
});

app.get("/api/auth/verify", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token) {
    res.json({
      success: true,
      data: {
        id: "1",
        username: "admin",
        role: "admin"
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: "Token tidak valid"
    });
  }
});

// Patient API endpoints
app.get("/api/patients", (req, res) => {
  res.json({
    success: true,
    count: 3,
    data: [
      { id: 1, name: "Patient 1", patientId: "PAT001" },
      { id: 2, name: "Patient 2", patientId: "PAT002" },
      { id: 3, name: "Patient 3", patientId: "PAT003" }
    ]
  });
});

// Health endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "Gateway Service",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// Home page - SIMPLE tanpa template strings kompleks
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Sistem Data Pasien - Gateway</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .success { color: green; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Gateway Service Berjalan!</h1>
        <p class="success">Microservices Architecture Ready</p>
        <p>Auth Service: <a href="http://localhost:3001/health">:3001</a></p>
        <p>Patient Service: <a href="http://localhost:3002/health">:3002</a></p>
      </div>
    </body>
    </html>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log("Gateway Service running on port " + PORT);
  console.log("Access at: http://localhost:" + PORT);
});

module.exports = app;