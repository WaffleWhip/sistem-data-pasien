import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { User, Mail, Lock, AlertCircle, Loader2, Phone, UserSquare, ArrowRight, CheckCircle2 } from 'lucide-react';
import Logo from './ui/Logo';
import toast from 'react-hot-toast';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register', formData);
      toast.success('Registration successful! Please log in.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const features = [
    'Access your medical records anytime',
    'Secure & encrypted data storage',
    'Track your health history',
    'Connect with healthcare providers'
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.05\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
        
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Join thousands of patients</span>
            </div>
            
            <h1 className="text-5xl font-bold leading-tight">
              Start Your Health<br />
              <span className="text-purple-200">Journey Today</span>
            </h1>
            
            <p className="text-lg text-purple-100 max-w-md leading-relaxed">
              Create your free account and take control of your health records with our comprehensive management system.
            </p>
            
            <div className="space-y-4 pt-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="p-1 bg-emerald-500/20 rounded-full">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  </div>
                  <span className="text-purple-100">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Decorative circles */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl"></div>
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-purple-400/30 rounded-full blur-3xl"></div>
      </div>

      {/* Right Panel - Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8 lg:hidden">
            <Logo size="lg" />
          </div>
          
          <div className="hidden lg:block mb-8">
            <Logo size="lg" />
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Create your account</h2>
              <p className="text-slate-500 mt-1">Fill in your details to get started</p>
            </div>

            <form className="space-y-4" onSubmit={handleRegister}>
              {error && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center gap-3 animate-fade-in">
                  <div className="p-1 bg-rose-100 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-rose-600" />
                  </div>
                  <p className="text-sm text-rose-700 font-medium">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                <div className="group">
                  <label className="text-sm font-medium text-slate-600 mb-1.5 block group-focus-within:text-indigo-600 transition-colors">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <UserSquare className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input 
                      type="text" 
                      name="name" 
                      required 
                      onChange={handleInputChange} 
                      placeholder="Your full name" 
                      className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 hover:border-slate-300" 
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="text-sm font-medium text-slate-600 mb-1.5 block group-focus-within:text-indigo-600 transition-colors">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input 
                      type="tel" 
                      name="phone" 
                      required 
                      onChange={handleInputChange} 
                      placeholder="e.g., 08123456789" 
                      className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 hover:border-slate-300" 
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="text-sm font-medium text-slate-600 mb-1.5 block group-focus-within:text-indigo-600 transition-colors">Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input 
                      type="text" 
                      name="username" 
                      required 
                      onChange={handleInputChange} 
                      placeholder="Create a username" 
                      className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 hover:border-slate-300" 
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="text-sm font-medium text-slate-600 mb-1.5 block group-focus-within:text-indigo-600 transition-colors">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                    <input 
                      type="email" 
                      name="email" 
                      required 
                      onChange={handleInputChange} 
                      placeholder="your.email@example.com" 
                      className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 hover:border-slate-300" 
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
                      name="password" 
                      required 
                      onChange={handleInputChange} 
                      placeholder="Min. 6 characters" 
                      className="block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 hover:border-slate-300" 
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transform hover:-translate-y-0.5 active:translate-y-0 mt-6"
              >
                {loading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
              
              <p className="text-center text-sm text-slate-500 pt-4">
                Already have an account?{' '}
                <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
                  Sign In
                </Link>
              </p>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-slate-400">
            By registering, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
