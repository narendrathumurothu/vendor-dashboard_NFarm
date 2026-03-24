import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, RotateCcw } from 'lucide-react';

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
  const [wakingUp, setWakingUp]         = useState(''); 
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

  // Background Image Slider
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg(prev => (prev + 1) % backgroundImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // OTP Timers
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

  // ✅ Updated Language Handler to fix English Reset Issue
  const handleLangSelect = (lang) => {
    setSelectedLang(lang);
    localStorage.setItem('language', lang);
    
    if (lang === 'en') {
      // Clear Google Translate cookies
      const domains = [window.location.hostname, `.${window.location.hostname}`];
      domains.forEach(domain => {
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}`;
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
      });
      
      const select = document.querySelector('.goog-te-combo');
      if (select) { 
        select.value = ''; 
        select.dispatchEvent(new Event('change')); 
      }
      
      // Refresh to ensure clean English load
      window.location.reload();
    } else {
      const date = new Date();
      date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000));
      document.cookie = `googtrans=/en/${lang}; expires=${date.toUTCString()}; path=/`;
      
      const select = document.querySelector('.goog-te-combo');
      if (select) { 
        select.value = lang; 
        select.dispatchEvent(new Event('change')); 
      }
    }
  };

  // ─── Register: Send OTP ───────────────────────────────────────────────────
  const handleSendOTP = async (e) => {
    if(e) e.preventDefault();
    setLoading(true); setError(''); setSuccess(''); setWakingUp('');
    try {
      const res  = await fetchWithRetry(
        `${BASE_URL}/vendors/send-otp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        },
        setWakingUp
      );
      const data = await res.json();
      setWakingUp('');
      if (res.ok) {
        setOtpSent(true);
        setTimer(60); // 60 seconds for Resend Cooldown
        setSuccess(`✅ OTP sent to ${formData.email}!`);
      } else {
        setError(data.message || 'Failed to send OTP!');
      }
    } catch {
      setWakingUp('');
      setError('Server connection failed. Please try again.');
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
      setError('Server error. Please try again.');
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
        onLogin();
      } else {
        setError(data.message || 'Invalid email or password!');
      }
    } catch {
      setWakingUp('');
      setError('Server not connected!');
    }
    setLoading(false);
  };

  // ... (Forgot Password Handlers stay the same as your previous code) ...

  const labels = {
    en: { selectLang: 'Select Language', login: 'Login', register: 'Register', username: 'Username', phone: 'Phone Number', address: 'Address', farmerName: 'Farmer Name', farmLoc: 'Farm Location', email: 'Email', password: 'Password', loginBtn: 'Login', registerBtn: 'Register' },
    te: { selectLang: 'భాష ఎంచుకోండి', login: 'లాగిన్', register: 'నమోదు చేయి', username: 'వినియోగదారు పేరు', phone: 'ఫోన్ నంబర్', address: 'చిరునామా', farmerName: 'రైతు పేరు', farmLoc: 'పొలం స్థానం', email: 'ఇమెయిల్', password: 'పాస్‌వర్డ్', loginBtn: 'లాగిన్ చేయండి', registerBtn: 'నమోదు చేయండి' },
    hi: { selectLang: 'भाषा चुनें', login: 'लॉगिन', register: 'पंजीकरण', username: 'उपयोगकर्ता नाम', phone: 'फोन नंबर', address: 'पता', farmerName: 'किसान का नाम', farmLoc: 'खेत का स्थान', email: 'ईमेल', password: 'पासवर्ड', loginBtn: 'लॉगिन करें', registerBtn: 'पंजीकरण करें' },
  };

  const L = labels[selectedLang] || labels.en;
  const formatTimer = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Section */}
      {backgroundImages.map((img, index) => (
        <div key={index} style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${img})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: currentBg === index ? 1 : 0,
          transition: 'opacity 1.5s ease-in-out', zIndex: 0,
        }} />
      ))}
      <div className="absolute inset-0 bg-black/60 z-[1]" />

      <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md mx-4 overflow-y-auto max-h-[90vh]">
        
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

        {/* Status Messages */}
        {wakingUp && <div className="bg-yellow-50 text-yellow-700 p-3 rounded-xl text-xs mb-3 text-center animate-pulse">⏳ {wakingUp}</div>}
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs mb-3">❌ {error}</div>}
        {success && <div className="bg-green-50 text-green-600 p-3 rounded-xl text-xs mb-3">{success}</div>}

        {/* Main Logic */}
        {isForgot ? (
           /* Forgot Password Logic stays exactly like your previous version */
           <div /> 
        ) : (
          <>
            <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
              <button onClick={() => { setIsRegister(false); setOtpSent(false); setError(''); setSuccess(''); }}
                className="flex-1 py-2 rounded-xl text-sm font-medium"
                style={{ background: !isRegister ? '#16a34a' : 'transparent', color: !isRegister ? 'white' : '#6b7280' }}>
                🔐 {L.login}
              </button>
              <button onClick={() => { setIsRegister(true); setOtpSent(false); setError(''); setSuccess(''); }}
                className="flex-1 py-2 rounded-xl text-sm font-medium"
                style={{ background: isRegister ? '#16a34a' : 'transparent', color: isRegister ? 'white' : '#6b7280' }}>
                📝 {L.register}
              </button>
            </div>

            {isRegister && otpSent ? (
              <div className="space-y-4">
                <div className="text-center bg-green-50 rounded-2xl p-5">
                  <p className="font-bold text-gray-800">Verify Identity</p>
                  <p className="text-gray-500 text-xs">Code sent to: {formData.email}</p>
                </div>
                <input type="text" value={otp} onChange={e => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP" maxLength={6}
                  className="w-full bg-gray-50 rounded-xl px-4 py-4 text-center text-3xl font-bold tracking-[8px] outline-none border-2 border-transparent focus:border-green-500" />
                
                <button onClick={handleVerifyOTP} disabled={loading || otp.length < 6}
                  className="w-full bg-green-500 text-white py-3 rounded-xl font-bold disabled:opacity-50">
                  {loading ? 'Verifying...' : 'Verify & Register'}
                </button>

                <button onClick={handleSendOTP} disabled={timer > 0 || loading}
                  className="flex items-center justify-center gap-2 w-full text-green-600 text-sm font-bold disabled:text-gray-400">
                  <RotateCcw size={14} />
                  {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP Now'}
                </button>
              </div>
            ) : isRegister ? (
              <form onSubmit={handleSendOTP} className="space-y-3">
                {/* Your standard registration inputs here */}
                <input type="text" placeholder={L.username} className="w-full bg-gray-50 p-3 rounded-xl text-sm" onChange={e => setFormData({...formData, username: e.target.value})} required />
                <input type="email" placeholder={L.email} className="w-full bg-gray-50 p-3 rounded-xl text-sm" onChange={e => setFormData({...formData, email: e.target.value})} required />
                <input type="password" placeholder={L.password} className="w-full bg-gray-50 p-3 rounded-xl text-sm" onChange={e => setFormData({...formData, Password: e.target.value})} required />
                <input type="text" placeholder={L.phone} className="w-full bg-gray-50 p-3 rounded-xl text-sm" onChange={e => setFormData({...formData, PhoneNumber: e.target.value})} required />
                <input type="text" placeholder={L.address} className="w-full bg-gray-50 p-3 rounded-xl text-sm" onChange={e => setFormData({...formData, Address: e.target.value})} required />
                <input type="text" placeholder={L.farmerName} className="w-full bg-gray-50 p-3 rounded-xl text-sm" onChange={e => setFormData({...formData, FarmerName: e.target.value})} required />
                <input type="text" placeholder={L.farmLoc} className="w-full bg-gray-50 p-3 rounded-xl text-sm" onChange={e => setFormData({...formData, FarmLocation: e.target.value})} required />
                
                <button type="submit" disabled={loading} className="w-full bg-green-500 text-white py-3 rounded-xl font-bold">
                  {loading ? 'Sending OTP...' : 'Send OTP to Verify'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <input type="email" placeholder={L.email} className="w-full bg-gray-50 p-4 rounded-xl text-sm" onChange={e => setFormData({...formData, email: e.target.value})} required />
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} placeholder={L.password} className="w-full bg-gray-50 p-4 rounded-xl text-sm" onChange={e => setFormData({...formData, Password: e.target.value})} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-gray-400">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-green-500 text-white py-4 rounded-xl font-bold">
                  {loading ? 'Signing in...' : L.loginBtn}
                </button>
              </form>
            )}
          </>
        )}

        {/* Navigation Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {backgroundImages.map((_, index) => (
            <div key={index} className={`h-1.5 rounded-full transition-all ${currentBg === index ? 'w-6 bg-green-500' : 'w-2 bg-gray-300'}`} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;