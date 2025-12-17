const express = require("express");
const http = require("http");
const app = express();

app.use(express.json());

console.log(" FINAL GATEWAY STARTED");

// Simple logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

// Health endpoint
app.get("/health", (req, res) => {
    res.json({ 
        status: "OK", 
        service: "FINAL Gateway",
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get("/", (req, res) => {
    res.json({
        message: "Patient Data System - API Gateway v1.0",
        endpoints: [
            "POST /api/auth/register",
            "POST /api/auth/login", 
            "GET  /api/patients",
            "GET  /health"
        ]
    });
});

// Helper function untuk proxy request
function proxyToService(serviceName, servicePort, req, res) {
    console.log(` Proxying to ${serviceName}:${servicePort}${req.originalUrl}`);
    
    const options = {
        hostname: serviceName,
        port: servicePort,
        path: req.originalUrl.replace(/^\/api\/[^\/]+/, ""),
        method: req.method,
        headers: {
            ...req.headers,
            "host": `${serviceName}:${servicePort}`
        }
    };
    
    console.log("Request options:", JSON.stringify(options, null, 2));
    
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
        proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
    }
    
    proxyReq.end();
}

// Auth service routes
app.all("/api/auth/*", (req, res) => {
    proxyToService("auth-service", 3001, req, res);
});

// Patient service routes  
app.all("/api/patients/*", (req, res) => {
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
    console.log(` FINAL Gateway running on port ${PORT}`);
    console.log("========================================");
});
