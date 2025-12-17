const http = require("http");

const server = http.createServer((req, res) => {
  if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: "OK",
      service: "Gateway HTTP Server",
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  if (req.url === "/" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`
      <html>
        <body>
          <h1>Gateway Service Running!</h1>
          <p>Auth: <a href="http://localhost:3001">:3001</a></p>
          <p>Patient: <a href="http://localhost:3002">:3002</a></p>
        </body>
      </html>
    `);
    return;
  }
  
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log("Gateway HTTP server running on port " + PORT);
});