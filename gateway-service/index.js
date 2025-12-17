const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const app = express();

app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Health endpoint
app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        service: "Gateway HTTP Server",
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get("/", (req, res) => {
    res.json({
        message: "Patient Data System - API Gateway",
        endpoints: [
            "POST /api/auth/register",
            "POST /api/auth/login",
            "GET  /api/patients",
            "GET  /health"
        ]
    });
});

// Proxy configuration with timeout and retry
const proxyOptions = {
    changeOrigin: true,
    proxyTimeout: 30000, // 30 seconds timeout
    timeout: 30000,
    onError: (err, req, res) => {
        console.error("Proxy Error:", err);
        res.status(502).json({ 
            error: "Bad Gateway", 
            message: "Service unavailable",
            details: err.message 
        });
    }
};

// Proxy to Auth Service
app.use("/api/auth", createProxyMiddleware({
    target: "http://auth-service:3001",
    pathRewrite: { "^/api/auth": "/api/auth" },
    ...proxyOptions
}));

// Proxy to Patient Service
app.use("/api/patients", createProxyMiddleware({
    target: "http://patient-service:3002",
    pathRewrite: { "^/api/patients": "/api/patients" },
    ...proxyOptions
}));

// Error handling
app.use((err, req, res, next) => {
    console.error("Gateway Error:", err);
    res.status(500).json({ error: "Internal gateway error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Gateway service running on port ${PORT}`);
    console.log("Auth service URL:", process.env.AUTH_SERVICE_URL);
    console.log("Patient service URL:", process.env.PATIENT_SERVICE_URL);
});
