import React, { useEffect, useState } from 'react';

const AdminDashboard = () => {
  // Authentication States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // UI States
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'projects' | 'users' | 'settings'
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Project States
  const [projects, setProjects] = useState(() => {
    const cached = localStorage.getItem('cached_projects');
    return cached ? JSON.parse(cached) : [];
  });
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('any');

  // Form & Edit States
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [liveDemo, setLiveDemo] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [technologies, setTechnologies] = useState('');
  const [postStatus, setPostStatus] = useState('publish');
  const [imageFile, setImageFile] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');

  // Env Configs
  const BASE_URL = import.meta.env.VITE_WP_BASE_URL;
  const username = import.meta.env.VITE_WP_USERNAME;
  const appPassword = import.meta.env.VITE_WP_APP_PASSWORD;
  
  const ADMIN_USER = import.meta.env.VITE_ADMIN_USER || 'admin';
  const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASS || '123456';

  const credentials = btoa(`${username}:${appPassword}`);

  // Auth Check
  useEffect(() => {
    if (localStorage.getItem('isAdminLoggedIn') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginUser === ADMIN_USER && loginPass === ADMIN_PASS) {
      setIsAuthenticated(true);
      localStorage.setItem('isAdminLoggedIn', 'true');
      setLoginError('');
    } else {
      setLoginError('Invalid credentials!');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAdminLoggedIn');
  };

  // Optimized Fetching with Local Storage Cache
  const fetchProjects = async () => {
    try {
      if (!projects.length) setLoading(true);
      const res = await fetch(
        `${BASE_URL}/wp-json/wp/v2/projects?status=${statusFilter}&_embed&per_page=100&_t=${Date.now()}`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Basic ${credentials}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        localStorage.setItem('cached_projects', JSON.stringify(data));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated, statusFilter]);

  // Populate form for editing
  const handleEditClick = (item) => {
    setEditingId(item.id);
    setTitle(item.title?.rendered || '');
    setContent(item.content?.rendered?.replace(/<[^>]+>/g, '') || '');
    setLiveDemo(item.acf?.live_demo_url || '');
    setGithubUrl(item.acf?.github_url || '');
    setTechnologies(item.acf?.technologies || '');
    setPostStatus(item.status || 'publish');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setLiveDemo('');
    setGithubUrl('');
    setTechnologies('');
    setPostStatus('publish');
    setImageFile(null);
  };

  // Create or Update Project
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormSuccess('');

    try {
      let featuredMediaId = null;

      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);

        const imgRes = await fetch(`${BASE_URL}/wp-json/wp/v2/media`, {
          method: 'POST',
          headers: { 'Authorization': `Basic ${credentials}` },
          body: formData,
        });

        if (imgRes.ok) {
          const media = await imgRes.json();
          featuredMediaId = media.id;
        }
      }

      const postPayload = {
        title,
        content,
        status: postStatus,
        acf: { live_demo_url: liveDemo, github_url: githubUrl, technologies },
      };

      if (featuredMediaId) {
        postPayload.featured_media = featuredMediaId;
      }

      const url = editingId 
        ? `${BASE_URL}/wp-json/wp/v2/projects/${editingId}`
        : `${BASE_URL}/wp-json/wp/v2/projects`;

      const method = editingId ? 'POST' : 'POST'; // WP REST API accepts POST for updates

      const postRes = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
        },
        body: JSON.stringify(postPayload),
      });

      if (!postRes.ok) throw new Error('API Request Failed');

      setFormSuccess(editingId ? 'Project updated successfully!' : 'Project created successfully!');
      resetForm();
      fetchProjects();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Project
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;

    try {
      const res = await fetch(`${BASE_URL}/wp-json/wp/v2/projects/${id}?force=true`, {
        method: 'DELETE',
        headers: { 'Authorization': `Basic ${credentials}` },
      });

      if (res.ok) {
        setProjects(projects.filter((p) => p.id !== id));
      }
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  // Analytics Metrics
  const totalProjects = projects.length;
  const publishedCount = projects.filter((p) => p.status === 'publish').length;
  const draftCount = projects.filter((p) => p.status === 'draft').length;
  const pendingCount = projects.filter((p) => p.status === 'pending').length;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700 text-white">
          <h2 className="text-2xl font-bold text-center mb-1">Admin Portal</h2>
          <p className="text-xs text-slate-400 text-center mb-6">Enter credentials to proceed</p>

          {loginError && <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-xs mb-4 text-center border border-red-500/20">{loginError}</div>}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-300">Username</label>
              <input type="text" required value={loginUser} onChange={(e) => setLoginUser(e.target.value)} className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-300">Password</label>
              <input type="password" required value={loginPass} onChange={(e) => setLoginPass(e.target.value)} className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500" />
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-lg text-sm transition">Login</button>
          </form>
        </div>
      </div>
    );
  }

  const bgTheme = isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800';
  const cardTheme = isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';

  return (
    <div className={`min-h-screen font-sans flex ${bgTheme}`}>
      {/* Sidebar Navigation */}
      <aside className={`w-64 border-r flex flex-col justify-between ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div>
          <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
            <h1 className="font-black text-xl tracking-wide text-indigo-500">CONTROL HUB</h1>
          </div>
          <nav className="p-4 space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '📊' },
              { id: 'projects', label: 'Projects', icon: '📁' },
              { id: 'users', label: 'Users', icon: '👥' },
              { id: 'settings', label: 'Settings', icon: '⚙️' },
            ].map((menu) => (
              <button
                key={menu.id}
                onClick={() => setActiveTab(menu.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition ${
                  activeTab === menu.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'hover:bg-slate-800/20 text-slate-400'
                }`}
              >
                <span>{menu.icon}</span>
                <span>{menu.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Dark Mode Toggle & Logout */}
        <div className="p-4 border-t border-slate-800/50 space-y-2">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold bg-slate-800/40 text-slate-300 hover:bg-slate-800"
          >
            <span>Theme Mode</span>
            <span>{isDarkMode ? '🌙 Dark' : '☀️ Light'}</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white text-xs font-bold py-2.5 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 overflow-y-auto">
        <header className={`p-6 border-b flex justify-between items-center ${cardTheme}`}>
          <h2 className="text-xl font-bold capitalize">{activeTab} View</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-indigo-500/10 text-indigo-500 font-bold px-3 py-1 rounded-full border border-indigo-500/20">
              API Live Connected
            </span>
          </div>
        </header>

        <div className="p-8">
          {/* TAB 1: DASHBOARD VIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Total Projects', value: totalProjects, color: 'border-indigo-500' },
                  { label: 'Published', value: publishedCount, color: 'border-emerald-500' },
                  { label: 'Drafts', value: draftCount, color: 'border-amber-500' },
                  { label: 'Pending Review', value: pendingCount, color: 'border-blue-500' },
                ].map((stat, idx) => (
                  <div key={idx} className={`p-6 rounded-2xl border-l-4 border ${cardTheme} ${stat.color} shadow-sm`}>
                    <p className="text-xs text-slate-400 font-semibold">{stat.label}</p>
                    <h3 className="text-3xl font-black mt-2">{stat.value}</h3>
                  </div>
                ))}
              </div>

              {/* Graphical Overview */}
              <div className={`p-6 rounded-2xl border ${cardTheme}`}>
                <h3 className="text-sm font-bold mb-6">Status Overview Graph</h3>
                <div className="h-48 flex items-end justify-around gap-4 pt-8 px-4 border-b border-slate-700/30">
                  <div className="flex flex-col items-center gap-2 w-20">
                    <div className="bg-emerald-500 w-full rounded-t-lg transition-all duration-500" style={{ height: `${(publishedCount / (totalProjects || 1)) * 120 + 10}px` }}></div>
                    <span className="text-[10px] font-bold text-slate-400">Published ({publishedCount})</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 w-20">
                    <div className="bg-amber-500 w-full rounded-t-lg transition-all duration-500" style={{ height: `${(draftCount / (totalProjects || 1)) * 120 + 10}px` }}></div>
                    <span className="text-[10px] font-bold text-slate-400">Drafts ({draftCount})</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 w-20">
                    <div className="bg-blue-500 w-full rounded-t-lg transition-all duration-500" style={{ height: `${(pendingCount / (totalProjects || 1)) * 120 + 10}px` }}></div>
                    <span className="text-[10px] font-bold text-slate-400">Pending ({pendingCount})</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROJECTS VIEW */}
          {activeTab === 'projects' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form Section (Add / Edit) */}
              <div className="lg:col-span-1">
                <div className={`p-6 rounded-2xl border ${cardTheme} sticky top-6 shadow-sm`}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold">{editingId ? 'Edit Project' : 'Add New Project'}</h3>
                    {editingId && (
                      <button onClick={resetForm} className="text-xs text-red-400 hover:underline">Cancel</button>
                    )}
                  </div>

                  {formSuccess && <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-lg text-xs mb-4 border border-emerald-500/20 font-medium">{formSuccess}</div>}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1">Title</label>
                      <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className={`w-full p-2.5 rounded-lg text-xs border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-300'}`} />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1">Description</label>
                      <textarea rows="3" required value={content} onChange={(e) => setContent(e.target.value)} className={`w-full p-2.5 rounded-lg text-xs border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-300'}`}></textarea>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1">Status</label>
                      <select value={postStatus} onChange={(e) => setPostStatus(e.target.value)} className={`w-full p-2.5 rounded-lg text-xs border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-300'}`}>
                        <option value="publish">Publish</option>
                        <option value="draft">Draft</option>
                        <option value="pending">Pending Review</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1">Image {editingId && '(Optional to replace)'}</label>
                      <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="w-full text-xs" />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold mb-1">Demo URL</label>
                        <input type="url" value={liveDemo} onChange={(e) => setLiveDemo(e.target.value)} className={`w-full p-2 rounded-lg text-xs border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-300'}`} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1">Code URL</label>
                        <input type="url" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} className={`w-full p-2 rounded-lg text-xs border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-300'}`} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1">Technologies</label>
                      <input type="text" value={technologies} onChange={(e) => setTechnologies(e.target.value)} placeholder="React, Node.js" className={`w-full p-2 rounded-lg text-xs border outline-none ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-300'}`} />
                    </div>

                    <button type="submit" disabled={submitting} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-lg text-xs transition">
                      {submitting ? 'Saving...' : editingId ? 'Update Project' : 'Publish Project'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Table Section */}
              <div className="lg:col-span-2 space-y-4">
                <div className={`p-4 rounded-2xl border flex justify-between items-center ${cardTheme}`}>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`p-2 rounded-lg text-xs font-semibold border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-300'}`}>
                    <option value="any">All Status</option>
                    <option value="publish">Published</option>
                    <option value="draft">Draft</option>
                    <option value="pending">Pending</option>
                  </select>
                  <button onClick={fetchProjects} className="text-xs bg-indigo-600/10 text-indigo-500 px-3 py-1.5 rounded-lg font-bold">🔄 Refresh Data</button>
                </div>

                <div className={`p-6 rounded-2xl border ${cardTheme} overflow-x-auto`}>
                  {loading && !projects.length ? (
                    <p className="text-center text-xs py-8">Fetching projects...</p>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-700/20 text-slate-400 font-bold uppercase">
                          <th className="py-3 px-2">Image</th>
                          <th className="py-3 px-2">Title</th>
                          <th className="py-3 px-2">Status</th>
                          <th className="py-3 px-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/10">
                        {projects.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-500/5">
                            <td className="py-3 px-2">
                              <img src={item._embedded?.['wp:featuredmedia']?.[0]?.source_url || 'https://via.placeholder.com/50'} className="w-10 h-8 object-cover rounded-md" alt="" />
                            </td>
                            <td className="py-3 px-2 font-bold">{item.title?.rendered}</td>
                            <td className="py-3 px-2">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                item.status === 'publish' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                              }`}>{item.status}</span>
                            </td>
                            <td className="py-3 px-2 text-right space-x-2">
                              <button onClick={() => handleEditClick(item)} className="bg-indigo-500/10 text-indigo-500 font-bold px-2 py-1 rounded">Edit</button>
                              <button onClick={() => handleDelete(item.id)} className="bg-red-500/10 text-red-500 font-bold px-2 py-1 rounded">Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: USERS VIEW */}
          {activeTab === 'users' && (
            <div className={`p-6 rounded-2xl border ${cardTheme}`}>
              <h3 className="text-sm font-bold mb-4">User Access Directory</h3>
              <p className="text-xs text-slate-400">Current active session administrator: <span className="text-indigo-400 font-bold">{ADMIN_USER}</span></p>
            </div>
          )}

          {/* TAB 4: SETTINGS VIEW */}
          {activeTab === 'settings' && (
            <div className={`p-6 rounded-2xl border ${cardTheme} space-y-4 max-w-xl`}>
              <h3 className="text-sm font-bold">API Configurations</h3>
              <div>
                <label className="block text-xs font-semibold text-slate-400">Endpoint URL</label>
                <input type="text" disabled value={BASE_URL} className="w-full p-2.5 rounded-lg text-xs bg-slate-800/30 border border-slate-700/50 mt-1" />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;