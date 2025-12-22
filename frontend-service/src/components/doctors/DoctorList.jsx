import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Stethoscope, Plus, Edit2, Trash2, Phone, Mail, UserCheck, UserX, Search } from 'lucide-react';
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
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
      isActive 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800'
    }`}>
      {isActive ? <UserCheck size={12} /> : <UserX size={12} />}
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark">Doctors</h1>
          <p className="text-brand-secondary mt-1">Managing {doctors.length} doctor records</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-brand-light" />
            </div>
            <input
              type="text"
              className="block w-full md:w-64 pl-10 pr-3 py-2 bg-white border border-brand-light rounded-lg text-sm text-brand-dark placeholder-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition"
              placeholder="Search by name or specialty"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button onClick={openModalForNew} className="!py-2">
            <Plus size={16} className="-ml-1" />
            <span>Add Doctor</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="bg-white rounded-lg p-12 text-center border border-dashed border-brand-light">
          <Stethoscope className="mx-auto h-12 w-12 text-brand-light mb-4" />
          <h3 className="text-lg font-medium text-brand-dark">No Doctors Found</h3>
          <p className="text-brand-secondary mt-1">Your search returned no results.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doctor) => (
            <div key={doctor._id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300 flex flex-col">
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-brand-primary/10 flex-shrink-0 flex items-center justify-center">
                      <Stethoscope className="h-6 w-6 text-brand-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-brand-dark">{doctor.name}</h3>
                      <p className="text-sm text-brand-primary font-semibold">{doctor.specialty}</p>
                    </div>
                  </div>
                  <StatusPill isActive={doctor.isActive} />
                </div>

                <div className="mt-5 pt-5 border-t border-gray-100 space-y-3 text-sm">
                  <div className="flex items-center text-brand-secondary">
                    <Phone size={14} className="mr-3 text-brand-light flex-shrink-0" />
                    <span>{doctor.phone}</span>
                  </div>
                  {doctor.email && (
                    <div className="flex items-center text-brand-secondary">
                      <Mail size={14} className="mr-3 text-brand-light flex-shrink-0" />
                      <span>{doctor.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-auto bg-gray-50 p-3 flex justify-end items-center gap-2 border-t border-gray-200 rounded-b-xl">
                <button onClick={() => openModalForEdit(doctor)} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-brand-secondary bg-white hover:bg-gray-100 border border-brand-light rounded-md transition-colors">
                  <Edit2 size={14} />
                  <span>Edit</span>
                </button>
                <button onClick={() => handleDelete(doctor._id)} className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors">
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
