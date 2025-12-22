import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Loader2 } from 'lucide-react';

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

  const formInputClass = "bg-white border-brand-light text-brand-dark placeholder-brand-light focus:ring-brand-primary focus:border-brand-primary";
  const formLabelClass = "text-brand-secondary";

  return (
    <Modal title={doctor ? 'Edit Doctor' : 'Add New Doctor'} isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input id="name" name="name" label="Full Name" required value={formData.name} onChange={handleInputChange} className={formInputClass} labelClassName={formLabelClass} />
          <Input id="specialty" name="specialty" label="Specialty" required value={formData.specialty} onChange={handleInputChange} className={formInputClass} labelClassName={formLabelClass} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input id="phone" name="phone" label="Phone Number" required value={formData.phone} onChange={handleInputChange} className={formInputClass} labelClassName={formLabelClass} />
          <Input id="email" name="email" type="email" label="Email (Optional)" value={formData.email} onChange={handleInputChange} className={formInputClass} labelClassName={formLabelClass} />
        </div>

        <div>
          <label htmlFor="isActive" className={`text-sm font-medium mb-1 block ${formLabelClass}`}>Status</label>
          <select 
            id="isActive"
            name="isActive"
            className={`block w-full px-3 py-2.5 rounded-lg outline-none transition ${formInputClass}`}
            value={formData.isActive}
            onChange={handleInputChange}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        <div className="flex gap-3 pt-5 mt-5 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={onClose} className="w-full">Cancel</Button>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : (doctor ? 'Update Doctor' : 'Save Doctor')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default DoctorForm;
