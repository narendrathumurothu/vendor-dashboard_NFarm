import React, { useState, useEffect } from 'react';
import { CheckCircle, X, RefreshCw } from 'lucide-react';

const backgroundImages = [
  'https://images.pexels.com/photos/440731/pexels-photo-440731.jpeg',
  'https://images.pexels.com/photos/247599/pexels-photo-247599.jpeg',
  'https://images.pexels.com/photos/1300972/pexels-photo-1300972.jpeg',
];

const statusColors = {
  'Pending':   { bg: '#f1e4e4', color: '#e00e0e', emoji: '⏳' },
  'Confirmed': { bg: '#e6e9d7', color: '#e0f926', emoji: '✅' },
  'Delivered': { bg: '#d1ead8', color: '#119642', emoji: '🎉' },
  'Cancelled': { bg: '#efe4e4', color: '#620710', emoji: '❌' },
};

const categoryEmojis = {
  'Vegetables': '🥦', 'Fruits': '🍎', 'Grains': '🌾',
  'Dairy': '🥛', 'Poultry': '🐔', 'Spices': '🌶️',
  'Livestock': '🐄', 'Others': '🌱',
};

const VendorOrders = () => {
  const token    = localStorage.getItem('token');
  const vendorId = localStorage.getItem('vendorId');

  const [currentBg, setCurrentBg]   = useState(0);
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('All');
  const [success, setSuccess]       = useState('');
  const [error, setError]           = useState('');

  // Background slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg(prev => (prev + 1) % backgroundImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res  = await fetch(
        `http://localhost:4000/orders/vendor-orders/${vendorId}`,
        { headers: { token } }
      );
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) { console.log(err); }
    setLoading(false);
  };

  const updateStatus = async (orderId, status) => {
    try {
      const res  = await fetch(
        `http://localhost:4000/orders/update-status/${orderId}`,
        {
          method:  'PUT',
          headers: { token, 'Content-Type': 'application/json' },
          body:    JSON.stringify({ status }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setSuccess(`✅ Order ${status}!`);
        fetchOrders();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed!');
        setTimeout(() => setError(''), 3000);
      }
    } catch { setError('Server error!'); }
  };

  const filtered = orders.filter(o =>
    filter === 'All' ? true : o.status === filter
  );

  const counts = {
    All:       orders.length,
    Pending:   orders.filter(o => o.status === 'Pending').length,
    Confirmed: orders.filter(o => o.status === 'Confirmed').length,
    Delivered: orders.filter(o => o.status === 'Delivered').length,
    Cancelled: orders.filter(o => o.status === 'Cancelled').length,
  };

  return (
    <div className="relative min-h-screen overflow-hidden"
      style={{ margin: '-24px', padding: '24px' }}>

      {/* Background */}
      {backgroundImages.map((img, index) => (
        <div key={index} style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${img})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: currentBg === index ? 1 : 0,
          transition: 'opacity 1.5s ease-in-out', zIndex: 0,
        }} />
      ))}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1
      }} />

      <div style={{ position: 'relative', zIndex: 2 }} className="space-y-5">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-white">📦 Customer Orders</h2>
            <p style={{ color: '#86efac' }} className="text-sm mt-1">
              🌾 {orders.length} total orders
            </p>
          </div>
          <button onClick={fetchOrders}
            className="flex items-center gap-2 bg-white text-green-700 px-4 py-2 rounded-xl text-sm font-medium">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Pending',   value: counts.Pending,   emoji: '⏳', color: '#ca3f04' },
            { label: 'Confirmed', value: counts.Confirmed, emoji: '✅', color: '#2563eb' },
            { label: 'Delivered', value: counts.Delivered, emoji: '🎉', color: '#16a34a' },
            { label: 'Cancelled', value: counts.Cancelled, emoji: '❌', color: '#dc2626' },
          ].map((stat, i) => (
            <div key={i} className="rounded-2xl p-4 text-center"
              style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
              <p className="text-2xl mb-1">{stat.emoji}</p>
              <p className="text-white text-2xl font-bold">{stat.value}</p>
              <p className="text-green-300 text-xs">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {success && (
          <div className="bg-green-50 rounded-xl px-4 py-3">
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 rounded-xl px-4 py-3">
            <p className="text-red-600 text-sm">❌ {error}</p>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="rounded-2xl p-3 flex gap-2 flex-wrap"
          style={{ background: 'rgba(212, 230, 54, 0.85)', backdropFilter: 'blur(10px)' }}>
          {['All', 'Pending', 'Confirmed', 'Delivered', 'Cancelled'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-xl text-xs font-medium transition-all"
              style={{
                background: filter === f ? '#16a34a' : '#eaeff8',
                color:      filter === f ? 'white'   : '#374151',
              }}>
              {f} ({counts[f] || 0})
            </button>
          ))}
        </div>

        {/* Orders */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-6xl mb-2">⏳</p>
            <p className="text-white">Loading orders...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl p-12 text-center"
            style={{ background: 'rgba(58, 218, 138, 0.85)' }}>
            <p className="text-6xl mb-4">📦</p>
            <h3 className="text-xl font-bold text-gray-800">No Orders Yet</h3>
            <p className="text-gray-500 mt-2">
              When the Customer Order your products it Shown here 
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((order, index) => {
              const status = statusColors[order.status] || statusColors['Pending'];
              return (
                <div key={index} className="rounded-2xl overflow-hidden"
                  style={{ background: 'rgba(244, 26, 26, 0.95)' }}>

                  {/* Order Header */}
                  <div className="flex items-center justify-between px-5 py-3"
                    style={{ background: status.bg }}>
                    <div>
                      <p className="font-bold text-gray-800">
                        🧾 Order #{order._id.slice(-6).toUpperCase()}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        📅 {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <span className="text-sm px-3 py-1 rounded-full font-medium text-white"
                      style={{ background: status.color }}>
                      {status.emoji} {order.status}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="px-5 py-3 flex items-center gap-4"
                    style={{ background: '#eff6ff' }}>
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">
                        {order.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 text-sm">👤 {order.name}</p>
                      <p className="text-gray-500 text-xs">📱 {order.phone}</p>
                      <p className="text-gray-500 text-xs">📍 {order.address}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-xs">Total</p>
                      <p className="font-bold text-green-600 text-xl">₹{order.totalAmount}</p>
                      <p className="text-gray-400 text-xs">💵 Cash on Delivery</p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="px-5 py-3 space-y-2">
                    <p className="text-gray-500 text-xs font-medium">📦 Ordered Items:</p>
                    {order.items.map((item, i) => (
                      <div key={i}
                        className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                        <div className="w-12 h-12 bg-white rounded-xl overflow-hidden flex-shrink-0">
                          {item.image ? (
                            <img src={`http://localhost:4000/uploads/${item.image}`}
                              alt={item.productName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">
                              {categoryEmojis[item.category] || '🌾'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-800 text-sm font-medium">{item.productName}</p>
                          <p className="text-gray-400 text-xs">
                            {categoryEmojis[item.category]} {item.category}
                          </p>
                          <p className="text-gray-500 text-xs">
                            Qty: {item.qty} × ₹{item.price}
                          </p>
                        </div>
                        <p className="font-bold text-green-600">₹{item.price * item.qty}</p>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  {order.status === 'Pending' && (
                    <div className="px-5 py-3 flex gap-2"
                      style={{ borderTop: '1px solid #f52c19' }}>
                      <button
                        onClick={() => updateStatus(order._id, 'Confirmed')}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium transition-all">
                        <CheckCircle size={16} /> ✅ Confirm Order
                      </button>
                      <button
                        onClick={() => updateStatus(order._id, 'Cancelled')}
                        className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-xl text-sm font-medium transition-all">
                        <X size={16} /> Cancel
                      </button>
                    </div>
                  )}

                  {order.status === 'Confirmed' && (
                    <div className="px-5 py-3"
                      style={{ borderTop: '1px solid #a9ed16' }}>
                      <button
                        onClick={() => updateStatus(order._id, 'Delivered')}
                        className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-sm font-medium transition-all">
                        🚚 Mark as Delivered
                      </button>
                    </div>
                  )}

                  {order.status === 'Delivered' && (
                    <div className="px-5 py-3 bg-green-50"
                      style={{ borderTop: '1px solid #067912' }}>
                      <p className="text-green-600 text-sm text-center font-medium">
                        🎉 Order Successfully Delivered!
                      </p>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

        {/* Dots */}
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

export default VendorOrders;