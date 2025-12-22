import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { User, Mail, Lock, AlertCircle, Loader2, Phone, UserSquare } from 'lucide-react';
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
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-background px-4 py-12">
      <div className="max-w-sm w-full">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-200">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-brand-dark">Create Your Account</h2>
            <p className="text-brand-secondary text-sm mt-1">Join to manage your health records.</p>
          </div>

          <form className="space-y-4" onSubmit={handleRegister}>
            {error && (
              <div className="bg-red-100 border border-red-200 p-3 rounded-lg flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium text-brand-secondary mb-1 block">Full Name</label>
                <div className="relative">
                  <UserSquare className="absolute h-5 w-5 text-brand-light left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" name="name" required onChange={handleInputChange} placeholder="Your full name" className="block w-full pl-10 pr-3 py-2.5 bg-white border border-brand-light rounded-lg text-brand-dark focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-brand-secondary mb-1 block">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute h-5 w-5 text-brand-light left-3 top-1/2 -translate-y-1/2" />
                  <input type="tel" name="phone" required onChange={handleInputChange} placeholder="e.g., 08123456789" className="block w-full pl-10 pr-3 py-2.5 bg-white border border-brand-light rounded-lg text-brand-dark focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-brand-secondary mb-1 block">Username</label>
                <div className="relative">
                  <User className="absolute h-5 w-5 text-brand-light left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" name="username" required onChange={handleInputChange} placeholder="Create a username" className="block w-full pl-10 pr-3 py-2.5 bg-white border border-brand-light rounded-lg text-brand-dark focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-brand-secondary mb-1 block">Email</label>
                <div className="relative">
                  <Mail className="absolute h-5 w-5 text-brand-light left-3 top-1/2 -translate-y-1/2" />
                  <input type="email" name="email" required onChange={handleInputChange} placeholder="your.email@example.com" className="block w-full pl-10 pr-3 py-2.5 bg-white border border-brand-light rounded-lg text-brand-dark focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-brand-secondary mb-1 block">Password</label>
                <div className="relative">
                  <Lock className="absolute h-5 w-5 text-brand-light left-3 top-1/2 -translate-y-1/2" />
                  <input type="password" name="password" required onChange={handleInputChange} placeholder="••••••••" className="block w-full pl-10 pr-3 py-2.5 bg-white border border-brand-light rounded-lg text-brand-dark focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full flex justify-center items-center py-3 px-4 bg-brand-primary hover:bg-brand-secondary text-white font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50 h-12 mt-6">
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Create Account'}
            </button>
            
            <p className="text-center text-sm text-brand-secondary pt-2">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-primary font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
