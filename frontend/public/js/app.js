// API Configuration
const API_URL = '';

// Token Management
const getToken = () => localStorage.getItem('token');
const setToken = (token) => localStorage.setItem('token', token);
const removeToken = () => localStorage.removeItem('token');

const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

const setUser = (user) => localStorage.setItem('user', JSON.stringify(user));
const removeUser = () => localStorage.removeItem('user');

// API Helpers
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    }
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      if (response.status === 401) {
        removeToken();
        removeUser();
        window.location.href = '/login';
        return;
      }
      throw new Error(data.message || 'Terjadi kesalahan');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Toast Notifications
const showToast = (message, type = 'info') => {
  const container = document.getElementById('toast-container') || createToastContainer();
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

const createToastContainer = () => {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
};

// Loading State
const showLoading = () => {
  const existing = document.getElementById('loading-overlay');
  if (existing) return;
  
  const overlay = document.createElement('div');
  overlay.id = 'loading-overlay';
  overlay.className = 'loading-overlay';
  overlay.innerHTML = '<div class="spinner"></div>';
  document.body.appendChild(overlay);
};

const hideLoading = () => {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.remove();
};

// Auth Check
const checkAuth = async () => {
  const token = getToken();
  if (!token) {
    window.location.href = '/login';
    return null;
  }
  
  try {
    const response = await apiRequest('/api/auth/verify');
    if (response.success) {
      setUser(response.data);
      return response.data;
    }
  } catch (error) {
    removeToken();
    removeUser();
    window.location.href = '/login';
  }
  return null;
};

// Format Date
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

const formatDateInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

// Calculate Age
const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return '-';
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age + ' tahun';
};

// Modal Functions
const openModal = (modalId) => {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
};

const closeModal = (modalId) => {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
};

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// Update UI based on user role
const updateUIForRole = (user) => {
  const adminElements = document.querySelectorAll('.admin-only');
  const userElements = document.querySelectorAll('.user-only');
  
  if (user.role === 'admin') {
    adminElements.forEach(el => el.classList.remove('hidden'));
    userElements.forEach(el => el.classList.add('hidden'));
  } else {
    adminElements.forEach(el => el.classList.add('hidden'));
    userElements.forEach(el => el.classList.remove('hidden'));
  }
};

// Update navbar user info
const updateNavbarUser = (user) => {
  const userName = document.getElementById('navbar-user-name');
  const userRole = document.getElementById('navbar-user-role');
  const userAvatar = document.getElementById('navbar-user-avatar');
  
  if (userName) userName.textContent = user.name;
  if (userRole) userRole.textContent = user.role === 'admin' ? 'Administrator' : 'Pasien';
  if (userAvatar) userAvatar.textContent = user.name.charAt(0).toUpperCase();
};

// Logout
const logout = () => {
  removeToken();
  removeUser();
  showToast('Berhasil logout', 'success');
  setTimeout(() => {
    window.location.href = '/login';
  }, 500);
};

// Notification System
let notificationCount = 0;
let cachedNotifications = [];

const loadNotifications = async () => {
  const user = getUser();
  if (!user || user.role === 'admin') return [];
  
  try {
    // Get notifications from database
    const response = await apiRequest('/api/notifications');
    
    if (response.success) {
      cachedNotifications = response.data.map(notif => ({
        id: notif._id,
        type: notif.type,
        icon: notif.type === 'link_request' ? 'fa-link' : notif.type === 'visit_completed' ? 'fa-check-circle' : 'fa-bell',
        title: notif.title,
        desc: notif.message,
        action: notif.actionUrl || '/profile',
        data: notif.data,
        isRead: notif.isRead
      }));
      
      updateNotificationBell(cachedNotifications.filter(n => !n.isRead));
      return cachedNotifications;
    }
    
    return [];
  } catch (error) {
    console.log('Notification load failed:', error);
    return [];
  }
};

const updateNotificationBell = (notifications) => {
  notificationCount = notifications.length;
  
  const badge = document.getElementById('notif-badge');
  const dropdown = document.getElementById('notif-dropdown-list');
  
  if (badge) {
    if (notificationCount > 0) {
      badge.textContent = notificationCount > 9 ? '9+' : notificationCount;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }
  
  if (dropdown) {
    if (notifications.length === 0) {
      dropdown.innerHTML = `
        <div class="notification-empty">
          <i class="fas fa-bell-slash"></i>
          <p>Tidak ada notifikasi</p>
        </div>
      `;
    } else {
      dropdown.innerHTML = notifications.map(notif => `
        <div class="notification-item" onclick="handleNotificationClick('${notif.action}', '${notif.id}')" style="display: flex; align-items: center;">
          <div class="notif-icon">
            <i class="fas ${notif.icon}"></i>
          </div>
          <div class="notif-content">
            <div class="notif-title">${notif.title}</div>
            <div class="notif-desc">${notif.desc}</div>
          </div>
        </div>
      `).join('');
    }
  }
};

const toggleNotificationDropdown = () => {
  const dropdown = document.getElementById('notif-dropdown');
  if (dropdown) {
    dropdown.classList.toggle('show');
  }
};

const handleNotificationClick = async (action, notifId) => {
  const dropdown = document.getElementById('notif-dropdown');
  if (dropdown) dropdown.classList.remove('show');
  
  // Mark notification as read
  if (notifId && notifId !== 'undefined') {
    try {
      await apiRequest(`/api/notifications/${notifId}/read`, { method: 'PUT' });
    } catch (e) {
      console.log('Failed to mark notification as read');
    }
  }
  
  window.location.href = action;
};

// Close notification dropdown when clicking outside
document.addEventListener('click', (e) => {
  const bell = document.querySelector('.notification-bell');
  const dropdown = document.getElementById('notif-dropdown');
  
  if (bell && dropdown && !bell.contains(e.target)) {
    dropdown.classList.remove('show');
  }
});

// Form Validation
const validateForm = (formId) => {
  const form = document.getElementById(formId);
  const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
  let isValid = true;
  
  inputs.forEach(input => {
    if (!input.value.trim()) {
      input.classList.add('error');
      isValid = false;
    } else {
      input.classList.remove('error');
    }
  });
  
  return isValid;
};

// Confirm Delete
const confirmDelete = (message) => {
  return confirm(message || 'Apakah Anda yakin ingin menghapus data ini?');
};

// Custom Confirm Dialog with beautiful UI
const showConfirm = (title, message) => {
  return new Promise((resolve) => {
    // Remove existing confirm modal
    const existing = document.getElementById('confirm-modal');
    if (existing) existing.remove();
    
    const modal = document.createElement('div');
    modal.id = 'confirm-modal';
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
      <div class="modal" style="max-width: 420px; animation: modalSlideIn 0.3s ease;">
        <div class="modal-header" style="border-bottom: none; padding-bottom: 0;">
          <h3 style="display: flex; align-items: center; gap: 0.75rem;">
            <span style="width: 40px; height: 40px; border-radius: 50%; background: rgba(239, 68, 68, 0.1); display: flex; align-items: center; justify-content: center;">
              <i class="fas fa-exclamation-triangle" style="color: var(--danger); font-size: 1.1rem;"></i>
            </span>
            ${title}
          </h3>
          <button class="modal-close" id="confirm-close">&times;</button>
        </div>
        <div class="modal-body" style="padding-top: 0.5rem;">
          <p style="color: var(--gray-600); line-height: 1.6;">${message}</p>
        </div>
        <div class="modal-footer" style="border-top: none; padding-top: 0; gap: 0.75rem;">
          <button class="btn btn-secondary" id="confirm-no" style="flex: 1;">
            <i class="fas fa-times"></i> Batal
          </button>
          <button class="btn btn-danger" id="confirm-yes" style="flex: 1;">
            <i class="fas fa-check"></i> Ya, Lanjutkan
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    const cleanup = (result) => {
      modal.remove();
      document.body.style.overflow = '';
      resolve(result);
    };
    
    document.getElementById('confirm-yes').onclick = () => cleanup(true);
    document.getElementById('confirm-no').onclick = () => cleanup(false);
    document.getElementById('confirm-close').onclick = () => cleanup(false);
    modal.onclick = (e) => {
      if (e.target === modal) cleanup(false);
    };
  });
};

// Export functions for use in other scripts
window.app = {
  apiRequest,
  showToast,
  showLoading,
  hideLoading,
  checkAuth,
  formatDate,
  formatDateInput,
  calculateAge,
  openModal,
  closeModal,
  updateUIForRole,
  updateNavbarUser,
  logout,
  validateForm,
  confirmDelete,
  showConfirm,
  getToken,
  setToken,
  removeToken,
  getUser,
  setUser,
  removeUser,
  loadNotifications,
  updateNotificationBell,
  toggleNotificationDropdown,
  handleNotificationClick
};
