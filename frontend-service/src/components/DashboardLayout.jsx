import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Users, Stethoscope, LogOut, User } from 'lucide-react';
import Logo from './ui/Logo';

const DashboardLayout = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isAdmin = user.role === 'admin' || user.role === 'superadmin';

  const navLinkClasses = ({ isActive }) =>
    `px-4 py-3 rounded-lg flex items-center gap-3 font-semibold text-sm transition-colors ${
      isActive 
        ? 'bg-brand-primary text-white' 
        : 'text-brand-secondary hover:bg-brand-background hover:text-brand-dark'
    }`;
  
  const profileLinkClasses = ({ isActive }) =>
    `p-3 rounded-lg mb-2 flex items-center gap-3 transition-colors ${
      isActive ? 'bg-brand-primary/10' : 'bg-brand-background hover:bg-gray-200'
    }`;

  return (
    <div className="min-h-screen bg-brand-background flex font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col p-4">
        <div className="h-16 flex items-center mb-4 px-2">
          <Logo />
        </div>
        
        <nav className="flex-1 space-y-2">
          <NavLink to="/" end className={navLinkClasses}>
            <Users size={20} />
            <span>{isAdmin ? 'Patients' : 'My Record'}</span>
          </NavLink>
          {isAdmin && (
            <NavLink to="/doctors" className={navLinkClasses}>
              <Stethoscope size={20} />
              <span>Doctors</span>
            </NavLink>
          )}
        </nav>

        <div className="mt-auto">
          <NavLink to="/profile" className={profileLinkClasses}>
            <div className="h-10 w-10 rounded-full bg-brand-primary flex items-center justify-center text-white font-bold">
              {user.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-dark">{user.username}</p>
              <span className="text-xs text-brand-secondary capitalize">
                {user.role}
              </span>
            </div>
          </NavLink>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-brand-secondary hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors font-semibold text-sm"
          >
            <LogOut size={20} />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
