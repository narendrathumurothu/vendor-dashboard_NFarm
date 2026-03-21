import React, { useState, useEffect, useCallback } from 'react';
import { Edit, Save, X, Eye, EyeOff, MapPin, Camera } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const backgroundImages = [
  'https://images.pexels.com/photos/440731/pexels-photo-440731.jpeg',
  'https://images.pexels.com/photos/247599/pexels-photo-247599.jpeg',
  'https://images.pexels.com/photos/235725/pexels-photo-235725.jpeg',
  'https://images.pexels.com/photos/1300972/pexels-photo-1300972.jpeg',
  'https://images.pexels.com/photos/462118/pexels-photo-462118.jpeg',
];

const Profile = () => {
  const token    = localStorage.getItem('token');
  const vendorId = localStorage.getItem('vendorId');

  const [currentBg, setCurrentBg]       = useState(0);
  const [vendor, setVendor]             = useState(null);
  const [firms, setFirms]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [editMode, setEditMode]         = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess]           = useState('');
  const [error, setError]               = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photo, setPhoto]               = useState(null);

  const [editData, setEditData] = useState({
    username: '', email: '', PhoneNumber: '',
    Address: '', FarmerName: '', FarmLocation: '',
  });

  const [passData, setPassData] = useState({
    oldPassword: '', newPassword: '', confirmPassword: '',
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg(prev => (prev + 1) % backgroundImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // FIX: useCallback తో fetchVendor define చేశాం
  const fetchVendor = useCallback(async () => {
    try {
      const res  = await fetch(
        `https://backend-node-js-nfarm.onrender.com/vendors/single-vendor/${vendorId}`,
        { headers: { token } }
      );
      const data = await res.json();
      if (res.ok) {
        setVendor(data);
        setEditData({
          username:     data.username     || '',
          email:        data.email        || '',
          PhoneNumber:  data.PhoneNumber  || '',
          Address:      data.Address      || '',
          FarmerName:   data.FarmerName   || '',
          FarmLocation: data.FarmLocation || '',
        });
      }
    } catch (err) { console.log(err); }
    setLoading(false);
  }, [token, vendorId]); // FIX: dependencies add చేశాం

  // FIX: useCallback తో fetchFirms define చేశాం
  const fetchFirms = useCallback(async () => {
    try {
      const res  = await fetch('https://backend-node-js-nfarm.onrender.com/firms/my-firms', {
        headers: { token }
      });
      const data = await res.json();
      if (res.ok) setFirms(data.firms || []);
    } catch (err) { console.log(err); }
  }, [token]); // FIX: token dependency add చేశాం

  // FIX: fetchVendor మరియు fetchFirms dependencies సరిగ్గా add చేశాం
  useEffect(() => {
    fetchVendor();
    fetchFirms();
  }, [fetchVendor, fetchFirms]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    setPhoto(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleEditSave = async () => {
    setError(''); setSuccess('');
    try {
      const form = new FormData();
      form.append('username',     editData.username);
      form.append('email',        editData.email);
      form.append('PhoneNumber',  editData.PhoneNumber);
      form.append('Address',      editData.Address);
      form.append('FarmerName',   editData.FarmerName);
      form.append('FarmLocation', editData.FarmLocation);
      if (photo) form.append('image', photo);

      const res  = await fetch(
        `https://backend-node-js-nfarm.onrender.com/vendors/update-vendor/${vendorId}`,
        { method: 'PUT', headers: { token }, body: form }
      );
      const data = await res.json();

      if (res.ok) {
        setSuccess('✅ Profile updated successfully!');
        localStorage.setItem('vendorName', editData.username);
        setEditMode(false);
        fetchVendor();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Update failed!');
      }
    } catch { setError('Server not connected!'); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (passData.newPassword !== passData.confirmPassword) {
      setError('New passwords do not match!'); return;
    }
    if (passData.newPassword.length < 6) {
      setError('Password must be at least 6 characters!'); return;
    }
    try {
      const res  = await fetch(
        `https://backend-node-js-nfarm.onrender.com/vendors/change-password/${vendorId}`,
        {
          method:  'POST',
          headers: { token, 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            oldPassword: passData.oldPassword,
            newPassword: passData.newPassword,
          }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setSuccess('✅ Password changed successfully!');
        setPassData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed!');
      }
    } catch { setError('Server not connected!'); }
  };

  // ✅ Safe coordinates helper
  const getFirmCoords = (firm) => {
    if (firm.latitude && firm.longitude) {
      return { lat: firm.latitude, lng: firm.longitude };
    }
    if (
      firm.location?.coordinates?.length === 2 &&
      firm.location.coordinates[0] !== 0 &&
      firm.location.coordinates[1] !== 0
    ) {
      return {
        lat: firm.location.coordinates[1],
        lng: firm.location.coordinates[0],
      };
    }
    return null;
  };

  // ✅ Safe map center
  const getMapCenter = () => {
    for (const firm of firms) {
      const coords = getFirmCoords(firm);
      if (coords) return [coords.lat, coords.lng];
    }
    return [20.5937, 78.9629];
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

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2 }} className="space-y-5">

        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold text-white">👤 My Profile</h2>
          <p style={{ color: '#86efac' }} className="text-sm mt-1">
            🌾 Manage your account details
          </p>
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

        {loading ? (
          <div className="text-center py-12">
            <p className="text-6xl mb-2">⏳</p>
            <p className="text-white">Loading profile...</p>
          </div>
        ) : (
          <>
            {/* Profile Card */}
            <div className="rounded-2xl p-6"
              style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)' }}>

              <div className="flex items-start justify-between mb-6">
                <h3 className="font-bold text-gray-800 text-lg">👤 Farmer Details</h3>
                <button onClick={() => setEditMode(!editMode)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                  style={{
                    background: editMode ? '#fee2e2' : '#f0fdf4',
                    color:      editMode ? '#dc2626' : '#16a34a',
                  }}>
                  {editMode ? <><X size={14} /> Cancel</> : <><Edit size={14} /> Edit</>}
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-6">

                {/* Photo */}
                <div className="flex flex-col items-center gap-3 flex-shrink-0">
                  <div className="relative">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Profile"
                        className="w-28 h-28 rounded-full object-cover"
                        style={{ border: '4px solid #16a34a' }} />
                    ) : (
                      <div className="w-28 h-28 rounded-full bg-green-500 flex items-center justify-center"
                        style={{ border: '4px solid #16a34a' }}>
                        <span className="text-white font-bold text-4xl">
                          {vendor?.username?.charAt(0).toUpperCase() || 'V'}
                        </span>
                      </div>
                    )}
                    {editMode && (
                      <label className="absolute bottom-0 right-0 bg-green-500 text-white p-1.5 rounded-full cursor-pointer hover:bg-green-600">
                        <Camera size={14} />
                        <input type="file" accept="image/*"
                          onChange={handlePhotoChange} className="hidden" />
                      </label>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-800">{vendor?.username}</p>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      🌾 Farmer
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { label: '👤 Username',     key: 'username',     type: 'text'  },
                    { label: '📧 Email',         key: 'email',        type: 'email' },
                    { label: '📱 Phone Number',  key: 'PhoneNumber',  type: 'text'  },
                    { label: '🧑‍🌾 Farmer Name', key: 'FarmerName',   type: 'text'  },
                    { label: '📍 Address',       key: 'Address',      type: 'text'  },
                    { label: '🌾 Farm Location', key: 'FarmLocation', type: 'text'  },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">
                        {field.label}
                      </label>
                      {editMode ? (
                        <input type={field.type} value={editData[field.key]}
                          onChange={(e) => setEditData({ ...editData, [field.key]: e.target.value })}
                          className="w-full bg-gray-50 rounded-xl px-4 py-2.5 text-sm outline-none" />
                      ) : (
                        <p className="bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-gray-800">
                          {vendor?.[field.key] || '—'}
                        </p>
                      )}
                    </div>
                  ))}

                  {editMode && (
                    <div className="md:col-span-2">
                      <button onClick={handleEditSave}
                        className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium">
                        <Save size={14} /> Save Changes
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { emoji: '🏡', label: 'Total Firms',    value: firms.length },
                { emoji: '📦', label: 'Total Products', value: firms.reduce((a, f) => a + (f.products?.length || 0), 0) },
                { emoji: '📅', label: 'Member Since',   value: vendor?.createdAt ? new Date(vendor.createdAt).getFullYear() : '2026' },
              ].map((stat, i) => (
                <div key={i} className="rounded-2xl p-4 text-center"
                  style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)' }}>
                  <p className="text-3xl mb-1">{stat.emoji}</p>
                  <p className="text-gray-800 text-2xl font-bold">{stat.value}</p>
                  <p className="text-gray-500 text-xs">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Change Password */}
            <div className="rounded-2xl p-6"
              style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)' }}>
              <h3 className="font-bold text-gray-800 text-lg mb-4">🔒 Change Password</h3>
              <form onSubmit={handlePasswordChange} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">🔑 Old Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passData.oldPassword}
                      onChange={(e) => setPassData({ ...passData, oldPassword: e.target.value })}
                      placeholder="Enter old password"
                      className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none pr-10"
                      required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">🔒 New Password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passData.newPassword}
                      onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                      placeholder="New password"
                      className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none"
                      required />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">✅ Confirm Password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passData.confirmPassword}
                      onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
                      placeholder="Confirm password"
                      className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none"
                      required />
                  </div>
                </div>
                <button type="submit"
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium">
                  🔒 Change Password
                </button>
              </form>
            </div>

            {/* ✅ Farm Locations Map - Fixed */}
            {firms.length > 0 && (
              <div className="rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)' }}>
                <div className="px-6 py-4">
                  <h3 className="font-bold text-gray-800 text-lg">
                    🗺️ My Farm Locations ({firms.length} firms)
                  </h3>
                </div>
                <div style={{ height: '300px' }}>
                  <MapContainer
                    center={getMapCenter()}
                    zoom={6}
                    style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {firms.map((firm, i) => {
                      const coords = getFirmCoords(firm);
                      if (!coords) return null;
                      return (
                        <Marker key={i} position={[coords.lat, coords.lng]}>
                          <Popup>
                            <div className="text-center">
                              <p className="font-bold">{firm.firmName} 🏡</p>
                              <p className="text-xs text-gray-500">{firm.area}</p>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MapContainer>
                </div>

                {/* Firm List */}
                <div className="px-6 py-4 space-y-2">
                  {firms.map((firm, i) => (
                    <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                      <MapPin size={16} className="text-green-500" />
                      <div>
                        <p className="text-gray-800 text-sm font-medium">{firm.firmName}</p>
                        <p className="text-gray-400 text-xs">{firm.area} • {firm.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </>
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

export default Profile;