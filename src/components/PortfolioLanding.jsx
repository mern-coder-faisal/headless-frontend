import React, { useEffect, useState } from 'react';

const PortfolioLanding = ({ onSelectProject }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form States
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [liveDemo, setLiveDemo] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [technologies, setTechnologies] = useState('');
  const [imageFile, setImageFile] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');

  // Domain & Credentials Setup
  const BASE_URL = 'https://api.weballly.com';
  const username = 'faisal'; 
  const appPassword = 'YOUR_WP_APP_PASSWORD'; // Hostinger WordPress থেকে জেনারেট করা অ্যাপ পাসওয়ার্ডটি এখানে দিন

  // Basic Auth Credentials
  const credentials = btoa(`${username}:${appPassword}`);

  // 1. Fetch Projects List
  const fetchProjects = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    } catch (err) {
      console.error('Fetch Projects Error:', err);
      setError(err.message || 'Failed to fetch projects');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // 2. Submit Project Form Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormSuccess('');

    try {
      // Step A: Upload Featured Image
      let featuredMediaId = null;
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);

        const imgRes = await fetch(`${BASE_URL}/wp-json/wp/v2/media`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
          },
          body: formData,
        });

        if (imgRes.ok) {
          const media = await imgRes.json();
          featuredMediaId = media.id;
        } else {
          console.warn('Image upload failed, proceeding without featured image.');
        }
      }

      // Step B: Create Project Post
      const postPayload = {
        title: title,
        content: content,
        status: 'publish',
        acf: {
          live_demo_url: liveDemo,
          github_url: githubUrl,
          technologies: technologies,
        },
      };

      if (featuredMediaId) {
        postPayload.featured_media = featuredMediaId;
      }

      const postRes = await fetch(`${BASE_URL}/wp-json/wp/v2/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
        },
        body: JSON.stringify(postPayload),
      });

      if (!postRes.ok) {
        const errData = await postRes.json();
        throw new Error(errData.message || 'Failed to publish project');
      }

      const newPost = await postRes.json();

      // Step C: Fallback ACF Update
      await fetch(`${BASE_URL}/wp-json/acf/v3/projects/${newPost.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
        },
        body: JSON.stringify({
          fields: {
            live_demo_url: liveDemo,
            github_url: githubUrl,
            technologies: technologies,
          },
        }),
      }).catch(() => null);

      setSubmitting(false);
      setFormSuccess('Project published successfully!');
      
      // Reset Form
      setTitle(''); 
      setContent(''); 
      setLiveDemo(''); 
      setGithubUrl(''); 
      setTechnologies(''); 
      setImageFile(null);
      
      setTimeout(() => {
        fetchProjects();
      }, 1000);

    } catch (err) {
      setSubmitting(false);
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-800">
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
            onClick={fetchProjects}
            className="text-xs font-semibold bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded transition flex items-center gap-1"
          >
            🔄 Reload
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10 font-medium text-gray-500">Loading projects...</div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">Error: {error}</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-10 text-gray-400">No projects found. Publish one below!</div>
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

      {/* Add New Project Form */}
      <section className="bg-white py-12 border-t border-gray-200">
        <div className="max-w-lg mx-auto px-4">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Add New Project</h2>
          <p className="text-xs text-gray-500 mb-6">Publish directly to api.weballly.com</p>

          {formSuccess && (
            <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-xs font-medium mb-4 border border-emerald-200">
              {formSuccess}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Title</label>
              <input 
                type="text" 
                required 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
              <textarea 
                rows="3" 
                required 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Featured Image</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => setImageFile(e.target.files[0])} 
                className="w-full text-xs p-1 border border-gray-300 rounded-lg" 
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Demo URL</label>
                <input 
                  type="url" 
                  value={liveDemo} 
                  onChange={(e) => setLiveDemo(e.target.value)} 
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">GitHub URL</label>
                <input 
                  type="url" 
                  value={githubUrl} 
                  onChange={(e) => setGithubUrl(e.target.value)} 
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Technologies</label>
              <input 
                type="text" 
                value={technologies} 
                onChange={(e) => setTechnologies(e.target.value)} 
                placeholder="React, WordPress REST API" 
                className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none" 
              />
            </div>

            <button 
              type="submit" 
              disabled={submitting} 
              className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-lg hover:bg-slate-800 transition disabled:bg-gray-400 text-sm"
            >
              {submitting ? 'Publishing...' : 'Publish Project'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default PortfolioLanding;