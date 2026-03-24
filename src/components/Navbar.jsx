import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';

const pageTitles = {
  'home': '🏠 Dashboard',
  'firms': '🏡 My Firms',
  'products': '📦 My Products',
  'orders': '📋 Orders',
  'marketprices': '📊 Market Prices',
  'suggestions': '💡 Suggestions',
  'notifications': '🔔 Notifications',
  'profile': '👤 My Profile',
};

const Navbar = ({ activePage, setActivePage }) => {
  const vendorName = localStorage.getItem('vendorName') || 'Farmer';
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const calculateUnread = async () => {
      try {
        const res = await fetch('https://backend-node-js-nfarm.onrender.com/marketprice/getallprices');
        const data = await res.json();
        if (Array.isArray(data)) {
          const highDemand = data.filter(p => p.modalPrice >= 3000).length;
          const lowPrice = data.filter(p => p.modalPrice < 500).length;
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
    <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-[100]"
      style={{ borderBottom: '1px solid #f0efe1' }}>

      {/* Left - Page Title */}
      <div>
        <h1 className="text-xl font-bold text-gray-800">
          {pageTitles[activePage] || '🌾 NFarm'}
        </h1>
        <p className="text-gray-400 text-xs mt-0.5">NFarm Farmer Dashboard</p>
      </div>

      {/* Right - Actions (Search Deleted) */}
      <div className="flex items-center gap-4">
        
        {/* Bell / Notifications */}
        <button onClick={() => setActivePage('notifications')}
          className="relative p-2 bg-gray-50 rounded-xl hover:bg-green-50 transition-all">
          <Bell size={20} className="text-gray-600" />
          {unread > 0 && (
            <span
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
              style={{ minWidth: '18px', height: '18px', fontSize: '10px', padding: '0 4px' }}>
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </button>

        {/* Profile Section */}
        <div
          className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 cursor-pointer hover:bg-green-50 transition-all"
          onClick={() => setActivePage('profile')}>
          <div className="w-9 h-9 bg-green-600 rounded-full flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">
              {vendorName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="hidden md:block">
            <p className="text-gray-800 text-sm font-semibold leading-tight">{vendorName}</p>
            <p className="text-gray-400 text-[10px] uppercase tracking-wide">Farmer</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Navbar;