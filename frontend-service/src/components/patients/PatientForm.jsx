import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Loader2, User, Stethoscope, Settings } from 'lucide-react';

const PatientForm = ({ patient, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '', age: '', gender: 'Male', address: '', phone: '', diagnosis: '', status: 'Active', userId: '', assignedDoctorId: ''
  });
  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'superadmin';

  const initializeForm = () => {
    if (patient) {
      setFormData({
        name: patient.name || '',
        age: patient.age || '',
        gender: patient.gender || 'Male',
        address: patient.address || '',
        phone: patient.phone || '',
        diagnosis: patient.diagnosis || '',
        status: patient.status || 'Active',
        userId: patient.userId || '',
        assignedDoctorId: patient.assignedDoctorId || '',
      });
    } else {
      setFormData({
        name: '', age: '', gender: 'Male', address: '', phone: '', diagnosis: '', status: 'Active', userId: '', assignedDoctorId: ''
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      initializeForm();
      if (isAdmin) {
        fetchUsers();
        fetchDoctors();
      }
    }
  }, [patient, isOpen]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.filter(u => u.role === 'user'));
    } catch (err) {
      console.error('Failed to fetch user accounts');
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/doctors');
      setDoctors(res.data.filter(d => d.isActive));
    } catch (err) {
      console.error('Failed to fetch doctors');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const payload = { ...formData };
    if (!payload.userId) delete payload.userId;
    if (!payload.assignedDoctorId) delete payload.assignedDoctorId;

    const apiCall = patient
      ? api.put(`/patients/${patient._id}`, payload)
      : api.post('/patients', payload);

    try {
      await toast.promise(apiCall, {
        loading: patient ? 'Updating patient...' : 'Creating patient...',
        success: 'Operation successful!',
        error: 'An error occurred.',
      });
      onSuccess();
    } catch (err) {
      // Toast promise handles error display
    } finally {
      setLoading(false);
    }
  };

  const selectClasses = "block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 hover:border-slate-300";
  const labelClasses = "text-sm font-medium text-slate-600 mb-1.5 block";

  const renderSelect = (id, label, value, onChange, options, placeholder) => (
    <div className="group">
      <label htmlFor={id} className={`${labelClasses} group-focus-within:text-indigo-600 transition-colors`}>{label}</label>
      <select 
        id={id}
        name={id}
        className={selectClasses}
        value={value}
        onChange={onChange}
      >
        <option value="">{placeholder}</option>
        {options}
      </select>
    </div>
  );

  return (
    <Modal title={patient ? 'Edit Patient' : 'Add New Patient'} isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Details Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <User size={18} className="text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Patient Details</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Input id="name" name="name" label="Full Name" required value={formData.name} onChange={handleInputChange} placeholder="Enter patient name" />
            </div>
            <Input id="age" name="age" type="number" label="Age" required value={formData.age} onChange={handleInputChange} placeholder="Age" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderSelect('gender', 'Gender', formData.gender, handleInputChange, 
              <>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </>
            )}
            <Input id="phone" name="phone" label="Phone Number" placeholder="e.g., 08123456789" required value={formData.phone} onChange={handleInputChange} />
          </div>

          <Input id="address" name="address" label="Home Address" required value={formData.address} onChange={handleInputChange} placeholder="Enter full address" />
        </div>
        
        {/* Medical Information Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Stethoscope size={18} className="text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Medical Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="group">
              <label htmlFor="diagnosis" className={`${labelClasses} group-focus-within:text-indigo-600 transition-colors`}>Current Diagnosis</label>
              <input
                id="diagnosis"
                name="diagnosis"
                type="text"
                required
                value={formData.diagnosis}
                onChange={handleInputChange}
                disabled={!isAdmin}
                placeholder="Enter diagnosis"
                className={`${selectClasses} ${!isAdmin ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200' : ''}`}
              />
            </div>
            <div className="group">
              <label htmlFor="status" className={`${labelClasses} group-focus-within:text-indigo-600 transition-colors`}>Medical Status</label>
              {isAdmin ? (
                <select 
                  id="status"
                  name="status"
                  className={selectClasses}
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="Active">Active</option>
                  <option value="Recovered">Recovered</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Deceased">Deceased</option>
                </select>
              ) : (
                <input
                  type="text"
                  disabled
                  value={formData.status}
                  className={`${selectClasses} bg-slate-100 text-slate-500 cursor-not-allowed`}
                />
              )}
            </div>
          </div>
        </div>

        {/* Admin Settings Section */}
        {isAdmin && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Settings size={18} className="text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Admin Settings</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
              {renderSelect('userId', 'Link Account', formData.userId, handleInputChange,
                users.map(u => <option key={u._id} value={u._id}>{u.username}</option>),
                '-- No Account --'
              )}
              {renderSelect('assignedDoctorId', 'Assign Doctor', formData.assignedDoctorId, handleInputChange,
                doctors.map(d => <option key={d._id} value={d._id}>{d.name}</option>),
                '-- Select Doctor --'
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (patient ? 'Update Patient' : 'Save Patient')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PatientForm;
