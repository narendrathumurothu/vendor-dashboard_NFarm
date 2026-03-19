import React, { useState, useEffect } from 'react';
import { Bell, Search, X } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

const pageTitles = {
  'home':          '🏠 Dashboard',
  'firms':         '🏡 My Firms',
  'products':      '📦 My Products',
  'orders':        '📋 Orders',
  'marketprices':  '📊 Market Prices',
  'suggestions':   '💡 Suggestions',
  'notifications': '🔔 Notifications',
  'profile':       '👤 My Profile',
};

const Navbar = ({ activePage, setActivePage }) => {
  const vendorName              = localStorage.getItem('vendorName') || 'Farmer';
  const [unread, setUnread]     = useState(0);
  const [search, setSearch]     = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const calculateUnread = async () => {
      try {
        const res  = await fetch('http://localhost:4000/marketprice/getallprices');
        const data = await res.json();
        if (Array.isArray(data)) {
          const highDemand = data.filter(p => p.modalPrice >= 3000).length;
          const lowPrice   = data.filter(p => p.modalPrice < 500).length;
          setUnread(Math.min(highDemand + lowPrice + 1, 99));
        }
      } catch {
        setUnread(3);
      }
    };
    calculateUnread();
  }, []);

  useEffect(() => {
    if (activePage === 'notifications') setUnread(0);
  }, [activePage]);

  return (
    <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between"
      style={{ borderBottom: '1px solid #f0efe1' }}>

      {/* Left - Page Title */}
      <div>
        <h1 className="text-xl font-bold text-gray-800">
          {pageTitles[activePage] || '🌾 NFarm'}
        </h1>
        <p className="text-gray-400 text-xs mt-0.5">NFarm Farmer Dashboard</p>
      </div>

      {/* Right - Actions */}
      <div className="flex items-center gap-3">

        {/* ✅ Language Switcher */}
        <div className="hidden md:block">
          <LanguageSwitcher style="navbar" />
        </div>

        {/* Search */}
        <div className={`flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 transition-all ${showSearch ? 'w-48' : 'w-10'}`}
          style={{ overflow: 'hidden' }}>
          <button onClick={() => setShowSearch(!showSearch)}>
            <Search size={18} className="text-gray-400 flex-shrink-0" />
          </button>
          {showSearch && (
            <>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="text-sm outline-none bg-transparent text-gray-600 w-full"
                autoFocus />
              {search && (
                <button onClick={() => setSearch('')}>
                  <X size={14} className="text-gray-400" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Bell */}
        <button onClick={() => setActivePage('notifications')}
          className="relative p-2 bg-gray-50 rounded-xl hover:bg-green-50 transition-all">
          <Bell size={20} className="text-gray-600" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
              style={{ minWidth: '18px', height: '18px', fontSize: '10px', padding: '0 4px' }}>
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </button>

        {/* Profile */}
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 cursor-pointer hover:bg-green-50 transition-all"
          onClick={() => setActivePage('profile')}>
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {vendorName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="hidden md:block">
            <p className="text-gray-800 text-sm font-medium">{vendorName}</p>
            <p className="text-gray-400 text-xs">Vendor</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Navbar;