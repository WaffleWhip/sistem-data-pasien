import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import PatientForm from './patients/PatientForm';
import { User, Phone, MapPin, Mail, Calendar, Edit2, Shield, Activity, Heart } from 'lucide-react';

const Profile = () => {
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchPatientProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/patients');
      if (res.data && res.data.length > 0) {
        setPatientData(res.data[0]);
      } else {
        toast.error("Could not find your patient profile.");
      }
    } catch (err) {
      toast.error('Failed to fetch profile data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.role === 'user') {
      fetchPatientProfile();
    } else {
      setLoading(false);
    }
  }, [user.role]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-100 rounded-full"></div>
          <div className="w-16 h-16 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
        </div>
        <p className="text-slate-500 font-medium animate-pulse">Loading profile...</p>
      </div>
    );
  }

  if (user.role !== 'user') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-100 shadow-xl shadow-slate-200/50">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/25">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Admin Account</h1>
          <p className="text-slate-500">This profile view is optimized for patient users. Please use the dashboard to manage records.</p>
        </div>
      </div>
    );
  }

  if (!patientData) {
     return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-100 shadow-xl shadow-slate-200/50">
          <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <User className="h-10 w-10 text-slate-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Profile Not Found</h1>
          <p className="text-slate-500">We couldn't find a patient record linked to your account.</p>
        </div>
      </div>
    );
  }

  const StatusBadge = ({ status }) => {
    const statusConfig = {
      'Active': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
      'Recovered': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
      'Deceased': { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' },
    };
    const config = statusConfig[status] || { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' };
    
    return (
      <span className={`inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full border ${config.bg} ${config.text} ${config.border}`}>
        <span className={`w-2 h-2 rounded-full ${config.dot}`}></span>
        {status}
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 px-8 py-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-pattern-plus opacity-30"></div>
          
          <div className="relative flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="h-28 w-28 rounded-2xl bg-white/20 backdrop-blur-sm border-4 border-white/30 shadow-2xl flex items-center justify-center text-white font-bold text-4xl">
              {patientData.name.charAt(0)}
            </div>
            <div className="flex-1 text-white">
              <h1 className="text-3xl font-bold mb-2">{patientData.name}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
                  <User size={16} className="text-white/80" />
                  <span className="text-sm">@{user.username}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
                  <Mail size={16} className="text-white/80" />
                  <span className="text-sm">{user.email}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="group flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <Edit2 size={18} className="group-hover:rotate-12 transition-transform" />
              <span>Edit Details</span>
            </button>
          </div>
        </div>

        {/* Status Section */}
        <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-xl">
              <Activity size={20} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Current Status</p>
              <p className="text-lg font-bold text-slate-800">{patientData.diagnosis}</p>
            </div>
          </div>
          <StatusBadge status={patientData.status} />
        </div>

        {/* Details Grid */}
        <div className="p-8">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">Personal Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Phone */}
            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 transition-colors">
              <div className="p-3 bg-white rounded-xl text-indigo-500 shadow-sm">
                <Phone size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Phone Number</p>
                <p className="text-lg font-bold text-slate-800">{patientData.phone}</p>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 transition-colors">
              <div className="p-3 bg-white rounded-xl text-indigo-500 shadow-sm">
                <MapPin size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Address</p>
                <p className="text-lg font-bold text-slate-800 leading-relaxed">{patientData.address}</p>
              </div>
            </div>

            {/* Age */}
            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 transition-colors">
              <div className="p-3 bg-white rounded-xl text-indigo-500 shadow-sm">
                <Calendar size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Age</p>
                <p className="text-lg font-bold text-slate-800">{patientData.age} Years Old</p>
              </div>
            </div>

            {/* Gender */}
            <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 transition-colors">
              <div className="p-3 bg-white rounded-xl text-indigo-500 shadow-sm">
                <User size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Gender</p>
                <p className="text-lg font-bold text-slate-800">{patientData.gender}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Health Tips Card */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-xl shadow-emerald-500/25">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <Heart className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Stay Healthy!</h3>
            <p className="text-emerald-100 text-sm">Remember to maintain regular checkups and follow your doctor's advice.</p>
          </div>
        </div>
      </div>

      <PatientForm 
        patient={patientData} 
        isOpen={isEditing} 
        onClose={() => setIsEditing(false)} 
        onSuccess={() => { setIsEditing(false); fetchPatientProfile(); }} 
      />
    </div>
  );
};

export default Profile;
