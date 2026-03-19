import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const backgroundImages = [
  'https://images.pexels.com/photos/440731/pexels-photo-440731.jpeg',   
  'https://images.pexels.com/photos/247599/pexels-photo-247599.jpeg',   
  'https://images.pexels.com/photos/235725/pexels-photo-235725.jpeg',   
  'https://images.pexels.com/photos/1300972/pexels-photo-1300972.jpeg', 
  'https://images.pexels.com/photos/462118/pexels-photo-462118.jpeg',   
];

const MarketPrices = () => {
  const [currentBg, setCurrentBg]   = useState(0);
  const [prices, setPrices]         = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [sortBy, setSortBy]         = useState('commodity');
  const [sortOrder, setSortOrder]   = useState('asc');

  // Background slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg(prev => (prev + 1) % backgroundImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { fetchPrices(); }, []);

  useEffect(() => {
    let result = [...prices];

    // Search filter
    if (search) {
      result = result.filter(p =>
        p.commodity?.toLowerCase().includes(search.toLowerCase()) ||
        p.market?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Sort
    result.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFiltered(result);
  }, [search, prices, sortBy, sortOrder]);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const res  = await fetch('http://localhost:4000/marketprice/getallprices');
      const data = await res.json();
      setPrices(Array.isArray(data) ? data : []);
      setFiltered(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log('Error:', err);
    }
    setLoading(false);
  };

  const getPriceStatus = (price) => {
    if (price >= 3000) return { icon: <TrendingUp size={14} />, color: '#ef4444', label: 'Very High' };
    if (price >= 2000) return { icon: <TrendingUp size={14} />, color: '#f97316', label: 'High' };
    if (price >= 1000) return { icon: <Minus size={14} />,      color: '#eab308', label: 'Medium' };
    return               { icon: <TrendingDown size={14} />,    color: '#22c55e', label: 'Low' };
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Stats
  const avgPrice    = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b.modalPrice, 0) / prices.length) : 0;
  const highestPrice = prices.length > 0 ? Math.max(...prices.map(p => p.modalPrice)) : 0;
  const lowestPrice  = prices.length > 0 ? Math.min(...prices.map(p => p.modalPrice)) : 0;
  const highestItem  = prices.find(p => p.modalPrice === highestPrice);
  const lowestItem   = prices.find(p => p.modalPrice === lowestPrice);

  return (
    <div className="relative min-h-screen overflow-hidden"
      style={{ margin: '-24px', padding: '24px' }}>

      {/* Background Slideshow */}
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

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2 }} className="space-y-5">

        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-white">📊 Market Prices</h2>
          <p style={{ color: '#86efac' }} className="text-sm mt-1">
            🌾 Live Government Market Prices — {filtered.length} commodities
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-2xl p-4 text-center"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
            <p className="text-white text-xs mb-1">📦 Total</p>
            <p className="text-white text-2xl font-bold">{prices.length}</p>
            <p className="text-green-300 text-xs">Commodities</p>
          </div>
          <div className="rounded-2xl p-4 text-center"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
            <p className="text-white text-xs mb-1">💰 Average</p>
            <p className="text-white text-2xl font-bold">₹{avgPrice}</p>
            <p className="text-green-300 text-xs">Modal Price</p>
          </div>
          <div className="rounded-2xl p-4 text-center"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
            <p className="text-white text-xs mb-1">🔺 Highest</p>
            <p className="text-white text-2xl font-bold">₹{highestPrice}</p>
            <p className="text-green-300 text-xs">{highestItem?.commodity || '-'}</p>
          </div>
          <div className="rounded-2xl p-4 text-center"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
            <p className="text-white text-xs mb-1">🔻 Lowest</p>
            <p className="text-white text-2xl font-bold">₹{lowestPrice}</p>
            <p className="text-green-300 text-xs">{lowestItem?.commodity || '-'}</p>
          </div>
        </div>

        {/* Search */}
        <div className="rounded-2xl p-4"
          style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)' }}>
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search commodity or market... 🔍"
              className="flex-1 text-sm outline-none bg-transparent text-gray-600"
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="text-gray-400 text-xs">✕</button>
            )}
          </div>
        </div>

        {/* Price Table */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-6xl mb-2">⏳</p>
            <p className="text-white">Loading market prices...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl p-12 text-center"
            style={{ background: 'rgba(245, 93, 93, 0.85)' }}>
            <p className="text-6xl mb-4">📊</p>
            <h3 className="text-xl font-bold text-gray-800">No prices found!</h3>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)' }}>

            {/* Table Header */}
            <div className="grid grid-cols-4 px-4 py-3 bg-green-500">
              <button onClick={() => handleSort('commodity')}
                className="text-white text-xs font-bold text-left flex items-center gap-1">
                🌾 Commodity {sortBy === 'commodity' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </button>
              <button onClick={() => handleSort('market')}
                className="text-white text-xs font-bold text-left flex items-center gap-1">
                🏪 Market {sortBy === 'market' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </button>
              <button onClick={() => handleSort('modalPrice')}
                className="text-white text-xs font-bold text-left flex items-center gap-1">
                💰 Price {sortBy === 'modalPrice' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </button>
              <p className="text-white text-xs font-bold">📈 Status</p>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-gray-100">
              {filtered.map((price, index) => {
                const status = getPriceStatus(price.modalPrice);
                return (
                  <div key={index}
                    className="grid grid-cols-4 px-4 py-3 hover:bg-green-50 transition-all">
                    <p className="text-gray-800 text-sm font-medium">
                      {price.commodity}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {price.market || '—'}
                    </p>
                    <p className="text-gray-800 text-sm font-bold">
                      ₹{price.modalPrice}
                      <span className="text-gray-400 text-xs font-normal">/q</span>
                    </p>
                    <div className="flex items-center gap-1"
                      style={{ color: status.color }}>
                      {status.icon}
                      <span className="text-xs font-medium">{status.label}</span>
                    </div>
                  </div>
                );
              })}
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

export default MarketPrices;