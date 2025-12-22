import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Stethoscope, Plus, Edit2, Trash2, Phone, Mail, UserCheck, UserX, Search, Award } from 'lucide-react';
import DoctorForm from './DoctorForm';
import Button from '../ui/Button';

const DoctorList = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/doctors');
      setDoctors(res.data);
    } catch (err) {
      toast.error('Could not fetch doctors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      try {
        await api.delete(`/doctors/${id}`);
        toast.success('Doctor deleted successfully!');
        fetchDoctors();
      } catch (err) {
        toast.error('Failed to delete doctor.');
      }
    }
  };

  const openModalForNew = () => {
    setEditingDoctor(null);
    setIsModalOpen(true);
  };

  const openModalForEdit = (doctor) => {
    setEditingDoctor(doctor);
    setIsModalOpen(true);
  };

  const filteredDoctors = doctors.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.specialty.toLowerCase().includes(search.toLowerCase())
  );

  const StatusPill = ({ isActive }) => (
    <span className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border ${
      isActive 
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
        : 'bg-rose-50 text-rose-700 border-rose-200'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Doctor Management</h1>
          <p className="text-slate-500 mt-1">Managing {doctors.length} medical professionals</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <Search className="absolute h-5 w-5 text-slate-400 left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              className="w-full sm:w-72 pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
              placeholder="Search by name or specialty"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button onClick={openModalForNew}>
            <Plus size={18} />
            <span>Add Doctor</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col justify-center items-center h-96 gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-100 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-slate-500 font-medium animate-pulse">Loading doctors...</p>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border-2 border-dashed border-slate-200">
          <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Stethoscope className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No Doctors Found</h3>
          <p className="text-slate-500">Your search returned no results.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDoctors.map((doctor) => (
            <div 
              key={doctor._id} 
              className="group bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform">
                      <Stethoscope className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">{doctor.name}</h3>
                      <StatusPill isActive={doctor.isActive} />
                    </div>
                  </div>
                </div>

                {/* Doctor Details */}
                <div className="space-y-3 mt-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-emerald-100 transition-colors">
                      <Award size={14} className="text-slate-500 group-hover:text-emerald-600" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-medium">Specialty</span>
                      <p className="text-sm font-semibold text-emerald-600">{doctor.specialty}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-emerald-100 transition-colors">
                      <Phone size={14} className="text-slate-500 group-hover:text-emerald-600" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-medium">Phone</span>
                      <p className="text-sm font-semibold text-slate-700">{doctor.phone}</p>
                    </div>
                  </div>
                  
                  {doctor.email && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-emerald-100 transition-colors">
                        <Mail size={14} className="text-slate-500 group-hover:text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-slate-400 font-medium">Email</span>
                        <p className="text-sm font-semibold text-slate-700 truncate">{doctor.email}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-6 py-4 bg-slate-50/50 flex justify-end items-center gap-2 border-t border-slate-100">
                <button 
                  onClick={() => openModalForEdit(doctor)} 
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all hover:border-slate-300"
                >
                  <Edit2 size={14} />
                  <span>Edit</span>
                </button>
                <button 
                  onClick={() => handleDelete(doctor._id)} 
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all"
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <DoctorForm 
        doctor={editingDoctor}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          setIsModalOpen(false);
          fetchDoctors();
        }} 
      />
    </div>
  );
};

export default DoctorList;
