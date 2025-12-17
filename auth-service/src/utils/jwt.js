const jwt = require('jsonwebtoken'); 
 
const generateToken = (userId, role) =
  return jwt.sign( 
    { userId, role }, 
    process.env.JWT_SECRET, 
    { expiresIn: '24h' } 
  ); 
}; 
 
const verifyToken = (token) =
  try { 
    return jwt.verify(token, process.env.JWT_SECRET); 
  } catch (error) { 
    return null; 
  } 
}; 
 
module.exports = { generateToken, verifyToken }; 
