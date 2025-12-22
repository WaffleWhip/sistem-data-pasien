import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import PatientForm from './patients/PatientForm';
import { User, Phone, MapPin, Mail, Calendar, Edit2, Shield } from 'lucide-react';

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
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-100 border-t-primary-600"></div>
        <p className="text-gray-400 font-bold animate-pulse text-sm">Loading profile...</p>
      </div>
    );
  }

  if (user.role !== 'user') {
    return (
      <div className="max-w-2xl mx-auto mt-10">
        <div className="bg-white rounded-[2rem] p-10 text-center border border-gray-100 shadow-xl shadow-primary-900/5">
          <div className="bg-gray-50 h-20 w-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Shield className="h-10 w-10 text-gray-300" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Admin Account</h1>
          <p className="text-gray-500 font-medium">This profile view is optimized for patient users. Please use the dashboard to manage records.</p>
        </div>
      </div>
    );
  }

  if (!patientData) {
     return (
      <div className="max-w-2xl mx-auto mt-10">
        <div className="bg-white rounded-[2rem] p-10 text-center border border-gray-100 shadow-xl shadow-primary-900/5">
          <h1 className="text-2xl font-black text-gray-900 mb-2">Profile Not Found</h1>
          <p className="text-gray-500 font-medium">We couldn't find a patient record linked to your account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-primary-900/5 border border-gray-100 overflow-hidden">
        {/* Header Section */}
        <div className="bg-primary-50/50 p-10 border-b border-primary-50">
          <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
            <div className="h-32 w-32 rounded-[2rem] bg-white border-4 border-white shadow-lg shadow-primary-100 flex items-center justify-center text-primary-600 font-black text-5xl shrink-0">
              {patientData.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">{patientData.name}</h1>
              <div className="flex flex-col md:flex-row items-center gap-4 text-gray-500 font-medium text-sm">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
                  <User size={16} className="text-primary-400" />
                  <span>@{user.username}</span>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
                  <Mail size={16} className="text-primary-400" />
                  <span>{user.email}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="group flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold shadow-lg shadow-primary-200 transition-all active:scale-95"
            >
              <Edit2 size={18} className="group-hover:rotate-12 transition-transform" />
              <span>Edit Details</span>
            </button>
          </div>
        </div>

        {/* Details Grid */}
        <div className="p-10">
          <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-8">Personal Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Phone */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gray-50 rounded-2xl text-gray-400">
                <Phone size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Phone Number</p>
                <p className="text-lg font-bold text-gray-900">{patientData.phone}</p>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gray-50 rounded-2xl text-gray-400">
                <MapPin size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Residential Address</p>
                <p className="text-lg font-bold text-gray-900 leading-relaxed">{patientData.address}</p>
              </div>
            </div>

            {/* Age */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gray-50 rounded-2xl text-gray-400">
                <Calendar size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Age</p>
                <p className="text-lg font-bold text-gray-900">{patientData.age} Years Old</p>
              </div>
            </div>

            {/* Gender */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gray-50 rounded-2xl text-gray-400">
                <User size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Gender</p>
                <p className="text-lg font-bold text-gray-900">{patientData.gender}</p>
              </div>
            </div>
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
