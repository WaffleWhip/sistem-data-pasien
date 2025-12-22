import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Loader2 } from 'lucide-react';

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

  const formInputClass = "bg-white border-brand-light text-brand-dark placeholder-brand-light focus:ring-brand-primary focus:border-brand-primary";
  const formLabelClass = "text-brand-secondary";

  const renderSelect = (id, label, value, onChange, options, placeholder) => (
    <div>
      <label htmlFor={id} className={`text-sm font-medium mb-1 block ${formLabelClass}`}>{label}</label>
      <select 
        id={id}
        name={id}
        className={`block w-full px-3 py-2.5 rounded-lg outline-none transition ${formInputClass}`}
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-lg font-semibold text-brand-dark border-b pb-2 mb-4">Patient Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Input id="name" name="name" label="Full Name" required value={formData.name} onChange={handleInputChange} className={formInputClass} labelClassName={formLabelClass} />
          </div>
          <Input id="age" name="age" type="number" label="Age" required value={formData.age} onChange={handleInputChange} className={formInputClass} labelClassName={formLabelClass} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderSelect('gender', 'Gender', formData.gender, handleInputChange, 
            <>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </>
          )}
          <Input id="phone" name="phone" label="Phone Number" placeholder="08..." required value={formData.phone} onChange={handleInputChange} className={formInputClass} labelClassName={formLabelClass} />
        </div>

        <Input id="address" name="address" label="Home Address" required value={formData.address} onChange={handleInputChange} className={formInputClass} labelClassName={formLabelClass} />
        
        <h3 className="text-lg font-semibold text-brand-dark border-b pb-2 mb-4 pt-4">Medical Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input 
            id="diagnosis" 
            name="diagnosis" 
            label="Current Diagnosis" 
            required 
            value={formData.diagnosis} 
            onChange={handleInputChange} 
            className={`${formInputClass} ${!isAdmin ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-default' : ''}`}
            labelClassName={formLabelClass}
            disabled={!isAdmin}
          />
          <div>
            <label htmlFor="status" className={`text-sm font-medium mb-1 block ${formLabelClass}`}>Medical Status</label>
            {isAdmin ? (
              <select 
                id="status"
                name="status"
                className={`block w-full px-3 py-2.5 rounded-lg outline-none transition ${formInputClass}`}
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
                className={`block w-full px-3 py-2.5 rounded-lg outline-none transition bg-gray-100 text-gray-500 border-brand-light border border-gray-200 cursor-default`}
              />
            )}
          </div>
        </div>

        {isAdmin && (
          <>
            <h3 className="text-lg font-semibold text-brand-dark border-b pb-2 mb-4 pt-4">Admin Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-brand-background rounded-lg border border-gray-200">
              {renderSelect('userId', 'Link Account', formData.userId, handleInputChange,
                users.map(u => <option key={u._id} value={u._id}>{u.username}</option>),
                '-- No Account --'
              )}
              {renderSelect('assignedDoctorId', 'Assign Doctor', formData.assignedDoctorId, handleInputChange,
                doctors.map(d => <option key={d._id} value={d._id}>{d.name}</option>),
                '-- Select Doctor --'
              )}
            </div>
          </>
        )}

        <div className="flex gap-3 pt-5 mt-5 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full">Cancel</Button>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : (patient ? 'Update Patient' : 'Save Patient')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PatientForm;
