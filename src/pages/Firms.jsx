import React, { useState, useEffect, useCallback } from 'react';
import { Plus, MapPin, Edit, Trash2, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const LocationPicker = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) { onLocationSelect(e.latlng); },
  });
  return null;
};

const categoryEmojis = {
  'Vegetables': '🥦',
  'Fruits':     '🍎',
  'Grains':     '🌾',
  'Dairy':      '🥛',
  'Poultry':    '🐔',
  'Spices':     '🌶️',
  'Flowers':    '🌸',
  'Others':     '🌱',
};

const Firms = () => {
  // ✅ Fix: removed unused vendorId
  const token = localStorage.getItem('token');

  const [firms, setFirms]                       = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [showForm, setShowForm]                 = useState(false);
  const [error, setError]                       = useState('');
  const [success, setSuccess]                   = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapCenter, setMapCenter]               = useState([20.5937, 78.9629]);

  const [formData, setFormData] = useState({
    firmName: '', area: '', city: '', state: '', region: '', category: 'Vegetables',
  });
  const [image, setImage] = useState(null);

  // ✅ Fix: wrapped in useCallback
  const fetchFirms = useCallback(async () => {
    try {
      const res  = await fetch(`https://backend-node-js-nfarm.onrender.com/firms/my-firms`, {
        headers: { token }
      });
      const data = await res.json();
      if (res.ok) {
        setFirms(data.firms || []);
      } else {
        setError(data.message || 'Failed to fetch firms');
      }
    } catch (err) {
      setError('Server not connected!');
      console.log('Error:', err);
    }
    setLoading(false);
  }, [token]);

  // ✅ Fix: fetchFirms safely in dependency array
  useEffect(() => { fetchFirms(); }, [fetchFirms]);

  const handleCitySearch = async (city) => {
    if (city.length < 3) return;
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${city}&format=json&limit=1`
      );
      const data = await res.json();
      if (data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setMapCenter([lat, lon]);
        setSelectedLocation({ lat, lng: lon });
      }
    } catch (err) {
      console.log('Location error:', err);
    }
  };

  const handleAddFirm = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const form = new FormData();
      form.append('firmName', formData.firmName);
      form.append('area',     formData.area);
      form.append('city',     formData.city);
      form.append('state',    formData.state);
      form.append('region',   formData.region);
      form.append('category', formData.category);
      if (selectedLocation) {
        form.append('latitude',  selectedLocation.lat);
        form.append('longitude', selectedLocation.lng);
      }
      if (image) form.append('image', image);

      const res  = await fetch('https://backend-node-js-nfarm.onrender.com/firms/add-firm', {
        method: 'POST', headers: { token }, body: form,
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess('Firm added successfully! 🎉');
        setShowForm(false);
        setFormData({ firmName: '', area: '', city: '', state: '', region: '', category: 'Vegetables' });
        setImage(null);
        setSelectedLocation(null);
        fetchFirms();
      } else {
        setError(data.message || 'Failed to add firm');
      }
    } catch (err) {
      setError('Server not connected!');
    }
  };

  const handleDelete = async (firmId) => {
    if (!window.confirm('Delete this firm?')) return;
    try {
      const res = await fetch(`https://backend-node-js-nfarm.onrender.com/firms/${firmId}`, {
        method: 'DELETE', headers: { token }
      });
      if (res.ok) {
        setSuccess('Firm deleted!');
        fetchFirms();
      } else {
        setError('Failed to delete');
      }
    } catch (err) {
      setError('Failed to delete');
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🏡 My Firms</h2>
          <p className="text-gray-500 text-sm">Manage your farm listings 🌾</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all">
          <Plus size={16} /> Add New Firm
        </button>
      </div>

      {/* Alerts */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <p className="text-green-700 text-sm">✅ {success}</p>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-red-600 text-sm">❌ {error}</p>
        </div>
      )}

      {/* Firms List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-2">⏳</p>
          <p className="text-gray-400">Loading firms...</p>
        </div>
      ) : firms.length === 0 ? (
        <div className="bg-yellow-100 rounded-2xl p-12 text-center shadow-sm">
          <p className="text-6xl mb-4">🌱</p>
          <h3 className="text-xl font-bold text-gray-800">No Firms Yet!</h3>
          <p className="text-gray-500 mt-2 mb-4">Add your first farm to get started 🚜</p>
          <button onClick={() => setShowForm(true)}
            className="bg-green-500 text-white px-6 py-2 rounded-xl text-sm font-medium">
            ➕ Add First Firm
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {firms.map((firm, index) => (
            <div key={firm._id || index} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all">
              <div className="h-40 bg-green-100 relative">
                {firm.image ? (
                  <img src={`https://backend-node-js-nfarm.onrender.com/uploads/${firm.image}`}
                    alt={firm.firmName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">
                    {categoryEmojis[firm.category] || '🌾'}
                  </div>
                )}
                <span className="absolute top-3 right-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  {categoryEmojis[firm.category]} {firm.category}
                </span>
              </div>

              {firm.latitude && firm.longitude && (
                <div className="h-32">
                  <MapContainer
                    center={[firm.latitude, firm.longitude]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                    dragging={false}
                    scrollWheelZoom={false}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[firm.latitude, firm.longitude]}>
                      <Popup>{firm.firmName} 📍</Popup>
                    </Marker>
                  </MapContainer>
                </div>
              )}

              <div className="p-4">
                <h3 className="font-bold text-gray-800 text-lg">{firm.firmName}</h3>
                <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                  <MapPin size={14} />
                  <span>{firm.area}{firm.city ? `, ${firm.city}` : ''}</span>
                </div>
                {firm.region && (
                  <div className="text-gray-400 text-xs mt-1">🗺️ Region: {firm.region}</div>
                )}
                <div className="flex gap-2 mt-4">
                  <button className="flex-1 flex items-center justify-center gap-1 bg-blue-50 text-blue-600 py-2 rounded-xl text-sm hover:bg-blue-100 transition-all">
                    <Edit size={14} /> Edit
                  </button>
                  <button onClick={() => handleDelete(firm._id)}
                    className="flex-1 flex items-center justify-center gap-1 bg-red-50 text-red-600 py-2 rounded-xl text-sm hover:bg-red-100 transition-all">
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Firm Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-yellow-100 rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">🌱 Add New Firm</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddFirm} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">🏡 Firm Name</label>
                <input type="text" value={formData.firmName}
                  onChange={(e) => setFormData({ ...formData, firmName: e.target.value })}
                  placeholder="Enter firm name"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500"
                  required />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">📍 Area</label>
                <input type="text" value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  placeholder="Enter area/village name"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500"
                  required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">🏙️ City</label>
                  <input type="text" value={formData.city}
                    onChange={(e) => {
                      setFormData({ ...formData, city: e.target.value });
                      handleCitySearch(e.target.value);
                    }}
                    placeholder="City"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500"
                    required />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">🗾 State</label>
                  <input type="text" value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="State"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500"
                    required />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">🗺️ Region</label>
                <input type="text" value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  placeholder="e.g. South India, Deccan Plateau"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500"
                  required />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">🌿 Category</label>
                <select value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-500">
                  <option value="Vegetables">🥦 Vegetables</option>
                  <option value="Fruits">🍎 Fruits</option>
                  <option value="Grains">🌾 Grains</option>
                  <option value="Dairy">🥛 Dairy</option>
                  <option value="Poultry">🐔 Poultry</option>
                  <option value="Spices">🌶️ Spices</option>
                  <option value="Flowers">🌸 Flowers</option>
                  <option value="Others">🌱 Others</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  📍 Select Farm Location (click on map)
                </label>
                <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height: '250px' }}>
                  <MapContainer center={mapCenter} zoom={10}
                    style={{ height: '100%', width: '100%' }}
                    key={mapCenter.toString()}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <LocationPicker onLocationSelect={setSelectedLocation} />
                    {selectedLocation && (
                      <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
                        <Popup>Farm Location 🌾</Popup>
                      </Marker>
                    )}
                  </MapContainer>
                </div>
                {selectedLocation ? (
                  <p className="text-green-600 text-xs mt-1">
                    ✅ Location: {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                  </p>
                ) : (
                  <p className="text-gray-400 text-xs mt-1">👆 Select a location on the map</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">🖼️ Farm Image</label>
                <input type="file" accept="image/*"
                  onChange={(e) => setImage(e.target.files[0])}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-medium">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl text-sm font-medium">
                  🌱 Add Firm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Firms;