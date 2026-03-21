import React, { useState, useEffect, useCallback } from 'react';

const backgroundImages = [
  'https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg',
  'https://images.pexels.com/photos/144248/potatoes-vegetables-erdfrucht-bio-144248.jpeg',
  'https://images.pexels.com/photos/2255935/pexels-photo-2255935.jpeg',
  'https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg',
  'https://images.pexels.com/photos/533360/pexels-photo-533360.jpeg',
];

const categoryEmojis = {
  'Vegetables': '🥦', 'Fruits': '🍎', 'Grains': '🌾',
  'Dairy': '🥛', 'Poultry': '🐔', 'Spices': '🌶️',
  'Livestock': '🐄', 'Others': '🌱',
};

const Home = ({ setActivePage }) => {
  const token      = localStorage.getItem('token');
  const vendorName = localStorage.getItem('vendorName') || 'Farmer';

  const [currentBg, setCurrentBg]   = useState(0);
  const [firms, setFirms]           = useState([]);
  const [products, setProducts]     = useState([]);
  const [prices, setPrices]         = useState([]);
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);

  // Background slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg(prev => (prev + 1) % backgroundImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  
  const fetchAll = useCallback(async () => {
    try {
      const vendorId = localStorage.getItem('vendorId');
      const [firmRes, priceRes, orderRes] = await Promise.all([
        fetch('https://backend-node-js-nfarm.onrender.com/firms/my-firms', { headers: { token } }),
        fetch('https://backend-node-js-nfarm.onrender.com/marketprice/getallprices'),
        fetch(`https://backend-node-js-nfarm.onrender.com/orders/vendor-orders/${vendorId}`, { headers: { token } }),
      ]);
      const [firmData, priceData, orderData] = await Promise.all([
        firmRes.json(), priceRes.json(), orderRes.json(),
      ]);

      const firmsArr = firmData.firms || [];
      setFirms(firmsArr);
      setPrices(Array.isArray(priceData) ? priceData : []);
      setOrders(Array.isArray(orderData) ? orderData : []);

      // All products from all firms
      let allProducts = [];
      for (const firm of firmsArr) {
        const prodRes  = await fetch(`https://backend-node-js-nfarm.onrender.com/products/firm/${firm._id}`, { headers: { token } });
        const prodData = await prodRes.json();
        if (Array.isArray(prodData)) allProducts = [...allProducts, ...prodData];
      }
      setProducts(allProducts);
    } catch (err) { console.log(err); }
    setLoading(false);
  }, [token]); 

  
  useEffect(() => { fetchAll(); }, [fetchAll]);

  // High demand products (price >= 2000/quintal = 20/kg)
  const highDemand = prices
    .filter(p => p.modalPrice >= 2000)
    .sort((a, b) => b.modalPrice - a.modalPrice)
    .slice(0, 5);

  // Top 5 market prices
  const topPrices = [...prices]
    .sort((a, b) => b.modalPrice - a.modalPrice)
    .slice(0, 5);

  // Pending orders
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;

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
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1 }} />

      <div style={{ position: 'relative', zIndex: 2 }} className="space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">
            <center>🌾 Welcome, {vendorName} </center>
          </h1>
          <p style={{ color: '#86efac' }} className="text-sm mt-1">
           <center> NFarm Farmer Dashboard </center>
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { emoji: '🏡', label: 'My Firms',    value: firms.length,    page: 'firms',    color: '#16a34a' },
            { emoji: '📦', label: 'My Products', value: products.length, page: 'products', color: '#2563eb' },
            { emoji: '📋', label: 'Orders',      value: orders.length,   page: 'orders',   color: '#7c3aed' },
            { emoji: '⏳', label: 'Pending',     value: pendingOrders,   page: 'orders',   color: '#dc2626' },
          ].map((stat, i) => (
            <div key={i}
              onClick={() => setActivePage(stat.page)}
              className="rounded-2xl p-4 text-center cursor-pointer hover:scale-105 transition-all"
              style={{ background: 'rgba(241, 250, 162, 0.92)', backdropFilter: 'blur(10px)' }}>
              <p className="text-3xl mb-1">{stat.emoji}</p>
              <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-gray-500 text-xs">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* My Firms */}
        <div className="rounded-2xl p-5"
          style={{ background: 'rgba(243, 190, 190, 0.92)', backdropFilter: 'blur(10px)' }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 text-lg">🏡 My Firms</h3>
            <button onClick={() => setActivePage('firms')}
              className="text-green-600 text-sm font-medium">View All →</button>
          </div>
          {loading ? (
            <p className="text-gray-400 text-sm">Loading...</p>
          ) : firms.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-4xl mb-2">🌱</p>
              <p className="text-gray-500 text-sm">No firms yet!</p>
              <button onClick={() => setActivePage('firms')}
                className="mt-2 bg-green-500 text-white px-4 py-2 rounded-xl text-sm">
                ➕ Add Firm
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {firms.slice(0, 4).map((firm, i) => (
                <div key={i} className="bg-gray-50 rounded-xl overflow-hidden">
                  <div className="h-20 bg-green-100">
                    {firm.image ? (
                      <img src={`https://backend-node-js-nfarm.onrender.com/uploads/${firm.image}`}
                        alt={firm.firmName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        {categoryEmojis[firm.category] || '🌾'}
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="font-bold text-gray-800 text-xs">{firm.firmName}</p>
                    <p className="text-gray-400 text-xs">📍 {firm.area}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Products */}
        <div className="rounded-2xl p-5"
          style={{ background: 'rgba(205, 249, 192, 0.92)', backdropFilter: 'blur(10px)' }}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 text-lg">📦 My Products</h3>
            <button onClick={() => setActivePage('products')}
              className="text-green-600 text-sm font-medium">View All →</button>
          </div>
          {loading ? (
            <p className="text-gray-400 text-sm">Loading...</p>
          ) : products.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-4xl mb-2">📦</p>
              <p className="text-gray-500 text-sm">No products yet!</p>
              <button onClick={() => setActivePage('products')}
                className="mt-2 bg-green-500 text-white px-4 py-2 rounded-xl text-sm">
                ➕ Add Product
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {products.slice(0, 4).map((product, i) => (
                <div key={i} className="bg-gray-50 rounded-xl overflow-hidden">
                  <div className="h-20 bg-green-50">
                    {product.image ? (
                      <img src={`https://backend-node-js-nfarm.onrender.com/uploads/${product.image}`}
                        alt={product.productName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        {categoryEmojis[product.category] || '🌾'}
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="font-bold text-gray-800 text-xs">{product.productName}</p>
                    <p className="text-green-600 text-xs font-bold">₹{product.price}/kg</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Market Prices + High Demand */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Market Prices */}
          <div className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)' }}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-800">📊 Market Prices</h3>
              <button onClick={() => setActivePage('marketprices')}
                className="text-green-600 text-sm">View All →</button>
            </div>
            <div className="space-y-2">
              {topPrices.map((price, i) => (
                <div key={i} className="flex justify-between items-center bg-gray-50 rounded-xl px-3 py-2">
                  <p className="text-gray-800 text-sm font-medium">{price.commodity}</p>
                  <div className="text-right">
                    <p className="text-gray-600 text-xs">₹{price.modalPrice}/q</p>
                    <p className="text-green-600 text-xs font-bold">
                      ≈ ₹{Math.round(price.modalPrice / 100)}/kg
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* High Demand */}
          <div className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)' }}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-800">🔥 High Demand</h3>
              <button onClick={() => setActivePage('suggestions')}
                className="text-green-600 text-sm">View All →</button>
            </div>
            <div className="space-y-2">
              {highDemand.map((price, i) => (
                <div key={i} className="flex justify-between items-center bg-red-50 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔥</span>
                    <p className="text-gray-800 text-sm font-medium">{price.commodity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-red-600 text-xs font-bold">₹{price.modalPrice}/q</p>
                    <p className="text-green-600 text-xs">
                      ≈ ₹{Math.round(price.modalPrice / 100)}/kg
                    </p>
                  </div>
                </div>
              ))}
              {highDemand.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-2">
                  No high demand items found
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Suggestions */}
        <div className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)' }}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-800">💡 Grow These for More Profit!</h3>
            <button onClick={() => setActivePage('suggestions')}
              className="text-green-600 text-sm">View All →</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {highDemand.map((price, i) => (
              <div key={i} className="bg-green-50 rounded-xl p-3 text-center">
                <p className="text-2xl mb-1">
                  {categoryEmojis[price.commodity] || '🌾'}
                </p>
                <p className="font-bold text-gray-800 text-xs">{price.commodity}</p>
                <p className="text-green-600 text-xs font-bold mt-0.5">
                  ₹{Math.round(price.modalPrice / 100)}/kg
                </p>
                <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full mt-1 inline-block">
                  High Demand
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        {orders.length > 0 && (
          <div className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)' }}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-800">📋 Recent Orders</h3>
              <button onClick={() => setActivePage('orders')}
                className="text-green-600 text-sm">View All →</button>
            </div>
            <div className="space-y-2">
              {orders.slice(0, 3).map((order, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                  <div>
                    <p className="font-bold text-gray-800 text-sm">
                      Order #{order._id.slice(-6).toUpperCase()}
                    </p>
                    <p className="text-gray-400 text-xs">👤 {order.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-600 font-bold">₹{order.totalAmount}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: order.status === 'Pending'   ? '#fefce8' :
                                    order.status === 'Confirmed' ? '#eff6ff' :
                                    order.status === 'Delivered' ? '#f0fdf4' : '#fef2f2',
                        color:      order.status === 'Pending'   ? '#ca8a04' :
                                    order.status === 'Confirmed' ? '#2563eb' :
                                    order.status === 'Delivered' ? '#16a34a' : '#dc2626',
                      }}>
                      {order.status === 'Pending'   ? '⏳' :
                       order.status === 'Confirmed' ? '✅' :
                       order.status === 'Delivered' ? '🎉' : '❌'} {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
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

export default Home;