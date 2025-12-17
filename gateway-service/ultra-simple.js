const express = require("express");
const app = express();

app.use(express.json());

console.log(" ULTRA SIMPLE GATEWAY STARTED");

// Health endpoint
app.get("/health", (req, res) => {
    res.json({ 
        status: "OK", 
        service: "Ultra Simple Gateway",
        timestamp: new Date().toISOString()
    });
});

// Direct mock responses - NO PROXYING
app.post("/api/auth/register", (req, res) => {
    console.log("Register request for:", req.body.username);
    
    // Immediate response without any external calls
    res.json({
        success: true,
        message: "User registered successfully",
        data: {
            userId: "user_" + Date.now(),
            username: req.body.username,
            email: req.body.email,
            role: req.body.role || "user",
            createdAt: new Date().toISOString()
        }
    });
});

app.post("/api/auth/login", (req, res) => {
    console.log("Login request for:", req.body.username);
    
    // Generate simple mock token
    const mockToken = "mock_jwt_token_" + Date.now() + "_" + Math.random().toString(36).substr(2);
    
    res.json({
        success: true,
        message: "Login successful",
        data: {
            token: mockToken,
            user: {
                id: "user_12345",
                username: req.body.username,
                role: "admin",
                email: req.body.username + "@hospital.com"
            }
        }
    });
});

app.get("/api/patients", (req, res) => {
    console.log("Patients request");
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            error: "Unauthorized - Token required"
        });
    }
    
    const token = authHeader.split(" ")[1];
    console.log("Token used:", token.substring(0, 20) + "...");
    
    // Return mock patient data
    res.json({
        success: true,
        data: {
            patients: [
                { id: 1, name: "John Doe", age: 35, gender: "Male", diagnosis: "Regular Checkup" },
                { id: 2, name: "Jane Smith", age: 28, gender: "Female", diagnosis: "Vaccination" },
                { id: 3, name: "Robert Johnson", age: 45, gender: "Male", diagnosis: "Blood Test" },
                { id: 4, name: "Maria Garcia", age: 32, gender: "Female", diagnosis: "Prenatal Care" }
            ],
            total: 4,
            page: 1,
            limit: 10
        }
    });
});

// Root endpoint
app.get("/", (req, res) => {
    res.json({
        message: "Patient Data System - Ultra Simple Gateway",
        description: "This gateway provides instant mock responses for all endpoints",
        endpoints: {
            register: "POST /api/auth/register",
            login: "POST /api/auth/login", 
            patients: "GET /api/patients (requires Authorization: Bearer <token>)",
            health: "GET /health"
        }
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(` Gateway running on port ${PORT}`);
    console.log("==================================");
});
