const register = async (req, res) => {
  res.json({ message: 'Register endpoint' });
};

const login = async (req, res) => {
  res.json({ message: 'Login endpoint' });
};

const getProfile = async (req, res) => {
  res.json({ message: 'Profile endpoint' });
};

module.exports = { register, login, getProfile };