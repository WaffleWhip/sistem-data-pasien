import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  Users, Plus, Search, 
  Phone, MapPin, Edit2, Trash2, 
  ChevronRight, Calendar, Info, Stethoscope
} from 'lucide-react';
import PatientForm from './patients/PatientForm';
import Logo from './ui/Logo';

const Dashboard = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/patients');
      setPatients(res.data);
    } catch (err) {
      console.error('Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this patient record?')) {
      try {
        await api.delete(`/patients/${id}`);
        fetchPatients();
      } catch (err) {
        alert('Failed to delete patient');
      }
    }
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.diagnosis.toLowerCase().includes(search.toLowerCase())
  );

  const isAdmin = user.role === 'admin' || user.role === 'superadmin';

  return (
    <div className="flex flex-col h-full min-w-0">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-100 px-10 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Patients</h1>
          <p className="text-gray-500 font-medium">Manage and track patient records</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors">
              <Search size={18} />
            </div>
            <input
              type="text"
              className="block w-full md:w-80 pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white outline-none transition-all"
              placeholder="Search by name or diagnosis..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          {isAdmin && (
            <button 
              onClick={() => { setEditingPatient(null); setIsModalOpen(true); }}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary-200 transition-all active:scale-95 shrink-0"
            >
              <Plus size={20} strokeWidth={3} />
              <span>Add New</span>
            </button>
          )}
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto p-10 bg-gray-50/50">
        {!isAdmin ? (
          // USER VIEW: My Health Record
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">My Health Record</h1>
              <p className="text-gray-500 font-medium mt-2">Track your recovery journey and medical history.</p>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-100 border-t-primary-600"></div>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="bg-white p-10 rounded-[2rem] shadow-sm text-center border border-gray-100">
                <p className="text-gray-500 font-medium">No health record found. Please contact the clinic.</p>
              </div>
            ) : (
              <>
                {/* Current Status Card */}
                {filteredPatients.map(patient => (
                  <div key={patient._id} className="space-y-8">
                    {patient.diagnosis === 'No diagnosis yet' ? (
                      // New User / Empty State View
                      <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-xl shadow-primary-900/5">
                        <div className="bg-primary-50 h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-6 text-primary-600">
                          <Stethoscope size={48} />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-3">Welcome to Health Cure!</h2>
                        <p className="text-gray-500 font-medium text-lg max-w-md mx-auto leading-relaxed">
                          Your account is registered. Please visit the clinic to establish your first medical record and diagnosis.
                        </p>
                      </div>
                    ) : (
                      // Existing Patient View
                      <>
                        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-primary-900/5 border border-primary-100 relative overflow-hidden">
                          <div className="absolute top-0 right-0 bg-primary-50 px-6 py-3 rounded-bl-3xl border-b border-l border-primary-100">
                            <p className="text-xs font-black text-primary-600 uppercase tracking-widest">Current Status</p>
                          </div>
                          
                          <div className="flex flex-col md:flex-row gap-8 items-start">
                            <div className="flex-1">
                              <h2 className="text-4xl font-black text-gray-900 mb-2">{patient.status}</h2>
                              <p className="text-gray-400 font-medium text-sm">Last updated: Today</p>
                              
                              <div className="mt-8 bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                <div className="flex items-center gap-2 mb-3">
                                  <Stethoscope size={18} className="text-primary-600" />
                                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Current Diagnosis</span>
                                </div>
                                <p className="text-xl font-bold text-gray-800 italic">"{patient.diagnosis}"</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* History Section (Dropdown/List style) */}
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Calendar size={20} className="text-gray-400" />
                            Medical History
                          </h3>
                          
                          {!patient.medicalHistory || patient.medicalHistory.length === 0 ? (
                            <div className="bg-white p-8 rounded-3xl border border-gray-100 text-center border-dashed">
                              <p className="text-gray-400 font-medium">No previous history records available.</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {patient.medicalHistory.slice().reverse().map((history, index) => (
                                <div key={index} className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-primary-200 transition-colors group cursor-default shadow-sm">
                                  <div className="flex justify-between items-start mb-3">
                                    <div>
                                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-2 ${
                                        history.status === 'Active' ? 'bg-green-100 text-green-700' : 
                                        history.status === 'Recovered' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                                      }`}>
                                        {history.status}
                                      </span>
                                      <h4 className="text-lg font-bold text-gray-900">{history.diagnosis}</h4>
                                    </div>
                                    <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-lg">
                                      {new Date(history.updatedAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  {history.doctorNotes && (
                                    <p className="text-sm text-gray-500 mt-2 bg-gray-50 p-3 rounded-xl">
                                      <span className="font-bold text-gray-700">Note:</span> {history.doctorNotes}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        ) : (
          // ADMIN VIEW: Patient List
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="flex flex-col justify-center items-center h-96 gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-100 border-t-primary-600"></div>
                <p className="text-gray-400 font-bold animate-pulse text-sm">Loading patient data...</p>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="bg-white rounded-[2.5rem] p-20 text-center border border-gray-100 shadow-sm">
                <div className="bg-gray-50 h-20 w-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Users className="h-10 w-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-black text-gray-900">No patients found</h3>
                <p className="text-gray-500 mt-2 max-w-xs mx-auto font-medium">We couldn't find any patient matching your search criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {filteredPatients.map((patient) => (
                  <div key={patient._id} className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all group relative">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600 font-black text-xl border border-primary-100 group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300">
                          {patient.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-black text-gray-900 text-lg leading-tight group-hover:text-primary-600 transition-colors">{patient.name}</h3>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={`inline-block w-2 h-2 rounded-full ${
                              patient.status === 'Active' ? 'bg-green-500' : 
                              patient.status === 'Recovered' ? 'bg-blue-500' : 'bg-gray-400'
                            }`}></span>
                            <span className="text-xs font-black text-gray-400 uppercase tracking-wider">
                              {patient.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => { setEditingPatient(patient); setIsModalOpen(true); }}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                          title="Edit Patient"
                        >
                          <Edit2 size={18} />
                        </button>
                        {isAdmin && (
                          <button 
                            onClick={() => handleDelete(patient._id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            title="Delete Record"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Age / Gender</p>
                          <p className="text-sm font-bold text-gray-700">{patient.age}y • {patient.gender}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Doctor</p>
                          <p className="text-sm font-bold text-gray-700 truncate">{patient.assignedDoctorName || 'Not Assigned'}</p>
                        </div>
                      </div>

                      <div className="flex items-center text-gray-600 gap-3 px-1">
                        <Phone size={16} className="text-gray-400" />
                        <span className="text-sm font-medium">{patient.phone}</span>
                      </div>
                      
                      <div className="flex items-start text-gray-600 gap-3 px-1">
                        <MapPin size={16} className="text-gray-400 mt-0.5" />
                        <span className="text-sm font-medium line-clamp-1">{patient.address}</span>
                      </div>

                      <div className="bg-primary-50/50 p-4 rounded-2xl mt-4 border border-primary-100/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Info size={14} className="text-primary-600" />
                          <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest">Medical Diagnosis</span>
                        </div>
                        <p className="text-sm font-bold text-gray-800 line-clamp-2 leading-relaxed italic">
                          "{patient.diagnosis}"
                        </p>
                      </div>
                    </div>
                    
                    <button className="w-full mt-8 py-3.5 flex items-center justify-center gap-2 text-primary-600 font-black text-xs uppercase tracking-[0.2em] bg-white border-2 border-primary-50 rounded-2xl hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-all duration-300">
                      Full Profile
                      <ChevronRight size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {isModalOpen && (
        <PatientForm 
          patient={editingPatient} 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => { setIsModalOpen(false); fetchPatients(); }} 
        />
      )}
    </div>
  );
};

export default Dashboard;
