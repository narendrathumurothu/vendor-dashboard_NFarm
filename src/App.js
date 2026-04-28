import React, { useState } from 'react';
import Sidebar      from './components/Sidebar';
import Navbar       from './components/Navbar';
import Login        from './pages/Login';
import Home         from './pages/Home';
import Firms        from './pages/Firms';
import MyProducts   from './pages/MyProducts';
import Marketprices from './pages/Marketprices';
import Suggestions  from './pages/Suggestions';
import Notifications from './pages/Notifications';
import Myprofile    from './pages/Myprofile';
import VendorOrders from './pages/VendorOrders';
import AIChatWidget from './components/AIChatWidget';

function App() {
  const [activePage, setActivePage] = useState('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem('token')  // ✅ Already logged in check
  );

  const handleLogin = () => {
    setIsLoggedIn(true);             // ✅ data Login.jsx లో save చేస్తున్నాం
    setActivePage('home');
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);            // ✅ false గా మార్చాం
    setActivePage('home');
  };

  const renderPage = () => {
    switch (activePage) {
      case 'profile':       return <Myprofile />;
      case 'notifications': return <Notifications />;
      case 'suggestions':   return <Suggestions />;
      case 'marketprices':  return <Marketprices />;
      case 'firms':         return <Firms />;
      case 'orders':        return <VendorOrders />;
      case 'products':      return <MyProducts />;
      case 'home':          return <Home setActivePage={setActivePage} />;
      default:
        return (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <p className="text-4xl mb-3">🏗️</p>
            <h3 className="text-xl font-bold text-gray-800">Coming Soon!</h3>
            <p className="text-gray-500 mt-2">This page is under construction</p>
          </div>
        );
    }
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-gray-100 overflow-hidden relative">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar activePage={activePage} setActivePage={setActivePage} onMenuClick={() => setIsSidebarOpen(true)} />
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {renderPage()}
        </div>
      </div>
      <AIChatWidget />
    </div>
  );
}

export default App;