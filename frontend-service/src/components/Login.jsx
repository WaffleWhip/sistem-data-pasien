import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { Lock, User, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern-plus opacity-30"></div>
        
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Trusted by 10,000+ healthcare providers</span>
            </div>
            
            <h1 className="text-5xl font-bold leading-tight">
              Modern Healthcare<br />
              <span className="text-indigo-200">Management System</span>
            </h1>
            
            <p className="text-lg text-indigo-100 max-w-md leading-relaxed">
              Streamline your patient data management with our secure and intuitive platform. Built for modern healthcare professionals.
            </p>
            
            <div className="flex items-center gap-8 pt-4">
              <div className="text-center">
                <div className="text-3xl font-bold">99.9%</div>
                <div className="text-sm text-indigo-200">Uptime</div>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div className="text-center">
                <div className="text-3xl font-bold">256-bit</div>
                <div className="text-sm text-indigo-200">Encryption</div>
              </div>
              <div className="w-px h-12 bg-white/20"></div>
              <div className="text-center">
                <div className="text-3xl font-bold">24/7</div>
                <div className="text-sm text-indigo-200">Support</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative circles */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl"></div>
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-400/30 rounded-full blur-3xl"></div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-10 lg:hidden">
            <Logo size="lg" />
          </div>
          
          <div className="hidden lg:block mb-10">
            <Logo size="lg" />
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800">Welcome back</h2>
              <p className="text-slate-500 mt-1">Enter your credentials to access your account</p>
            </div>

            <form className="space-y-5" onSubmit={handleLogin}>
              {error && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center gap-3 animate-fade-in">
                  <div className="p-1 bg-rose-100 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-rose-600" />
                  </div>
                  <p className="text-sm text-rose-700 font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="group">
                  <label className="text-sm font-medium text-slate-600 mb-1.5 block group-focus-within:text-indigo-600 transition-colors">Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input
                      type="text"
                      required
                      className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 hover:border-slate-300"
                      placeholder="Enter your username"
                      value={username}
                      onChange={handleUsernameChange}
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="text-sm font-medium text-slate-600 mb-1.5 block group-focus-within:text-indigo-600 transition-colors">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input
                      type="password"
                      required
                      className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 hover:border-slate-300"
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
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-500">New to HealthCure?</span>
                </div>
              </div>

              <Link 
                to="/register" 
                className="w-full flex justify-center items-center py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl border border-slate-200 transition-all duration-200"
              >
                Create an account
              </Link>
            </form>
          </div>

          <p className="mt-8 text-center text-sm text-slate-400">
            &copy; 2025 HealthCure. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
