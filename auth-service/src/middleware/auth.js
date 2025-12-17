const authenticate = (req, res, next) => {
  // Simple authentication for now
  req.user = { userId: 'test-user', role: 'user' };
  next();
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };