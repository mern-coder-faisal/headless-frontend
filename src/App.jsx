import React, { useState, useEffect } from 'react';
import PortfolioLanding from './components/PortfolioLanding';
import ProjectSingle from './components/ProjectSingle';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'admin'

  // URL-এ '/admin' লিখে সরাসরি প্রবেশ সুবিধা
  useEffect(() => {
    if (window.location.pathname === '/admin') {
      setCurrentView('admin');
    }
  }, []);

  return (
    <div>
      {/* Top Quick Navigation Bar */}
      <nav className="bg-slate-900 border-b border-slate-800 text-slate-300 px-6 py-2.5 flex justify-between items-center text-xs font-semibold">
        <span className="text-slate-400">Headless WP Portfolio</span>
        <div className="flex gap-4">
          <button 
            onClick={() => { setCurrentView('home'); setSelectedProjectId(null); }}
            className={`transition hover:text-white ${currentView === 'home' ? 'text-indigo-400 font-bold' : ''}`}
          >
            Home Portfolio
          </button>
          <button 
            onClick={() => setCurrentView('admin')}
            className={`transition hover:text-white ${currentView === 'admin' ? 'text-indigo-400 font-bold' : ''}`}
          >
            Admin Panel
          </button>
        </div>
      </nav>

      {/* View Switcher */}
      {currentView === 'admin' ? (
        <AdminDashboard />
      ) : selectedProjectId ? (
        <ProjectSingle 
          projectId={selectedProjectId} 
          onBack={() => setSelectedProjectId(null)} 
        />
      ) : (
        <PortfolioLanding 
          onSelectProject={(id) => setSelectedProjectId(id)} 
        />
      )}
    </div>
  );
}

export default App;