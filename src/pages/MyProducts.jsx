import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Edit, Trash2, X, Plus, RefreshCw } from 'lucide-react';

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

const MyProducts = () => {
  const token = localStorage.getItem('token');
  // ✅ Fix: removed unused vendorId

  const [currentBg, setCurrentBg]         = useState(0);
  const [firms, setFirms]                 = useState([]);
  const [products, setProducts]           = useState([]);
  const [loading, setLoading]             = useState(false);
  const [selectedFirm, setSelectedFirm]   = useState('');
  const [search, setSearch]               = useState('');
  const [category, setCategory]           = useState('');
  const [minPrice, setMinPrice]           = useState('');
  const [maxPrice, setMaxPrice]           = useState('');
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState('');
  const [showFilters, setShowFilters]     = useState(false);
  const [showAddModal, setShowAddModal]   = useState(false);

  const [addLoading, setAddLoading]       = useState(false);
  const [govPrice, setGovPrice]           = useState(null);
  const [image, setImage]                 = useState(null);
  const [imagePreview, setImagePreview]   = useState(null);

  const [marketPrices, setMarketPrices]         = useState({});
  const [priceLastUpdated, setPriceLastUpdated] = useState(null);
  const [priceRefreshing, setPriceRefreshing]   = useState(false);

  const [formData, setFormData] = useState({
    firmId: '', productName: '', category: 'Vegetables',
    price: '', farmingMethod: '', variety: '', origin: '',
    harvestDate: '', shelflife: '', sizeAndWeight: '',
    seasonality: '', age: '', breed: '', gender: '', milkyield: '',
  });

  // Background slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg(prev => (prev + 1) % backgroundImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Fix: wrapped fetchMarketPrices in useCallback
  const fetchMarketPrices = useCallback(async () => {
    setPriceRefreshing(true);
    try {
      const res  = await fetch('https://backend-node-js-nfarm.onrender.com/marketprice/getallprices');
      const data = await res.json();
      const priceMap = {};
      data.forEach(item => {
        if (item.commodity) {
          priceMap[item.commodity.toLowerCase().trim()] = item.modalPrice;
        }
      });
      setMarketPrices(priceMap);
      setPriceLastUpdated(new Date());
    } catch (err) {
      console.log('Market price fetch error:', err);
    }
    setPriceRefreshing(false);
  }, []);

  // ✅ Fix: wrapped fetchFirms in useCallback
  const fetchFirms = useCallback(async () => {
    try {
      const res  = await fetch(`https://backend-node-js-nfarm.onrender.com/firms/my-firms`, {
        headers: { token }
      });
      const data = await res.json();
      if (res.ok && data.firms && data.firms.length > 0) {
        setFirms(data.firms);
        setSelectedFirm(data.firms[0]._id);
        setFormData(prev => ({ ...prev, firmId: data.firms[0]._id }));
      }
    } catch (err) {
      console.log('Error:', err);
    }
  }, [token]);

  // ✅ Fix: wrapped fetchProducts in useCallback
  const fetchProducts = useCallback(async () => {
    if (!selectedFirm) return;
    setLoading(true);
    try {
      let url = `https://backend-node-js-nfarm.onrender.com/products/firm/${selectedFirm}?`;
      if (search)   url += `search=${search}&`;
      if (category) url += `category=${category}&`;
      if (minPrice) url += `minPrice=${minPrice}&`;
      if (maxPrice) url += `maxPrice=${maxPrice}&`;
      const res  = await fetch(url, { headers: { token } });
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) { console.log(err); }
    setLoading(false);
  }, [selectedFirm, search, category, minPrice, maxPrice, token]);

  // ✅ Fix: all useEffects now have proper dependencies
  useEffect(() => {
    fetchFirms();
    fetchMarketPrices();
    const priceInterval = setInterval(fetchMarketPrices, 5 * 60 * 1000);
    return () => clearInterval(priceInterval);
  }, [fetchFirms, fetchMarketPrices]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchMarketPrices();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [fetchMarketPrices]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const getLivePrice = (productName) => {
    if (!productName) return null;
    const key = productName.toLowerCase().trim();
    if (marketPrices[key] !== undefined) return marketPrices[key];
    const matchKey = Object.keys(marketPrices).find(k =>
      k.includes(key) || key.includes(k)
    );
    return matchKey ? marketPrices[matchKey] : null;
  };

  const fetchGovPrice = async (name) => {
    if (name.length < 3) { setGovPrice(null); return; }
    try {
      const res  = await fetch('https://backend-node-js-nfarm.onrender.com/marketprice/getallprices');
      const data = await res.json();
      const match = data.find(p => p.commodity?.toLowerCase().includes(name.toLowerCase()));
      setGovPrice(match ? match.modalPrice : null);
    } catch { setGovPrice(null); }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setError(''); setSuccess('');
    try {
      const form = new FormData();
      form.append('productName',   formData.productName);
      form.append('category',      formData.category);
      form.append('price',         formData.price);
      form.append('farmingMethod', formData.farmingMethod);
      form.append('variety',       formData.variety);
      form.append('origin',        formData.origin);
      form.append('harvestDate',   formData.harvestDate);
      form.append('shelflife',     formData.shelflife);
      form.append('sizeAndWeight', formData.sizeAndWeight);
      form.append('seasonality',   formData.seasonality);
      if (formData.category === 'Livestock') {
        form.append('age',       formData.age);
        form.append('breed',     formData.breed);
        form.append('gender',    formData.gender);
        form.append('milkyield', formData.milkyield);
      }
      if (image) form.append('image', image);

      const res  = await fetch(
        `https://backend-node-js-nfarm.onrender.com/products/add/${formData.firmId}`,
        { method: 'POST', headers: { token }, body: form }
      );
      const data = await res.json();

      if (res.ok) {
        setSuccess(`✅ Product added! (${data.priceSource})`);
        setShowAddModal(false);
        setFormData(prev => ({
          ...prev, productName: '', price: '', farmingMethod: '',
          variety: '', origin: '', harvestDate: '', shelflife: '',
          sizeAndWeight: '', seasonality: '',
          age: '', breed: '', gender: '', milkyield: '',
        }));
        setImage(null); setImagePreview(null); setGovPrice(null);
        fetchProducts();
        fetchMarketPrices();
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError(data.message || data.error || 'Failed');
      }
    } catch { setError('Server not connected!'); }
    setAddLoading(false);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Delete?')) return;
    try {
      const res = await fetch(`https://backend-node-js-nfarm.onrender.com/products/${productId}`,
        { method: 'DELETE', headers: { token } });
      if (res.ok) {
        setSuccess('✅ Deleted!');
        fetchProducts();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch { setError('Failed to delete'); }
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
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 1 }} />

      <div style={{ position: 'relative', zIndex: 2 }} className="space-y-5">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-white">📦 My Products</h2>
            <p style={{ color: '#86efac' }} className="text-sm mt-1">🌾 {products.length} products found</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchMarketPrices} title="Refresh live prices"
              className="flex items-center gap-2 bg-white text-green-700 font-medium px-4 py-2 rounded-xl text-sm">
              <RefreshCw size={16} className={priceRefreshing ? 'animate-spin' : ''} />
              {priceRefreshing ? 'Refreshing...' : 'Refresh Prices'}
            </button>
            <button onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 bg-white text-green-700 font-medium px-4 py-2 rounded-xl text-sm">
              <Filter size={16} /> Filters
            </button>
            <button onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium px-4 py-2 rounded-xl text-sm">
              <Plus size={16} /> Add Product
            </button>
          </div>
        </div>

        {priceLastUpdated && (
          <div className="flex items-center gap-2 bg-green-900 bg-opacity-60 rounded-xl px-4 py-2 w-fit">
            <span className="text-green-400 text-xs">
              📡 Live market prices updated at {priceLastUpdated.toLocaleTimeString()}
            </span>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-red-600 text-sm">❌ {error}</p>
          </div>
        )}

        {/* Firm Select */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(238, 233, 96, 0.92)' }}>
          <label className="text-sm font-medium text-gray-700 mb-2 block">🏭 Select Firm</label>
          {firms.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
              <p className="text-yellow-700 text-sm">⚠️ No firms found! Add a firm from the Firms page.</p>
            </div>
          ) : (
            <select value={selectedFirm} onChange={(e) => setSelectedFirm(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500">
              {firms.map((firm, i) => (
                <option key={i} value={firm._id}>🏭 {firm.firmName}</option>
              ))}
            </select>
          )}
        </div>

        {/* Search + Filters */}
        <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(5, 123, 39, 0.84)' }}>
          <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3">
            <Search size={18} className="text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products... 🔍"
              className="flex-1 text-sm outline-none text-gray-600" />
            {search && (
              <button onClick={() => setSearch('')}><X size={16} className="text-gray-400" /></button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none">
                <option value="">All Categories</option>
                <option value="Vegetables">🥦 Vegetables</option>
                <option value="Fruits">🍎 Fruits</option>
                <option value="Grains">🌾 Grains</option>
                <option value="Dairy">🥛 Dairy</option>
                <option value="Poultry">🐔 Poultry</option>
                <option value="Spices">🌶️ Spices</option>
                <option value="Livestock">🐄 Livestock</option>
                <option value="Others">🌱 Others</option>
              </select>
              <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min Price ₹"
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" />
              <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max Price ₹"
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" />
              <button onClick={() => { setSearch(''); setCategory(''); setMinPrice(''); setMaxPrice(''); }}
                className="text-red-500 text-sm md:col-span-3">
                🗑️ Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-6xl mb-2">⏳</p>
            <p className="text-white">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl p-12 text-center" style={{ background: 'rgba(255,255,255,0.92)' }}>
            <p className="text-6xl mb-4">📦</p>
            <h3 className="text-xl font-bold text-gray-800">No Products Found!</h3>
            <p className="text-gray-500 mt-2 mb-4">Add your first product!</p>
            <button onClick={() => setShowAddModal(true)}
              className="bg-green-500 text-white px-6 py-2 rounded-xl text-sm font-medium">
              ➕ Add First Product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product, index) => {
              const livePrice    = getLivePrice(product.productName);
              const displayPrice = livePrice ?? product.price;
              const isLive       = livePrice !== null;

              return (
                <div key={index} className="rounded-2xl overflow-hidden hover:shadow-lg transition-all"
                  style={{ background: 'rgb(229, 227, 102)' }}>
                  <div className="h-44 bg-green-50 relative">
                    {product.image ? (
                      <img src={`https://backend-node-js-nfarm.onrender.com/uploads/${product.image}`}
                        alt={product.productName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-7xl">
                        {categoryEmojis[product.category] || '🌾'}
                      </div>
                    )}
                    <span className="absolute top-3 left-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      {categoryEmojis[product.category]} {product.category}
                    </span>
                    <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                      <span className="bg-white text-green-700 font-bold text-sm px-3 py-1 rounded-full shadow">
                        ₹{displayPrice}
                      </span>
                      {isLive ? (
                        <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
                          Live
                        </span>
                      ) : (
                        <span className="bg-gray-400 text-white text-xs px-2 py-0.5 rounded-full">Saved</span>
                      )}
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-gray-800 text-lg">{product.productName}</h3>
                    {isLive && livePrice !== product.price && (
                      <div className="mt-1 bg-green-100 border border-green-300 rounded-lg px-3 py-1 text-xs text-green-700 flex items-center gap-1">
                        📊 Market: ₹{livePrice} &nbsp;|&nbsp; Saved: ₹{product.price}
                      </div>
                    )}
                    <div className="mt-2 space-y-1">
                      {product.farmingMethod && <p className="text-gray-500 text-xs">🚜 {product.farmingMethod}</p>}
                      {product.variety       && <p className="text-gray-500 text-xs">🌱 {product.variety}</p>}
                      {product.origin        && <p className="text-gray-500 text-xs">📍 {product.origin}</p>}
                      {product.seasonality   && <p className="text-gray-500 text-xs">🌤️ {product.seasonality}</p>}
                      {product.shelflife     && <p className="text-gray-500 text-xs">⏳ {product.shelflife}</p>}
                    </div>
                    {product.category === 'Livestock' && product.livestockDetails && (
                      <div className="mt-2 bg-orange-50 rounded-xl p-2">
                        <p className="text-orange-600 text-xs">
                          🐄 {product.livestockDetails.breed} | {product.livestockDetails.age}
                        </p>
                      </div>
                    )}
                    <div className="flex gap-2 mt-4">
                      <button className="flex-1 flex items-center justify-center gap-1 bg-blue-50 text-blue-600 py-2 rounded-xl text-sm hover:bg-blue-100">
                        <Edit size={14} /> Edit
                      </button>
                      <button onClick={() => handleDelete(product._id)}
                        className="flex-1 flex items-center justify-center gap-1 bg-red-50 text-red-600 py-2 rounded-xl text-sm hover:bg-red-100">
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  </div>
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

      {/* ADD PRODUCT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 50 }}>
          <div className="w-full max-w-2xl rounded-2xl p-6 shadow-2xl bg-white"
            style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">🌾 Add New Product</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">🏭 Select Firm</label>
                <select value={formData.firmId}
                  onChange={(e) => setFormData({ ...formData, firmId: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500"
                  required>
                  <option value="">-- Select firm --</option>
                  {firms.map((firm, i) => (
                    <option key={i} value={firm._id}>🏭 {firm.firmName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">🌿 Product Name</label>
                  <input type="text" value={formData.productName}
                    onChange={(e) => {
                      setFormData({ ...formData, productName: e.target.value });
                      fetchGovPrice(e.target.value);
                    }}
                    placeholder="e.g. Tomato" required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500" />
                  {govPrice && <p className="text-green-600 text-xs mt-1">💡 Gov: ₹{govPrice}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">📦 Category</label>
                  <select value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500">
                    <option value="Vegetables">🥦 Vegetables</option>
                    <option value="Fruits">🍎 Fruits</option>
                    <option value="Grains">🌾 Grains</option>
                    <option value="Dairy">🥛 Dairy</option>
                    <option value="Poultry">🐔 Poultry</option>
                    <option value="Spices">🌶️ Spices</option>
                    <option value="Livestock">🐄 Livestock</option>
                    <option value="Others">🌱 Others</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">💰 Price (₹)</label>
                  <input type="number" value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="Empty = Gov price"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">🚜 Farming Method</label>
                  <select value={formData.farmingMethod}
                    onChange={(e) => setFormData({ ...formData, farmingMethod: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500"
                    required>
                    <option value="">-- Select --</option>
                    <option value="Organic">🌿 Organic</option>
                    <option value="Conventional">🌾 Conventional</option>
                    <option value="Hydroponics">💧Hydroponics</option>
                    <option value="Natural">🏠 Natural</option>
                    <option value="Mixed">🔄 Mixed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">🌱 Variety</label>
                  <input type="text" value={formData.variety}
                    onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                    placeholder="e.g. Cherry, Desi"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">📍 Origin</label>
                  <input type="text" value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    placeholder="e.g. Hyderabad"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">📅 Harvest Date</label>
                  <input type="date" value={formData.harvestDate}
                    onChange={(e) => setFormData({ ...formData, harvestDate: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">⏳ Shelf Life</label>
                  <input type="text" value={formData.shelflife}
                    onChange={(e) => setFormData({ ...formData, shelflife: e.target.value })}
                    placeholder="e.g. 7 days"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">⚖️ Size & Weight</label>
                  <input type="text" value={formData.sizeAndWeight}
                    onChange={(e) => setFormData({ ...formData, sizeAndWeight: e.target.value })}
                    placeholder="e.g. 1kg"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">🌤️ Seasonality</label>
                  <select value={formData.seasonality}
                    onChange={(e) => setFormData({ ...formData, seasonality: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500">
                    <option value="">-- Select --</option>
                    <option value="Summer">☀️ Summer</option>
                    <option value="Winter">❄️ Winter</option>
                    <option value="Monsoon">🌧️ Monsoon</option>
                    <option value="All Season">🌈 All Season</option>
                  </select>
                </div>
              </div>

              {formData.category === 'Livestock' && (
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                  <h4 className="font-medium text-orange-700 mb-3">🐄 Livestock Details</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Age" value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" />
                    <input type="text" placeholder="Breed" value={formData.breed}
                      onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                      className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" />
                    <select value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none">
                      <option value="">Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                    <input type="text" placeholder="Milk Yield" value={formData.milkyield}
                      onChange={(e) => setFormData({ ...formData, milkyield: e.target.value })}
                      className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" />
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">🖼️ Product Image</label>
                <input type="file" accept="image/*" onChange={handleImageChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm" required />
                {imagePreview && (
                  <div className="mt-2 relative inline-block">
                    <img src={imagePreview} alt="Preview" className="w-28 h-28 object-cover rounded-xl border" />
                    <button type="button"
                      onClick={() => { setImage(null); setImagePreview(null); }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={addLoading || firms.length === 0}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl text-sm font-medium disabled:opacity-50">
                  {addLoading ? '⏳ Adding...' : '🌾 Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProducts;