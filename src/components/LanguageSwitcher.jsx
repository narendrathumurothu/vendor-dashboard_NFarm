import React from 'react';

const LanguageSwitcher = ({ variant = 'sidebar' }) => {

  const changeLanguage = (lang) => {
    localStorage.setItem('language', lang);

    const hostname = window.location.hostname;
    const expiry   = new Date();
    expiry.setTime(expiry.getTime() + (365 * 24 * 60 * 60 * 1000));

    if (lang === 'en') {
      // ✅ Fix: clear googtrans cookie completely
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${hostname}`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${hostname}`;
      // ✅ Fix: set to English explicitly
      document.cookie = `googtrans=/en/en; expires=${expiry.toUTCString()}; path=/`;
      document.cookie = `googtrans=/en/en; expires=${expiry.toUTCString()}; path=/; domain=${hostname}`;
      document.cookie = `googtrans=/en/en; expires=${expiry.toUTCString()}; path=/; domain=.${hostname}`;
    } else {
      document.cookie = `googtrans=/en/${lang}; expires=${expiry.toUTCString()}; path=/`;
      document.cookie = `googtrans=/en/${lang}; expires=${expiry.toUTCString()}; path=/; domain=${hostname}`;
      document.cookie = `googtrans=/en/${lang}; expires=${expiry.toUTCString()}; path=/; domain=.${hostname}`;
    }

    // ✅ Fix: always reload page — this is the only reliable way
    // to apply/remove Google Translate properly
    window.location.reload();
  };

  const currentLang = localStorage.getItem('language') || 'en';

  const langs = [
    { code: 'en', label: 'EN', flag: '🇬🇧' },
    { code: 'te', label: 'తె',  flag: '🇮🇳' },
    { code: 'hi', label: 'हि', flag: '🇮🇳' },
  ];

  // Sidebar variant
  if (variant === 'sidebar') {
    return (
      <div className="flex gap-1 bg-green-900 rounded-xl p-1 w-full">
        {langs.map(lang => (
          <button key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{
              background: currentLang === lang.code ? 'white' : 'transparent',
              color:      currentLang === lang.code ? '#16a34a' : '#86efac',
            }}>
            {lang.flag} {lang.label}
          </button>
        ))}
      </div>
    );
  }

  // Navbar variant
  return (
    <div className="flex gap-1 bg-green-700 rounded-xl p-1">
      {langs.map(lang => (
        <button key={lang.code}
          onClick={() => changeLanguage(lang.code)}
          className="px-2 py-1 rounded-lg text-xs font-bold transition-all"
          style={{
            background: currentLang === lang.code ? 'white' : 'transparent',
            color:      currentLang === lang.code ? '#16a34a' : '#86efac',
          }}>
          {lang.flag} {lang.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;