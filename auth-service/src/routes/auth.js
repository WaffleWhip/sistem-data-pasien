const express = require('express');
const router = express.Router();

router.post('/register', (req, res) => {
  res.json({ message: 'Register endpoint works!' });
});

router.post('/login', (req, res) => {
  res.json({ message: 'Login endpoint works!' });
});

router.get('/profile', (req, res) => {
  res.json({ message: 'Profile endpoint works!' });
});

module.exports = router;
