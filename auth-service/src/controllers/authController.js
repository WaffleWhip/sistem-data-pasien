const register = async (req, res) => {
  res.json({ message: 'Register endpoint works!' });
};

const login = async (req, res) => {
  res.json({ message: 'Login endpoint works!' });
};

const getProfile = async (req, res) => {
  res.json({ message: 'Profile endpoint works!' });
};

module.exports = { register, login, getProfile };