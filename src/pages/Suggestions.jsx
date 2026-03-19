import React, { useState, useEffect } from 'react';
import { TrendingUp, Star, Award, Zap } from 'lucide-react';

const backgroundImages = [
  'https://images.pexels.com/photos/440731/pexels-photo-440731.jpeg',
  'https://images.pexels.com/photos/247599/pexels-photo-247599.jpeg',
  'https://images.pexels.com/photos/235725/pexels-photo-235725.jpeg',
  'https://images.pexels.com/photos/1300972/pexels-photo-1300972.jpeg',
  'https://images.pexels.com/photos/462118/pexels-photo-462118.jpeg',
];

const Suggestions = () => {
  const [currentBg, setCurrentBg]     = useState(0);
  const [prices, setPrices]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [season, setSeason]           = useState('All');

  // Background slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg(prev => (prev + 1) % backgroundImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { fetchPrices(); }, []);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const res  = await fetch('http://localhost:4000/marketprice/getallprices');
      const data = await res.json();
      setPrices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log('Error:', err);
    }
    setLoading(false);
  };

  // Demand level calculate చేయి
  const getDemandLevel = (price) => {
    if (price >= 5000) return { level: 'Excellent', color: '#7c3aed', bg: '#f5f3ff', stars: 5, emoji: '🔥' };
    if (price >= 3000) return { level: 'Very High',  color: '#dc2626', bg: '#fef2f2', stars: 4, emoji: '⚡' };
    if (price >= 2000) return { level: 'High',       color: '#ea580c', bg: '#fff7ed', stars: 3, emoji: '📈' };
    if (price >= 1000) return { level: 'Medium',     color: '#ca8a04', bg: '#fefce8', stars: 2, emoji: '➡️' };
    return               { level: 'Low',         color: '#16a34a', bg: '#f0fdf4', stars: 1, emoji: '📉' };
  };

  // Top 5 high demand products
  const topProducts = [...prices]
    .sort((a, b) => b.modalPrice - a.modalPrice)
    .slice(0, 5);

  // All products sorted by price
  const allSorted = [...prices].sort((a, b) => b.modalPrice - a.modalPrice);

  // Season based suggestions
  const seasonData = {
    'Summer':  ['Tomato', 'Mango', 'Watermelon', 'Cucumber', 'Brinjal'],
    'Winter':  ['Potato', 'Cabbage', 'Cauliflower', 'Carrot', 'Peas'],
    'Monsoon': ['Ginger', 'Turmeric', 'Green Chilli', 'Spinach', 'Corn'],
    'All':     [],
  };

  const seasonSuggestions = prices.filter(p =>
    season === 'All' ? true :
    seasonData[season]?.some(s => p.commodity?.toLowerCase().includes(s.toLowerCase()))
  ).sort((a, b) => b.modalPrice - a.modalPrice).slice(0, 6);

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

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2 }} className="space-y-5">

        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-white">💡 Suggestions</h2>
          <p style={{ color: '#86efac' }} className="text-sm mt-1">
            🌾We sugest Products Based on Today's Market Price
          </p>
        </div>

        {/* Top 5 Banner */}
        {!loading && topProducts.length > 0 && (
          <div className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Award size={20} className="text-yellow-500" />
              <h3 className="font-bold text-gray-800 text-lg">🏆 Top 5 High Demand Products</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {topProducts.map((product, index) => {
                const demand = getDemandLevel(product.modalPrice);
                return (
                  <div key={index} className="rounded-xl p-3 text-center"
                    style={{ background: demand.bg }}>
                    <p className="text-2xl mb-1">{demand.emoji}</p>
                    <p className="font-bold text-gray-800 text-sm">{product.commodity}</p>
                    <p className="font-bold text-lg mt-1" style={{ color: demand.color }}>
                      ₹{product.modalPrice}
                    </p>
                    <p className="text-xs mt-1" style={{ color: demand.color }}>
                      {demand.level}
                    </p>
                    {/* Stars */}
                    <div className="flex justify-center gap-0.5 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={10}
                          fill={i < demand.stars ? '#eab308' : 'none'}
                          stroke={i < demand.stars ? '#eab308' : '#d1d5db'}
                        />
                      ))}
                    </div>
                    <div className="mt-2 text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ background: demand.color, color: 'white' }}>
                      #{index + 1} Rank
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Season Filter */}
        <div className="rounded-2xl p-4"
          style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)' }}>
          <h3 className="font-bold text-gray-800 mb-3">🌤️ Seasonal Suggestions:</h3>
          <div className="flex gap-2 flex-wrap">
            {['All', 'Summer', 'Winter', 'Monsoon'].map(s => (
              <button key={s}
                onClick={() => setSeason(s)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: season === s ? '#16a34a' : '#f3f4f6',
                  color:      season === s ? 'white'   : '#374151',
                }}>
                {s === 'All'     ? '🌈 All Season' : ''}
                {s === 'Summer'  ? '☀️ Summer'     : ''}
                {s === 'Winter'  ? '❄️ Winter'     : ''}
                {s === 'Monsoon' ? '🌧️ Monsoon'   : ''}
              </button>
            ))}
          </div>

          {/* Season Suggestions */}
          {seasonSuggestions.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
              {seasonSuggestions.map((product, index) => {
                const demand = getDemandLevel(product.modalPrice);
                return (
                  <div key={index} className="rounded-xl p-3 flex items-center gap-3"
                    style={{ background: demand.bg }}>
                    <span className="text-2xl">{demand.emoji}</span>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{product.commodity}</p>
                      <p className="font-bold text-sm" style={{ color: demand.color }}>
                        ₹{product.modalPrice}/q
                      </p>
                      <p className="text-xs" style={{ color: demand.color }}>{demand.level}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-sm mt-3">
              {season === 'All'
                ? 'Select a season to see suggestions!'
                : `${season} we don't have specific suggestions for seasonal crops. Check the top demand products above!`}
            </p>
          )}
        </div>

        {/* Grow Tips */}
        <div className="rounded-2xl p-4"
          style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Zap size={18} className="text-yellow-500" />
            <h3 className="font-bold text-gray-800">⚡ Farmer Tips</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { emoji: '🌱', tip: 'We suggest products based on high demand because they gain better market prices' },
              { emoji: '📊', tip: 'Check the market price regularly — prices frequently change!' },
              { emoji: '🚜', tip: 'Prefer organic farming for better yields and market value' },
              { emoji: '💧', tip: 'Drip irrigation saves up to 50% water!' },
              { emoji: '📦', tip: 'If you sell directly in this Market place you can avoid middleman charges' },
              { emoji: '🌤️', tip: 'Plan your crops based on the season for better yields' },
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-3 bg-green-50 rounded-xl p-3">
                <span className="text-2xl">{item.emoji}</span>
                <p className="text-gray-700 text-sm">{item.tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* All Products Demand Table */}
        {!loading && allSorted.length > 0 && (
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.92)' }}>
            <div className="px-4 py-3 bg-green-500">
              <h3 className="text-white font-bold flex items-center gap-2">
                <TrendingUp size={18} /> All Products Demand List
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {allSorted.map((product, index) => {
                const demand = getDemandLevel(product.modalPrice);
                return (
                  <div key={index}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 text-xs font-bold w-6">#{index + 1}</span>
                      <span className="text-lg">{demand.emoji}</span>
                      <div>
                        <p className="text-gray-800 text-sm font-medium">{product.commodity}</p>
                        {product.market && (
                          <p className="text-gray-400 text-xs">{product.market}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-gray-800 font-bold text-sm">₹{product.modalPrice}/q</p>
                      <span className="text-xs font-medium px-2 py-1 rounded-full"
                        style={{ background: demand.bg, color: demand.color }}>
                        {demand.level}
                      </span>
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

export default Suggestions;