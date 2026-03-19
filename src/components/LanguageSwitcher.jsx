import React from 'react';

const LanguageSwitcher = ({ style = 'sidebar' }) => {

  const changeLanguage = (lang) => {
    const date = new Date();
    date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000));

    if (lang === 'en') {
      // English reset
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`;
    } else {
      document.cookie = `googtrans=/en/${lang}; expires=${date.toUTCString()}; path=/`;
      document.cookie = `googtrans=/en/${lang}; expires=${date.toUTCString()}; path=/; domain=${window.location.hostname}`;
      document.cookie = `googtrans=/en/${lang}; expires=${date.toUTCString()}; path=/; domain=.${window.location.hostname}`;
    }

    localStorage.setItem('language', lang);
    window.location.reload();
  };

  const currentLang = localStorage.getItem('language') || 'en';

  const langs = [
    { code: 'en', label: 'EN', flag: '🇬🇧' },
    { code: 'te', label: 'తె',  flag: '🇮🇳' },
    { code: 'hi', label: 'हि', flag: '🇮🇳' },
  ];

  // Sidebar style
  if (style === 'sidebar') {
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

  // Navbar style
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