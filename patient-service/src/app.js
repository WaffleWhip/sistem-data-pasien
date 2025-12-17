const express = require('express'); 
const app = express(); 
 
app.use(express.json()); 
 
app.get('/health', function(req, res) { 
  res.json({ status: 'OK', service: 'Patient Service' }); 
}); 
 
module.exports = app; 
