import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Loader2, Stethoscope } from 'lucide-react';

const DoctorForm = ({ doctor, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '', specialty: '', phone: '', email: '', isActive: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (doctor) {
        setFormData({
          name: doctor.name || '',
          specialty: doctor.specialty || '',
          phone: doctor.phone || '',
          email: doctor.email || '',
          isActive: doctor.isActive !== undefined ? doctor.isActive : true,
        });
      } else {
        setFormData({
          name: '', specialty: '', phone: '', email: '', isActive: true
        });
      }
    }
  }, [doctor, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'isActive') {
      setFormData(prev => ({ ...prev, isActive: value === 'true' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const apiCall = doctor
      ? api.put(`/doctors/${doctor._id}`, formData)
      : api.post('/doctors', formData);

    try {
      await toast.promise(apiCall, {
        loading: doctor ? 'Updating doctor...' : 'Creating doctor...',
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

  return (
    <Modal title={doctor ? 'Edit Doctor' : 'Add New Doctor'} isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Doctor Info Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Stethoscope size={18} className="text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Doctor Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input id="name" name="name" label="Full Name" required value={formData.name} onChange={handleInputChange} placeholder="Dr. John Smith" />
            <Input id="specialty" name="specialty" label="Specialty" required value={formData.specialty} onChange={handleInputChange} placeholder="e.g., Cardiology" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input id="phone" name="phone" label="Phone Number" required value={formData.phone} onChange={handleInputChange} placeholder="e.g., 08123456789" />
            <Input id="email" name="email" type="email" label="Email (Optional)" value={formData.email} onChange={handleInputChange} placeholder="doctor@clinic.com" />
          </div>

          <div className="group">
            <label htmlFor="isActive" className={`${labelClasses} group-focus-within:text-indigo-600 transition-colors`}>Status</label>
            <select 
              id="isActive"
              name="isActive"
              className={selectClasses}
              value={formData.isActive}
              onChange={handleInputChange}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (doctor ? 'Update Doctor' : 'Save Doctor')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default DoctorForm;
