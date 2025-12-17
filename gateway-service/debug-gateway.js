const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const app = express();

app.use(express.json());

// Log all requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log("Headers:", JSON.stringify(req.headers));
    if (req.body && Object.keys(req.body).length > 0) {
        console.log("Body:", JSON.stringify(req.body));
    }
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

// Test endpoint - langsung return
app.get("/test", (req, res) => {
    res.json({ message: "Test endpoint works" });
});

// Simple proxy config
const authProxy = createProxyMiddleware({
    target: "http://auth-service:3001",
    changeOrigin: true,
    pathRewrite: {
        "^/api/auth": "/api/auth"
    },
    onProxyReq: (proxyReq, req, res) => {
        console.log("Proxying to auth-service:", req.method, req.originalUrl);
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log("Auth service response:", proxyRes.statusCode);
    },
    onError: (err, req, res) => {
        console.error("Auth proxy error:", err.message);
        res.status(502).json({ 
            error: "Auth service unavailable",
            details: err.message 
        });
    }
});

const patientProxy = createProxyMiddleware({
    target: "http://patient-service:3002",
    changeOrigin: true,
    pathRewrite: {
        "^/api/patients": "/api/patients"
    },
    onError: (err, req, res) => {
        console.error("Patient proxy error:", err.message);
        res.status(502).json({ 
            error: "Patient service unavailable",
            details: err.message 
        });
    }
});

// Apply proxies
app.use("/api/auth", authProxy);
app.use("/api/patients", patientProxy);

// Default route
app.get("/", (req, res) => {
    res.json({
        message: "Gateway is running",
        services: {
            auth: "http://auth-service:3001",
            patient: "http://patient-service:3002"
        }
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Gateway debug mode on port ${PORT}`);
});
