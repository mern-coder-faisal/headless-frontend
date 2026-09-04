import React, { useEffect, useState } from 'react';

const ProjectSingle = ({ projectId, onBack }) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const BASE_URL = import.meta.env.VITE_WP_API_URL || 'https://faisal.weballly.com';

  useEffect(() => {
    fetch(`${BASE_URL}/wp-json/wp/v2/projects/${projectId}?_embed`)
      .then((res) => res.json())
      .then((data) => {
        setProject(data);
        setLoading(false);
      });
  }, [projectId, BASE_URL]);

  if (loading) return <div className="text-center py-20 font-bold">Loading Project Details...</div>;

  const image = project._embedded?.['wp:featuredmedia']?.[0]?.source_url || 'https://via.placeholder.com/800x400';
  const acf = project.acf || {};

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 font-sans">
      <button onClick={onBack} className="mb-6 text-indigo-600 font-bold hover:underline flex items-center gap-2">
        ← Back to Projects
      </button>

      <img src={image} alt={project.title.rendered} className="w-full h-96 object-cover rounded-xl shadow-md mb-8" />

      <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">{project.title.rendered}</h1>

      {acf.technologies && (
        <span className="inline-block text-xs font-semibold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-md border border-indigo-100 mb-6">
          Tech Stack: {acf.technologies}
        </span>
      )}

      <div 
        className="text-gray-700 leading-relaxed mb-8 text-lg"
        dangerouslySetInnerHTML={{ __html: project.content.rendered }}
      />

      <div className="flex gap-4 pt-6 border-t">
        {acf.live_demo_url && (
          <a href={acf.live_demo_url} target="_blank" rel="noreferrer" className="bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-lg hover:bg-indigo-700">
            Live Demo 🔗
          </a>
        )}
        {acf.github_url && (
          <a href={acf.github_url} target="_blank" rel="noreferrer" className="bg-gray-800 text-white font-bold px-6 py-2.5 rounded-lg hover:bg-gray-900">
            GitHub Code 💻
          </a>
        )}
      </div>
    </div>
  );
};

export default ProjectSingle;