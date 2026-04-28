import React, { useState } from 'react';
import {
  Home, Store, Package, TrendingUp,
  Bell, User, LogOut,
  ChevronLeft, ChevronRight, Lightbulb, ClipboardList
} from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

const Sidebar = ({ activePage, setActivePage, isOpen, setIsOpen }) => {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { id: 'home',          label: 'Dashboard',     icon: Home },
    { id: 'profile',       label: 'My Profile',    icon: User },
    { id: 'firms',         label: 'My Firms',      icon: Store },
    { id: 'products',      label: 'My Products',   icon: Package },
    { id: 'orders',        label: 'Orders',        icon: ClipboardList },
    { id: 'marketprices',  label: 'Market Prices', icon: TrendingUp },
    { id: 'suggestions',   label: 'Suggestions',   icon: Lightbulb },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div
        className={`fixed inset-y-0 left-0 z-50 md:relative min-h-screen flex flex-col transition-all duration-300 
          ${collapsed ? 'w-16' : 'w-64'} 
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{ background: 'linear-gradient(180deg, #14532d, #166534, #15803d)' }}>

      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-green-700">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-green-400 rounded-xl flex items-center justify-center text-xl">
              🌾
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">NFarm</h1>
              <p className="text-green-300 text-xs">Farmer Panel</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-9 h-9 bg-green-400 rounded-xl flex items-center justify-center text-xl mx-auto">
            🌾
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)}
          className="text-green-300 hover:text-white ml-auto">
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* ✅ Language Switcher — fixed: variant instead of style */}
      {!collapsed && (
        <div className="px-3 pt-3">
          <LanguageSwitcher variant="sidebar" />
        </div>
      )}

      {/* Menu Items */}
      <nav className="flex-1 p-3 space-y-1 mt-2">
        {menuItems.map((item) => {
          const Icon     = item.icon;
          const isActive = activePage === item.id;
          return (
            <button key={item.id} onClick={() => { setActivePage(item.id); setIsOpen(false); }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left
                ${isActive
                  ? 'bg-white bg-opacity-20 text-white border-l-4 border-green-400'
                  : 'text-green-200 hover:bg-white hover:bg-opacity-10 hover:text-white'
                }`}>
              <Icon size={20} className="flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-green-700">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 p-3 rounded-xl text-green-200 hover:bg-red-500 hover:bg-opacity-20 hover:text-red-300 transition-all">
          <LogOut size={20} className="flex-shrink-0" />
          {!collapsed && (
            <span className="text-sm font-medium">Logout</span>
          )}
        </button>
      </div>
    </div>
    </>
  );
};

export default Sidebar;