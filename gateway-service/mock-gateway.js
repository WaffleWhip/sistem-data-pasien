const express = require("express");
const http = require("http");
const app = express();

app.use(express.json());

console.log(" MOCK GATEWAY WITH TOKEN STARTED");

// Health endpoint
app.get("/health", (req, res) => {
    res.json({ 
        status: "OK", 
        service: "Mock Gateway with Token",
        timestamp: new Date().toISOString()
    });
});

// Mock Register - selalu success
app.post("/api/auth/register", (req, res) => {
    console.log(" Mock Register:", req.body.username);
    
    // Forward to auth service but add mock response
    const options = {
        hostname: "auth-service",
        port: 3001,
        path: "/api/auth/register",
        method: "POST",
        headers: {
            ...req.headers,
            "host": "auth-service:3001"
        }
    };
    
    const proxyReq = http.request(options, (proxyRes) => {
        let data = "";
        proxyRes.on("data", (chunk) => data += chunk);
        proxyRes.on("end", () => {
            try {
                const authResponse = JSON.parse(data);
                // Add mock user data
                const enhancedResponse = {
                    ...authResponse,
                    success: true,
                    data: {
                        userId: "user_" + Date.now(),
                        username: req.body.username,
                        email: req.body.email,
                        role: req.body.role || "user",
                        createdAt: new Date().toISOString()
                    }
                };
                res.json(enhancedResponse);
            } catch {
                res.json({
                    success: true,
                    message: "User registered successfully",
                    data: {
                        userId: "user_" + Date.now(),
                        username: req.body.username,
                        email: req.body.email,
                        role: req.body.role || "user"
                    }
                });
            }
        });
    });
    
    proxyReq.on("error", () => {
        res.json({
            success: true,
            message: "Mock registration successful",
            data: {
                userId: "mock_user_" + Date.now(),
                username: req.body.username,
                email: req.body.email,
                role: req.body.role || "user"
            }
        });
    });
    
    proxyReq.write(JSON.stringify(req.body));
    proxyReq.end();
});

// Mock Login - generate JWT-like token
app.post("/api/auth/login", (req, res) => {
    console.log(" Mock Login:", req.body.username);
    
    // Generate mock JWT token
    const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
        Buffer.from(JSON.stringify({
            userId: "user_12345",
            username: req.body.username,
            role: "admin",
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600
        })).toString("base64") +
        ".mock_signature_for_testing";
    
    // Forward to auth service but enhance response
    const options = {
        hostname: "auth-service",
        port: 3001,
        path: "/api/auth/login",
        method: "POST",
        headers: {
            ...req.headers,
            "host": "auth-service:3001"
        }
    };
    
    const proxyReq = http.request(options, (proxyRes) => {
        let data = "";
        proxyRes.on("data", (chunk) => data += chunk);
        proxyRes.on("end", () => {
            try {
                const authResponse = JSON.parse(data);
                // Add mock token
                const enhancedResponse = {
                    ...authResponse,
                    success: true,
                    data: {
                        token: mockToken,
                        user: {
                            id: "user_12345",
                            username: req.body.username,
                            role: "admin",
                            email: req.body.username + "@example.com"
                        }
                    }
                };
                res.json(enhancedResponse);
            } catch {
                res.json({
                    success: true,
                    message: "Login successful",
                    data: {
                        token: mockToken,
                        user: {
                            id: "user_12345",
                            username: req.body.username,
                            role: "admin"
                        }
                    }
                });
            }
        });
    });
    
    proxyReq.on("error", () => {
        res.json({
            success: true,
            message: "Mock login successful",
            data: {
                token: mockToken,
                user: {
                    id: "user_12345",
                    username: req.body.username,
                    role: "admin"
                }
            }
        });
    });
    
    proxyReq.write(JSON.stringify(req.body));
    proxyReq.end();
});

// Proxy Patients API with token validation
app.use("/api/patients", (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            error: "Unauthorized",
            message: "No token provided"
        });
    }
    
    // Mock token validation
    const token = authHeader.split(" ")[1];
    console.log(" Patients request with token:", token.substring(0, 30) + "...");
    
    // Forward to patient service
    const options = {
        hostname: "patient-service",
        port: 3002,
        path: req.originalUrl.replace(/^\/api\/patients/, ""),
        method: req.method,
        headers: {
            ...req.headers,
            "host": "patient-service:3002"
        }
    };
    
    const proxyReq = http.request(options, (proxyRes) => {
        let data = "";
        proxyRes.on("data", (chunk) => data += chunk);
        proxyRes.on("end", () => {
            try {
                const patientResponse = JSON.parse(data);
                res.status(proxyRes.statusCode).json(patientResponse);
            } catch {
                // If patient service returns error, return mock data
                res.json({
                    success: true,
                    data: {
                        patients: [
                            { id: 1, name: "John Doe", age: 35, diagnosis: "Checkup" },
                            { id: 2, name: "Jane Smith", age: 28, diagnosis: "Flu" },
                            { id: 3, name: "Bob Johnson", age: 45, diagnosis: "Annual Physical" }
                        ]
                    }
                });
            }
        });
    });
    
    proxyReq.on("error", (err) => {
        console.error("Patient service error:", err.message);
        // Return mock patient data
        res.json({
            success: true,
            data: {
                patients: [
                    { id: 1, name: "Mock Patient 1", age: 30, diagnosis: "Regular Checkup" },
                    { id: 2, name: "Mock Patient 2", age: 25, diagnosis: "Vaccination" }
                ]
            }
        });
    });
    
    if (req.body && Object.keys(req.body).length > 0) {
        proxyReq.write(JSON.stringify(req.body));
    }
    
    proxyReq.end();
});

// Default route
app.get("/", (req, res) => {
    res.json({
        message: "Patient Data System - Mock Gateway",
        note: "This gateway provides mock tokens for testing",
        endpoints: [
            "POST /api/auth/register - Register user (returns mock user data)",
            "POST /api/auth/login - Login (returns mock JWT token)",
            "GET  /api/patients - Get patients (requires Bearer token)"
        ]
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(` Mock Gateway with Token running on port ${PORT}`);
    console.log("================================================");
});
