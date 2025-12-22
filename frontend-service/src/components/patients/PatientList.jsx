import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Users, Plus, Search, Edit2, Trash2, Calendar, Phone, MapPin, Activity, Stethoscope, Heart } from 'lucide-react';
import PatientForm from './PatientForm';
import Button from '../ui/Button';

const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);

  const isAdmin = user.role === 'admin' || user.role === 'superadmin';

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/patients');
      setPatients(res.data);
    } catch (err) {
      toast.error('Could not fetch patients.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        await api.delete(`/patients/${id}`);
        toast.success('Patient deleted successfully!');
        fetchPatients();
      } catch (err) {
        toast.error('Failed to delete patient.');
      }
    }
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.diagnosis && p.diagnosis.toLowerCase().includes(search.toLowerCase()))
  );

  const openModalForNew = () => {
    setEditingPatient(null);
    setIsModalOpen(true);
  };

  const openModalForEdit = (patient) => {
    setEditingPatient(patient);
    setIsModalOpen(true);
  };

  const StatusBadge = ({ status }) => {
    const statusConfig = {
      'Active': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
      'Recovered': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
      'Deceased': { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' },
    };
    const config = statusConfig[status] || { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' };
    
    return (
      <span className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border ${config.bg} ${config.text} ${config.border}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
        {status}
      </span>
    );
  };

  // --- Conditional Rendering Logic ---
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-100 rounded-full"></div>
          <div className="w-16 h-16 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
        </div>
        <p className="text-slate-500 font-medium animate-pulse">Loading data...</p>
      </div>
    );
  }

  // If user is NOT admin and has NO patient data, show profile creation form
  if (!isAdmin && patients.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-xl shadow-slate-200/50 max-w-4xl mx-auto border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/25">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Welcome!</h1>
          <p className="text-slate-500">Please complete your patient profile to continue.</p>
        </div>
        <PatientForm onSuccess={fetchPatients} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{isAdmin ? 'Patient Management' : 'My Health Record'}</h1>
          {isAdmin && <p className="text-slate-500 mt-1">Managing {patients.length} patient records</p>}
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {isAdmin && (
            <>
              <div className="relative">
                <Search className="absolute h-5 w-5 text-slate-400 left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  className="w-full sm:w-72 pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                  placeholder="Search patients..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button onClick={openModalForNew}>
                <Plus size={18} />
                <span>Add Patient</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {filteredPatients.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border-2 border-dashed border-slate-200">
          <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No Patient Data Found</h3>
          {isAdmin && <p className="text-slate-500">Get started by adding a new patient record.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <div 
              key={patient._id} 
              className="group bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                      {patient.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{patient.name}</h3>
                      <StatusBadge status={patient.status} />
                    </div>
                  </div>
                </div>

                {/* Patient Details */}
                <div className="space-y-3 mt-5">
                  <div className="flex items-center text-slate-600 gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-indigo-100 transition-colors">
                      <Activity size={14} className="text-slate-500 group-hover:text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-slate-400 font-medium">Diagnosis</span>
                      <p className="text-sm font-semibold text-slate-700 truncate">{patient.diagnosis}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-slate-600 gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-indigo-100 transition-colors">
                      <Calendar size={14} className="text-slate-500 group-hover:text-indigo-600" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-medium">Details</span>
                      <p className="text-sm font-semibold text-slate-700">{patient.age} years • {patient.gender}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-slate-600 gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-indigo-100 transition-colors">
                      <Phone size={14} className="text-slate-500 group-hover:text-indigo-600" />
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-medium">Contact</span>
                      <p className="text-sm font-semibold text-slate-700">{patient.phone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start text-slate-600 gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-indigo-100 transition-colors">
                      <MapPin size={14} className="text-slate-500 group-hover:text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-slate-400 font-medium">Address</span>
                      <p className="text-sm font-semibold text-slate-700 truncate">{patient.address}</p>
                    </div>
                  </div>

                  {patient.assignedDoctorName && (
                    <div className="flex items-center text-slate-600 gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-indigo-100 transition-colors">
                        <Stethoscope size={14} className="text-slate-500 group-hover:text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-slate-400 font-medium">Doctor</span>
                        <p className="text-sm font-semibold text-slate-700 truncate">{patient.assignedDoctorName}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-6 py-4 bg-slate-50/50 flex justify-end items-center gap-2 border-t border-slate-100">
                <button 
                  onClick={() => openModalForEdit(patient)} 
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all hover:border-slate-300"
                >
                  <Edit2 size={14} />
                  <span>Edit</span>
                </button>
                {isAdmin && (
                  <button 
                    onClick={() => handleDelete(patient._id)} 
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all"
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isAdmin && (
        <PatientForm 
          patient={editingPatient}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            setIsModalOpen(false);
            fetchPatients();
          }} 
        />
      )}
    </div>
  );
};

export default PatientList;
