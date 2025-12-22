import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Users, Plus, Search, Edit2, Trash2, Calendar, Phone, MapPin, Activity, User, Briefcase } from 'lucide-react';
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
    const baseClasses = "text-xs font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1";
    const statusClasses = {
      'Active': 'bg-green-100 text-green-800',
      'Recovered': 'bg-blue-100 text-blue-800',
      'Deceased': 'bg-gray-200 text-gray-800',
    };
    return <span className={`${baseClasses} ${statusClasses[status] || 'bg-yellow-100 text-yellow-800'}`}>{status}</span>;
  };

  // --- Conditional Rendering Logic ---
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  // If user is NOT admin and has NO patient data, show profile creation form
  if (!isAdmin && patients.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8 shadow-md max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-brand-dark mb-2">Welcome!</h1>
        <p className="text-brand-secondary mb-6">Please complete your patient profile to continue.</p>
        <PatientForm onSuccess={fetchPatients} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark">{isAdmin ? 'Patient Management' : 'My Health Record'}</h1>
          {isAdmin && <p className="text-brand-secondary mt-1">Total {patients.length} records</p>}
        </div>
        
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <div className="relative">
                <Search className="absolute h-5 w-5 text-brand-light left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  className="block w-full md:w-64 pl-10 pr-3 py-2 bg-white border border-brand-light rounded-lg text-sm text-brand-dark placeholder-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition"
                  placeholder="Search patients..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button onClick={openModalForNew} className="!py-2">
                <Plus size={16} className="-ml-1" />
                <span>New Patient</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {filteredPatients.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center border border-dashed border-brand-light">
          <Users className="mx-auto h-12 w-12 text-brand-light mb-4" />
          <h3 className="text-lg font-medium text-brand-dark">No Patient Data Found</h3>
          {isAdmin && <p className="text-brand-secondary mt-1">Get started by adding a new patient record.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <div key={patient._id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300 flex flex-col">
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-brand-primary/10 flex-shrink-0 flex items-center justify-center">
                      <User className="h-6 w-6 text-brand-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-brand-dark">{patient.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={patient.status} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-5 border-t border-gray-100 space-y-3 text-sm">
                  <div className="flex items-center text-brand-secondary">
                    <Activity size={16} className="mr-3 text-brand-light flex-shrink-0" />
                    <span className="font-medium text-brand-dark mr-2">Diagnosis:</span>
                    <span className="truncate" title={patient.diagnosis}>{patient.diagnosis}</span>
                  </div>
                  <div className="flex items-center text-brand-secondary">
                    <Calendar size={16} className="mr-3 text-brand-light flex-shrink-0" />
                    <span className="font-medium text-brand-dark mr-2">Details:</span>
                    {patient.age} years old • {patient.gender}
                  </div>
                  <div className="flex items-center text-brand-secondary">
                    <Phone size={16} className="mr-3 text-brand-light flex-shrink-0" />
                    <span className="font-medium text-brand-dark mr-2">Contact:</span>
                    {patient.phone}
                  </div>
                  <div className="flex items-start text-brand-secondary">
                    <MapPin size={16} className="mr-3 mt-0.5 text-brand-light flex-shrink-0" />
                    <div>
                      <span className="font-medium text-brand-dark">Address:</span>
                      <p className="text-brand-secondary">{patient.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-auto bg-gray-50 p-3 flex justify-end items-center gap-2 border-t border-gray-200 rounded-b-xl">
                <button onClick={() => openModalForEdit(patient)} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-brand-secondary bg-white hover:bg-gray-100 border border-brand-light rounded-md transition-colors">
                  <Edit2 size={14} />
                  <span>Edit</span>
                </button>
                {isAdmin && (
                  <button onClick={() => handleDelete(patient._id)} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors">
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
