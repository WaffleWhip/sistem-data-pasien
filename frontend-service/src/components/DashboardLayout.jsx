import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Users, Stethoscope, LogOut, User, Menu, X, ChevronRight } from 'lucide-react';
import Logo from './ui/Logo';

const DashboardLayout = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isAdmin = user.role === 'admin' || user.role === 'superadmin';

  const navLinkClasses = ({ isActive }) =>
    `px-4 py-3 rounded-xl flex items-center gap-3 font-medium text-sm transition-all duration-200 ${
      isActive 
        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25' 
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;
  
  const profileLinkClasses = ({ isActive }) =>
    `p-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${
      isActive 
        ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200' 
        : 'bg-slate-50 hover:bg-slate-100 border border-transparent'
    }`;

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 w-72 bg-white border-r border-slate-200 flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Sidebar Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100">
          <Logo />
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Main Menu</p>
          
          <NavLink to="/" end className={navLinkClasses} onClick={() => setSidebarOpen(false)}>
            <Users size={20} />
            <span>{isAdmin ? 'Patients' : 'My Record'}</span>
          </NavLink>
          
          {isAdmin && (
            <NavLink to="/doctors" className={navLinkClasses} onClick={() => setSidebarOpen(false)}>
              <Stethoscope size={20} />
              <span>Doctors</span>
            </NavLink>
          )}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-slate-100">
          <NavLink to="/profile" className={profileLinkClasses} onClick={() => setSidebarOpen(false)}>
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/25">
              {user.username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{user.username}</p>
              <span className="text-xs text-slate-500 capitalize flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${isAdmin ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                {user.role}
              </span>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </NavLink>
          
          <button 
            onClick={handleLogout}
            className="w-full mt-3 flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200 font-medium text-sm group"
          >
            <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Menu size={24} />
          </button>
          <Logo size="sm" />
          <div className="w-10" /> {/* Spacer for centering */}
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
