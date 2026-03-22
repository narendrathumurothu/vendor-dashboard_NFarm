import React, { useState, useEffect, useCallback } from 'react';
import { Bell, TrendingUp, TrendingDown, Package, LogIn, Trash2, CheckCheck } from 'lucide-react';

const backgroundImages = [
  'https://images.pexels.com/photos/440731/pexels-photo-440731.jpeg',
  'https://images.pexels.com/photos/247599/pexels-photo-247599.jpeg',
  'https://images.pexels.com/photos/235725/pexels-photo-235725.jpeg',
  'https://images.pexels.com/photos/1300972/pexels-photo-1300972.jpeg',
  'https://images.pexels.com/photos/462118/pexels-photo-462118.jpeg',
];

const Notifications = () => {
  const vendorName = localStorage.getItem('vendorName') || 'Farmer';

  const [currentBg, setCurrentBg]         = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter]               = useState('All');
  // ✅ Fix: removed unused 'prices' state

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg(prev => (prev + 1) % backgroundImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Fix: wrapped in useCallback with vendorName dependency
  const generateNotifications = useCallback(async () => {
    const notifs = [];

    notifs.push({
      id: 1,
      type: 'login',
      icon: <LogIn size={18} />,
      color: '#16a34a',
      bg: '#d8e432',
      title: `Welcome back, ${vendorName}! 👋`,
      message: 'You logged in successfully to NFarm Dashboard.',
      time: 'Just now',
      read: false,
    });

    try {
      const res  = await fetch('https://backend-node-js-nfarm.onrender.com/marketprice/getallprices');
      const data = await res.json();

      if (Array.isArray(data)) {
        const highDemand = data
          .filter(p => p.modalPrice >= 3000)
          .sort((a, b) => b.modalPrice - a.modalPrice)
          .slice(0, 5);

        highDemand.forEach((p, index) => {
          notifs.push({
            id: 10 + index,
            type: 'high_demand',
            icon: <TrendingUp size={18} />,
            color: '#dc2626',
            bg: '#c2eff5',
            title: `🔥 High Demand: ${p.commodity}`,
            message: `${p.commodity} price is ₹${p.modalPrice}/q — Great time to sell!`,
            time: '1 hour ago',
            read: false,
          });
        });

        const lowPrice = data
          .filter(p => p.modalPrice < 500)
          .sort((a, b) => a.modalPrice - b.modalPrice)
          .slice(0, 3);

        lowPrice.forEach((p, index) => {
          notifs.push({
            id: 20 + index,
            type: 'low_price',
            icon: <TrendingDown size={18} />,
            color: '#ca8a04',
            bg: '#f3f2e8',
            title: `⚠️ Low Price Warning: ${p.commodity}`,
            message: `${p.commodity} price dropped to ₹${p.modalPrice}/q — Consider waiting to sell.`,
            time: '2 hours ago',
            read: true,
          });
        });
      }
    } catch (err) {
      console.log('Market price error:', err);
    }

    const lastProduct = localStorage.getItem('lastAddedProduct');
    if (lastProduct) {
      notifs.push({
        id: 30,
        type: 'product',
        icon: <Package size={18} />,
        color: '#7c3aed',
        bg: '#f5f3ff',
        title: `✅ Product Added: ${lastProduct}`,
        message: `${lastProduct} has been successfully added to your firm.`,
        time: '3 hours ago',
        read: true,
      });
    } else {
      notifs.push({
        id: 30,
        type: 'product',
        icon: <Package size={18} />,
        color: '#7c3aed',
        bg: '#f5f3ff',
        title: '📦 Add Your First Product!',
        message: 'You have not added any products yet. Go to My Products page to add!',
        time: '3 hours ago',
        read: true,
      });
    }

    notifs.push({
      id: 40,
      type: 'tip',
      icon: <Bell size={18} />,
      color: '#0891b2',
      bg: '#ecfeff',
      title: '💡 NFarm Tip',
      message: 'Market prices update every hour. Check Suggestions page for best products to grow!',
      time: '5 hours ago',
      read: true,
    });

    setNotifications(notifs);
  }, [vendorName]);

  // ✅ Fix: generateNotifications safely in dependency array
  useEffect(() => {
    generateNotifications();
  }, [generateNotifications]);

  const filtered = notifications.filter(n => {
    if (filter === 'All')         return true;
    if (filter === 'Unread')      return !n.read;
    if (filter === 'High Demand') return n.type === 'high_demand';
    if (filter === 'Low Price')   return n.type === 'low_price';
    if (filter === 'Products')    return n.type === 'product';
    if (filter === 'Login')       return n.type === 'login';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markRead = (id) => {
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

  return (
    <div className="relative min-h-screen overflow-hidden"
      style={{ margin: '-24px', padding: '24px' }}>

      {backgroundImages.map((img, index) => (
        <div key={index} style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${img})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: currentBg === index ? 1 : 0,
          transition: 'opacity 1.5s ease-in-out', zIndex: 0,
        }} />
      ))}
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1 }} />

      <div style={{ position: 'relative', zIndex: 2 }} className="space-y-5">

        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-white">🔔 Notifications</h2>
            <p style={{ color: '#86efac' }} className="text-sm mt-1">
              {unreadCount > 0 ? `${unreadCount} unread notifications!` : 'See all notifications!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              className="flex items-center gap-2 bg-white text-green-700 font-medium px-4 py-2 rounded-xl text-sm">
              <CheckCheck size={16} /> Mark All Read
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total',       value: notifications.length,                                         emoji: '🔔', color: '#3b82f6' },
            { label: 'Unread',      value: unreadCount,                                                  emoji: '🔴', color: '#ef4444' },
            { label: 'High Demand', value: notifications.filter(n => n.type === 'high_demand').length,   emoji: '🔥', color: '#dc2626' },
            { label: 'Warnings',    value: notifications.filter(n => n.type === 'low_price').length,     emoji: '⚠️', color: '#ca8a04' },
          ].map((stat, i) => (
            <div key={i} className="rounded-2xl p-4 text-center"
              style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
              <p className="text-2xl mb-1">{stat.emoji}</p>
              <p className="text-white text-2xl font-bold">{stat.value}</p>
              <p className="text-green-300 text-xs">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-4"
          style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)' }}>
          <div className="flex gap-2 flex-wrap">
            {['All', 'Unread', 'High Demand', 'Low Price', 'Products', 'Login'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: filter === f ? '#16a34a' : '#f3f4f6',
                  color:      filter === f ? 'white'   : '#374151',
                }}>
                {f === 'All'         ? '🔔 All'         : ''}
                {f === 'Unread'      ? '🔴 Unread'      : ''}
                {f === 'High Demand' ? '🔥 High Demand' : ''}
                {f === 'Low Price'   ? '⚠️ Low Price'   : ''}
                {f === 'Products'    ? '📦 Products'    : ''}
                {f === 'Login'       ? '👤 Login'       : ''}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl p-12 text-center" style={{ background: 'rgba(255,255,255,0.85)' }}>
            <p className="text-6xl mb-4">🔔</p>
            <h3 className="text-xl font-bold text-gray-800">No Notifications!</h3>
            <p className="text-gray-500 mt-2">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((notif) => (
              <div key={notif.id} onClick={() => markRead(notif.id)}
                className="rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all"
                style={{
                  background: notif.read ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.97)',
                  backdropFilter: 'blur(10px)',
                  borderLeft: notif.read ? 'none' : `4px solid ${notif.color}`,
                }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl flex-shrink-0"
                      style={{ background: notif.bg, color: notif.color }}>
                      {notif.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-800 text-sm">{notif.title}</p>
                        {!notif.read && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />}
                      </div>
                      <p className="text-gray-500 text-xs mt-1">{notif.message}</p>
                      <p className="text-gray-400 text-xs mt-1">🕐 {notif.time}</p>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                    className="text-gray-300 hover:text-red-400 transition-all flex-shrink-0">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-center gap-2 pb-4">
          {backgroundImages.map((_, index) => (
            <div key={index} onClick={() => setCurrentBg(index)} style={{
              height: '6px', width: currentBg === index ? '24px' : '8px',
              borderRadius: '3px', cursor: 'pointer',
              background: currentBg === index ? 'white' : 'rgba(255,255,255,0.4)',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Notifications;