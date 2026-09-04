import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Users, FileText, Settings } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/jobs', label: 'Jobs', icon: Briefcase },
    { path: '/applications', label: 'Applications', icon: FileText },
    { path: '/applicants', label: 'Applicants', icon: Users },
  ];
  
  return (
    <nav className="bg-white shadow-lg border-r border-gray-200 w-64 min-h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-600">ATS Demo</h1>
        <p className="text-sm text-gray-500 mt-1">Applicant Tracking System</p>
      </div>
      
      <div className="mt-8">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors ${
                isActive ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : ''
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
      
      <div className="absolute bottom-0 w-64 p-6 border-t border-gray-200">
        <div className="flex items-center text-gray-600">
          <Settings className="w-5 h-5 mr-3" />
          <span className="font-medium">Settings</span>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
