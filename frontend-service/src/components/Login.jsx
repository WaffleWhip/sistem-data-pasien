import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import Logo from './ui/Logo';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { username, password });
      setError(''); // Clear error on success
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
    if (error) setError(''); // Clear error when user starts typing
  }

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error) setError(''); // Clear error when user starts typing
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-background px-4 py-12">
      <div className="max-w-sm w-full">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-200">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-brand-dark">Welcome Back</h2>
            <p className="text-brand-secondary text-sm mt-1">Sign in to continue</p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-100 border border-red-200 p-3 rounded-lg flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-brand-secondary mb-1 block">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-brand-light" />
                  </div>
                  <input
                    type="text"
                    required
                    className="block w-full pl-10 pr-3 py-2.5 bg-white border border-brand-light rounded-lg text-brand-dark focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition"
                    placeholder="your_username"
                    value={username}
                    onChange={handleUsernameChange}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-brand-secondary mb-1 block">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-brand-light" />
                  </div>
                  <input
                    type="password"
                    required
                    className="block w-full pl-10 pr-3 py-2.5 bg-white border border-brand-light rounded-lg text-brand-dark focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition"
                    placeholder="••••••••"
                    value={password}
                    onChange={handlePasswordChange}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 bg-brand-primary hover:bg-brand-secondary text-white font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50 h-12"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Sign In'}
            </button>
            
            <p className="text-center text-sm text-brand-secondary pt-2">
              Don't have an account?{' '}
              <Link to="/register" className="text-brand-primary font-semibold hover:underline">
                Register!
              </Link>
            </p>
          </form>
        </div>

        <p className="mt-8 text-center text-xs text-brand-light">
          &copy; 2025 Health Cure. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
