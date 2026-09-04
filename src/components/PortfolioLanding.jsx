import React, { useEffect, useState } from 'react';

const PortfolioLanding = ({ onSelectProject }) => {
  // LocalStorage cache for 0.01s Instant Loading
  const [projects, setProjects] = useState(() => {
    const cachedProjects = localStorage.getItem('portfolio_projects_cache');
    return cachedProjects ? JSON.parse(cachedProjects) : [];
  });

  // Show spinner only if there is no cache available at all
  const [loading, setLoading] = useState(() => {
    const cachedProjects = localStorage.getItem('portfolio_projects_cache');
    return !cachedProjects;
  });

  const [error, setError] = useState(null);

  // Environment Variables
  const BASE_URL = import.meta.env.VITE_WP_BASE_URL;
  const username = import.meta.env.VITE_WP_USERNAME;
  const appPassword = import.meta.env.VITE_WP_APP_PASSWORD;

  // Encode Basic Auth Token
  const credentials = btoa(`${username}:${appPassword}`);

  // Fetch Projects List with Stale-While-Revalidate Pattern
  const fetchProjects = async (isManualReload = false) => {
    try {
      if (isManualReload || !projects.length) {
        setLoading(true);
      }
      setError(null);

      const res = await fetch(`${BASE_URL}/wp-json/wp/v2/projects?_embed&_t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Basic ${credentials}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Server returned status: ${res.status}`);
      }

      const data = await res.json();
      setProjects(data);
      
      // Save data into Local Storage Cache
      localStorage.setItem('portfolio_projects_cache', JSON.stringify(data));
    } catch (err) {
      console.error('Fetch Projects Error:', err);
      if (!projects.length) {
        setError(err.message || 'Failed to fetch projects');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-800 flex flex-col justify-between">
      <div>
        {/* Top Header */}
        <header className="bg-slate-900 text-white py-14 px-4 text-center shadow-lg">
          <h1 className="text-4xl font-black mb-2">Faisal Ahmed</h1>
          <p className="text-slate-400 max-w-lg mx-auto text-sm">Headless WordPress Developer Portfolio</p>
        </header>

        {/* Projects Showcase */}
        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Projects</h2>
            <button 
              onClick={() => fetchProjects(true)}
              className="text-xs font-semibold bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded transition flex items-center gap-1"
            >
              🔄 Reload
            </button>
          </div>

          {loading && projects.length === 0 ? (
            <div className="text-center py-10 font-medium text-gray-500">Loading projects...</div>
          ) : error && projects.length === 0 ? (
            <div className="text-center py-10 text-red-500">Error: {error}</div>
          ) : projects.length === 0 ? (
            <div className="text-center py-10 text-gray-400">No published projects found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((item) => {
                const image = item._embedded?.['wp:featuredmedia']?.[0]?.source_url || 'https://via.placeholder.com/600x400?text=No+Image';
                const acf = item.acf || {};

                return (
                  <div key={item.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col justify-between">
                    <div>
                      <img src={image} alt={item.title?.rendered || 'Project'} className="w-full h-44 object-cover" />
                      <div className="p-5">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title?.rendered}</h3>
                        <div 
                          className="text-gray-600 text-xs mb-4 line-clamp-3"
                          dangerouslySetInnerHTML={{ __html: item.content?.rendered || '' }}
                        />
                        {acf.technologies && (
                          <span className="inline-block bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded">
                            {acf.technologies}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-5 pt-0 border-t border-gray-100 mt-3 flex justify-between items-center text-xs font-medium">
                      <button onClick={() => onSelectProject && onSelectProject(item.id)} className="text-indigo-600 font-semibold hover:underline">
                        Details →
                      </button>
                      <div className="flex gap-3">
                        {acf.live_demo_url && <a href={acf.live_demo_url} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline">Demo</a>}
                        {acf.github_url && <a href={acf.github_url} target="_blank" rel="noreferrer" className="text-gray-600 hover:underline">Code</a>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Footer Component */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-8 px-4 mt-12 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p className="font-bold text-slate-200 text-sm">Faisal Ahmed</p>
            <p className="text-slate-500 mt-0.5">Specialized in Headless WordPress & MERN Development</p>
          </div>
          
          <div className="flex items-center gap-6 font-medium">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-white transition">GitHub</a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-white transition">LinkedIn</a>
            <a href="mailto:contact@example.com" className="hover:text-white transition">Email</a>
          </div>

          <div className="text-slate-500">
            © {new Date().getFullYear()} All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PortfolioLanding;