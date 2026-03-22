import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const backgroundImages = [
  'https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg',
  'https://images.pexels.com/photos/144248/potatoes-vegetables-erdfrucht-bio-144248.jpeg',
  'https://images.pexels.com/photos/2255935/pexels-photo-2255935.jpeg',
  'https://images.pexels.com/photos/1640770/pexels-photo-1640770.jpeg',
  'https://images.pexels.com/photos/533360/pexels-photo-533360.jpeg',
];

const BASE_URL = 'https://backend-node-js-nfarm.onrender.com';

// ✅ Smart fetch — auto retries once if server is waking up
const fetchWithRetry = async (url, options, onWaking) => {
  try {
    const res = await fetch(url, options);
    return res;
  } catch (err) {
    // First attempt failed — server might be sleeping, wait and retry
    onWaking('🌐 Server is starting up, please wait...');
    await new Promise(resolve => setTimeout(resolve, 8000)); // wait 8 seconds
    return await fetch(url, options); // retry
  }
};

const Login = ({ onLogin }) => {
  const [currentBg, setCurrentBg]       = useState(0);
  const [isRegister, setIsRegister]     = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [wakingUp, setWakingUp]         = useState(''); // ✅ server wake-up message
  const [selectedLang, setSelectedLang] = useState(localStorage.getItem('language') || 'en');

  // Register OTP States
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp]         = useState('');
  const [timer, setTimer]     = useState(0);

  // Forgot Password States
  const [isForgot, setIsForgot]           = useState(false);
  const [forgotStep, setForgotStep]       = useState(1);
  const [forgotEmail, setForgotEmail]     = useState('');
  const [forgotOtp, setForgotOtp]         = useState('');
  const [newPassword, setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotTimer, setForgotTimer]     = useState(0);

  const [formData, setFormData] = useState({
    username: '', email: '', Password: '',
    PhoneNumber: '', Address: '', FarmerName: '', FarmLocation: '',
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg(prev => (prev + 1) % backgroundImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setInterval(() => setTimer(prev => prev - 1), 1000);
    return () => clearInterval(t);
  }, [timer]);

  useEffect(() => {
    if (forgotTimer <= 0) return;
    const t = setInterval(() => setForgotTimer(prev => prev - 1), 1000);
    return () => clearInterval(t);
  }, [forgotTimer]);

  const handleLangSelect = (lang) => {
    setSelectedLang(lang);
    localStorage.setItem('language', lang);
    const date = new Date();
    date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000));
    if (lang === 'en') {
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`;
    } else {
      document.cookie = `googtrans=/en/${lang}; expires=${date.toUTCString()}; path=/`;
      document.cookie = `googtrans=/en/${lang}; expires=${date.toUTCString()}; path=/; domain=${window.location.hostname}`;
      document.cookie = `googtrans=/en/${lang}; expires=${date.toUTCString()}; path=/; domain=.${window.location.hostname}`;
    }
    const select = document.querySelector('.goog-te-combo');
    if (select) { select.value = lang === 'en' ? '' : lang; select.dispatchEvent(new Event('change')); }
  };

  // ─── Register: Send OTP ───────────────────────────────────────────────────
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess(''); setWakingUp('');
    try {
      const res  = await fetchWithRetry(
        `${BASE_URL}/vendors/send-otp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username:    formData.username,
            email:       formData.email,
            Password:    formData.Password,
            PhoneNumber: formData.PhoneNumber,
            Address:     formData.Address,
            FarmerName:  formData.FarmerName,
            FarmLocation: formData.FarmLocation,
          }),
        },
        setWakingUp
      );
      const data = await res.json();
      setWakingUp('');
      if (res.ok) {
        setOtpSent(true);
        setTimer(600);
        setSuccess(`✅ OTP sent to ${formData.email}!`);
      } else {
        setError(data.message || 'Failed to send OTP!');
      }
    } catch {
      setWakingUp('');
      setError('Server not connected! Please try again.');
    }
    setLoading(false);
  };

  // ─── Register: Verify OTP ─────────────────────────────────────────────────
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess(''); setWakingUp('');
    try {
      const res  = await fetchWithRetry(
        `${BASE_URL}/vendors/register`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, otp }),
        },
        setWakingUp
      );
      const data = await res.json();
      setWakingUp('');
      if (res.ok) {
        setSuccess('✅ Registered successfully! Please login.');
        setIsRegister(false); setOtpSent(false); setOtp('');
        setFormData({ username: '', email: '', Password: '', PhoneNumber: '', Address: '', FarmerName: '', FarmLocation: '' });
      } else {
        setError(data.message || 'Invalid OTP!');
      }
    } catch {
      setWakingUp('');
      setError('Server not connected! Please try again.');
    }
    setLoading(false);
  };

  // ─── Login ────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess(''); setWakingUp('');
    try {
      const res  = await fetchWithRetry(
        `${BASE_URL}/vendors/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, Password: formData.Password }),
        },
        setWakingUp
      );
      const data = await res.json();
      setWakingUp('');
      if (res.ok) {
        localStorage.setItem('token',      data.token);
        localStorage.setItem('vendorId',   data.VendorId);
        localStorage.setItem('vendorName', data.username);
        localStorage.setItem('language',   selectedLang);
        onLogin();
      } else {
        setError(data.message || 'Something went wrong!');
      }
    } catch {
      setWakingUp('');
      setError('Server not connected! Please try again.');
    }
    setLoading(false);
  };

  // ─── Forgot Password Step 1: Send OTP ────────────────────────────────────
  const handleForgotSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess(''); setWakingUp('');
    try {
      const res  = await fetchWithRetry(
        `${BASE_URL}/vendors/forgot-password/send-otp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: forgotEmail }),
        },
        setWakingUp
      );
      const data = await res.json();
      setWakingUp('');
      if (res.ok) { setForgotStep(2); setForgotTimer(600); setSuccess(`✅ OTP sent to ${forgotEmail}!`); }
      else setError(data.message || 'Failed to send OTP!');
    } catch {
      setWakingUp('');
      setError('Server not connected! Please try again.');
    }
    setLoading(false);
  };

  // ─── Forgot Password Step 2: Verify OTP ──────────────────────────────────
  const handleForgotVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess(''); setWakingUp('');
    try {
      const res  = await fetchWithRetry(
        `${BASE_URL}/vendors/forgot-password/verify-otp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: forgotEmail, otp: forgotOtp }),
        },
        setWakingUp
      );
      const data = await res.json();
      setWakingUp('');
      if (res.ok) { setForgotStep(3); setSuccess('✅ OTP verified!'); }
      else setError(data.message || 'Invalid OTP!');
    } catch {
      setWakingUp('');
      setError('Server not connected! Please try again.');
    }
    setLoading(false);
  };

  // ─── Forgot Password Step 3: Reset Password ──────────────────────────────
  const handleForgotReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError('Passwords do not match!'); return; }
    setLoading(true); setError(''); setSuccess(''); setWakingUp('');
    try {
      const res  = await fetchWithRetry(
        `${BASE_URL}/vendors/forgot-password/reset`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: forgotEmail, newPassword }),
        },
        setWakingUp
      );
      const data = await res.json();
      setWakingUp('');
      if (res.ok) {
        setSuccess('✅ Password reset successfully! Please login.');
        setIsForgot(false); setForgotStep(1);
        setForgotEmail(''); setForgotOtp(''); setNewPassword(''); setConfirmPassword('');
      } else setError(data.message || 'Failed to reset password!');
    } catch {
      setWakingUp('');
      setError('Server not connected! Please try again.');
    }
    setLoading(false);
  };

  const labels = {
    en: { selectLang: 'Select Language', login: 'Login', register: 'Register', username: 'Username', phone: 'Phone Number', address: 'Address', farmerName: 'Farmer Name', farmLoc: 'Farm Location', email: 'Email', password: 'Password', loginBtn: 'Login', registerBtn: 'Register' },
    te: { selectLang: 'భాష ఎంచుకోండి', login: 'లాగిన్', register: 'నమోదు చేయి', username: 'వినియోగదారు పేరు', phone: 'ఫోన్ నంబర్', address: 'చిరునామా', farmerName: 'రైతు పేరు', farmLoc: 'పొలం స్థానం', email: 'ఇమెయిల్', password: 'పాస్‌వర్డ్', loginBtn: 'లాగిన్ చేయండి', registerBtn: 'నమోదు చేయండి' },
    hi: { selectLang: 'भाषा चुनें', login: 'लॉगिन', register: 'पंजीकरण', username: 'उपयोगकर्ता नाम', phone: 'फोन नंबर', address: 'पता', farmerName: 'किसान का नाम', farmLoc: 'खेत का स्थान', email: 'ईमेल', password: 'पासवर्ड', loginBtn: 'लॉगिन करें', registerBtn: 'पंजीकरण करें' },
  };

  const L = labels[selectedLang] || labels.en;
  const formatTimer = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">

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

      {/* Card */}
      <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md mx-4"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Logo */}
        <div className="text-center mb-5">
          <span className="text-5xl">🌾</span>
          <h1 className="text-2xl font-bold text-gray-800 mt-2">NFarm</h1>
          <p className="text-gray-500 text-sm">Vendor Dashboard</p>
        </div>

        {/* Language Select */}
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-600 mb-2 text-center">🌐 {L.selectLang}</p>
          <div className="grid grid-cols-3 gap-2">
            {[{ code: 'en', label: '🇬🇧 English' }, { code: 'te', label: '🇮🇳 తెలుగు' }, { code: 'hi', label: '🇮🇳 हिंदी' }].map(lang => (
              <button key={lang.code} type="button" onClick={() => handleLangSelect(lang.code)}
                className="py-2 rounded-xl text-xs font-medium transition-all"
                style={{ background: selectedLang === lang.code ? '#16a34a' : '#f3f4f6', color: selectedLang === lang.code ? 'white' : '#374151' }}>
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* ✅ Server waking up message */}
        {wakingUp && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-3">
            <p className="text-yellow-700 text-sm text-center">⏳ {wakingUp}</p>
          </div>
        )}

        {/* Alerts */}
        {error   && <div className="bg-red-50 rounded-xl px-4 py-3 mb-3"><p className="text-red-600 text-sm">❌ {error}</p></div>}
        {success && <div className="bg-green-50 rounded-xl px-4 py-3 mb-3"><p className="text-green-600 text-sm">{success}</p></div>}

        {/* ─── Forgot Password Flow ─── */}
        {isForgot ? (
          <div>
            <div className="text-center mb-4">
              <p className="text-3xl mb-1">🔐</p>
              <h2 className="font-bold text-gray-800">Forgot Password</h2>
              <p className="text-gray-500 text-xs mt-1">
                {forgotStep === 1 ? 'Enter your email to receive OTP' :
                 forgotStep === 2 ? 'Enter the OTP sent to your email' :
                 'Set your new password'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 mb-4">
              {[1, 2, 3].map(step => (
                <div key={step} className="flex items-center gap-2">
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: forgotStep >= step ? '#16a34a' : '#e5e7eb',
                    color: forgotStep >= step ? 'white' : '#9ca3af',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700,
                  }}>{step}</div>
                  {step < 3 && <div style={{ width: 20, height: 2, background: forgotStep > step ? '#16a34a' : '#e5e7eb' }} />}
                </div>
              ))}
            </div>

            {forgotStep === 1 && (
              <form onSubmit={handleForgotSendOTP} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">📧 Email</label>
                  <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none" required />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl text-sm font-bold disabled:opacity-50">
                  {loading ? '⏳ Sending...' : '📧 Send OTP'}
                </button>
              </form>
            )}

            {forgotStep === 2 && (
              <form onSubmit={handleForgotVerifyOTP} className="space-y-3">
                <div className="text-center bg-green-50 rounded-xl p-3">
                  <p className="text-gray-600 text-sm">OTP sent to <strong>{forgotEmail}</strong></p>
                  {forgotTimer > 0 && <p className="text-green-600 text-sm font-bold mt-1">⏰ {formatTimer(forgotTimer)}</p>}
                  {forgotTimer === 0 && <p className="text-red-500 text-sm mt-1">⚠️ OTP expired!</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">🔐 Enter OTP</label>
                  <input type="text" value={forgotOtp} onChange={e => setForgotOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP" maxLength={6}
                    className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none text-center text-2xl font-bold tracking-widest" required />
                </div>
                <button type="submit" disabled={loading || forgotTimer === 0}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl text-sm font-bold disabled:opacity-50">
                  {loading ? '⏳ Verifying...' : '✅ Verify OTP'}
                </button>
              </form>
            )}

            {forgotStep === 3 && (
              <form onSubmit={handleForgotReset} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">🔒 New Password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 6 chars)"
                      className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none pr-10" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">✅ Confirm Password</label>
                  <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none" required />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl text-sm font-bold disabled:opacity-50">
                  {loading ? '⏳ Resetting...' : '🔐 Reset Password'}
                </button>
              </form>
            )}

            <button type="button" onClick={() => { setIsForgot(false); setForgotStep(1); setForgotEmail(''); setForgotOtp(''); setNewPassword(''); setConfirmPassword(''); setError(''); setSuccess(''); }}
              className="w-full bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm font-medium mt-3">
              ← Back to Login
            </button>
          </div>

        ) : (
          <>
            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
              <button onClick={() => { setIsRegister(false); setOtpSent(false); setOtp(''); setError(''); setSuccess(''); }}
                className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                style={{ background: !isRegister ? '#16a34a' : 'transparent', color: !isRegister ? 'white' : '#6b7280' }}>
                🔐 {L.login}
              </button>
              <button onClick={() => { setIsRegister(true); setOtpSent(false); setOtp(''); setError(''); setSuccess(''); }}
                className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                style={{ background: isRegister ? '#16a34a' : 'transparent', color: isRegister ? 'white' : '#6b7280' }}>
                📝 {L.register}
              </button>
            </div>

            {/* OTP Screen */}
            {isRegister && otpSent ? (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="text-center bg-green-50 rounded-2xl p-5">
                  <p className="text-4xl mb-2">📧</p>
                  <p className="font-bold text-gray-800">OTP Sent!</p>
                  <p className="text-gray-500 text-sm mt-1">Check: <strong>{formData.email}</strong></p>
                  {timer > 0 && <p className="text-green-600 text-sm font-bold mt-2">⏰ {formatTimer(timer)}</p>}
                  {timer === 0 && <p className="text-red-500 text-sm mt-2">⚠️ OTP expired! Go back and resend.</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">🔐 Enter OTP</label>
                  <input type="text" value={otp} onChange={e => setOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP" maxLength={6}
                    className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none text-center text-2xl font-bold tracking-widest" required />
                </div>
                <button type="submit" disabled={loading || timer === 0}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl text-sm font-bold disabled:opacity-50">
                  {loading ? '⏳ Verifying...' : '✅ Verify & Register'}
                </button>
                <button type="button" onClick={() => { setOtpSent(false); setOtp(''); setError(''); setSuccess(''); }}
                  className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl text-sm font-medium">
                  ← Back to Register
                </button>
              </form>

            ) : isRegister ? (
              <form onSubmit={handleSendOTP} className="space-y-3">
                {[
                  { label: `👤 ${L.username}`,   key: 'username',    type: 'text'  },
                  { label: `📱 ${L.phone}`,       key: 'PhoneNumber', type: 'text'  },
                  { label: `📍 ${L.address}`,     key: 'Address',     type: 'text'  },
                  { label: `🧑‍🌾 ${L.farmerName}`, key: 'FarmerName',  type: 'text'  },
                  { label: `🌾 ${L.farmLoc}`,     key: 'FarmLocation',type: 'text'  },
                  { label: `📧 ${L.email}`,       key: 'email',       type: 'email' },
                ].map(field => (
                  <div key={field.key}>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">{field.label}</label>
                    <input type={field.type} value={formData[field.key]}
                      onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                      className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none" required />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">🔒 {L.password}</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={formData.Password}
                      onChange={e => setFormData({ ...formData, Password: e.target.value })}
                      className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none pr-10" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl text-sm font-bold disabled:opacity-50">
                  {loading ? '⏳ Sending OTP...' : '📧 Send OTP to Email'}
                </button>
              </form>

            ) : (
              <form onSubmit={handleLogin} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">📧 {L.email}</label>
                  <input type="email" value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none" required />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">🔒 {L.password}</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={formData.Password}
                      onChange={e => setFormData({ ...formData, Password: e.target.value })}
                      className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm outline-none pr-10" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <button type="button" onClick={() => { setIsForgot(true); setError(''); setSuccess(''); }}
                    className="text-green-600 text-xs font-medium hover:underline">
                    🔐 Forgot Password?
                  </button>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl text-sm font-bold disabled:opacity-50">
                  {loading ? '⏳...' : `🔐 ${L.loginBtn}`}
                </button>
              </form>
            )}
          </>
        )}

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-5">
          {backgroundImages.map((_, index) => (
            <div key={index} onClick={() => setCurrentBg(index)} style={{
              height: '6px', width: currentBg === index ? '24px' : '8px',
              borderRadius: '3px', cursor: 'pointer',
              background: currentBg === index ? '#16a34a' : '#d1d5db',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;