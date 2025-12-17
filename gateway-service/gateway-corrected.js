const express = require("express");
const http = require("http");
const app = express();

app.use(express.json());

console.log(" CORRECTED GATEWAY STARTED");

// Simple logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

// Health endpoint
app.get("/health", (req, res) => {
    res.json({ 
        status: "OK", 
        service: "Corrected Gateway",
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get("/", (req, res) => {
    res.json({
        message: "Patient Data System - API Gateway (Corrected)",
        endpoints: [
            "POST /api/auth/register",
            "POST /api/auth/login", 
            "GET  /api/patients",
            "GET  /health"
        ]
    });
});

// Helper function untuk proxy request - TANPA PATH REWRITING
function proxyToService(serviceName, servicePort, req, res) {
    console.log(` Proxying ${req.method} to ${serviceName}:${servicePort}${req.originalUrl}`);
    
    const options = {
        hostname: serviceName,
        port: servicePort,
        path: req.originalUrl,  // KIRIM FULL PATH, JANGAN DIREWRITE!
        method: req.method,
        headers: {
            ...req.headers,
            "host": `${serviceName}:${servicePort}`
        }
    };
    
    // Remove content-length karena akan dihitung ulang
    delete options.headers["content-length"];
    
    console.log("Request options:", {
        hostname: options.hostname,
        port: options.port,
        path: options.path,
        method: options.method
    });
    
    const proxyReq = http.request(options, (proxyRes) => {
        console.log(` ${serviceName} response: ${proxyRes.statusCode}`);
        
        res.status(proxyRes.statusCode);
        
        // Copy headers
        Object.keys(proxyRes.headers).forEach(key => {
            res.setHeader(key, proxyRes.headers[key]);
        });
        
        proxyRes.pipe(res);
    });
    
    proxyReq.on("error", (err) => {
        console.error(` ${serviceName} error:`, err.message);
        res.status(502).json({
            success: false,
            error: "Service unavailable",
            service: serviceName,
            message: err.message
        });
    });
    
    // Send request body if present
    if (req.body && Object.keys(req.body).length > 0) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader("Content-Type", "application/json");
        proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
    }
    
    proxyReq.end();
}

// Auth service routes - PROXY KE /api/auth/*
app.use("/api/auth", (req, res) => {
    proxyToService("auth-service", 3001, req, res);
});

// Patient service routes - PROXY KE /api/patients/*  
app.use("/api/patients", (req, res) => {
    proxyToService("patient-service", 3002, req, res);
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: "Endpoint not found",
        path: req.originalUrl
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(` CORRECTED Gateway running on port ${PORT}`);
    console.log("========================================");
});
