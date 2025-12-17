const express = require("express");
const app = express();

app.use(express.json());

// Health endpoint
app.get("/health", (req, res) => {
    res.json({ status: "OK", service: "Gateway" });
});

// Test direct response untuk register
app.post("/api/auth/register", (req, res) => {
    console.log("Register request received:", req.body);
    
    // Simulate async call to auth service
    const http = require("http");
    const options = {
        hostname: "auth-service",
        port: 3001,
        path: "/api/auth/register",
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Content-Length": JSON.stringify(req.body).length
        }
    };
    
    console.log("Calling auth service:", options);
    
    const proxyReq = http.request(options, (proxyRes) => {
        let data = "";
        proxyRes.on("data", (chunk) => {
            data += chunk;
        });
        proxyRes.on("end", () => {
            console.log("Auth service response:", proxyRes.statusCode, data);
            res.status(proxyRes.statusCode).json(JSON.parse(data));
        });
    });
    
    proxyReq.on("error", (err) => {
        console.error("Error calling auth service:", err.message);
        res.status(502).json({
            error: "Cannot connect to auth service",
            details: err.message
        });
    });
    
    proxyReq.write(JSON.stringify(req.body));
    proxyReq.end();
});

// Test endpoint langsung ke auth service
app.get("/api/auth/test", (req, res) => {
    const http = require("http");
    const options = {
        hostname: "auth-service",
        port: 3001,
        path: "/health",
        method: "GET"
    };
    
    const proxyReq = http.request(options, (proxyRes) => {
        let data = "";
        proxyRes.on("data", (chunk) => {
            data += chunk;
        });
        proxyRes.on("end", () => {
            res.json({
                message: "Direct call to auth service",
                response: JSON.parse(data)
            });
        });
    });
    
    proxyReq.on("error", (err) => {
        res.status(500).json({ error: err.message });
    });
    
    proxyReq.end();
});

app.listen(3000, () => {
    console.log("Minimal Gateway running on port 3000");
});
