import React, { useEffect, useState } from 'react';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // WordPress REST API Endpoint থেকে ডেটা ফেচ
    fetch('http://faisal.weballly.com/wp-json/wp/v2/projects?_embed')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center py-10 font-bold">Loading Projects...</div>;
  if (error) return <div className="text-center py-10 text-red-500 font-bold">Error: {error}</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">My Projects (REST API)</h2>
      
      {projects.length === 0 ? (
        <p className="text-gray-500">No projects found. Please add some projects in WordPress Admin.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project) => {
            // Featured Image এর URL বের করা
            const imageUrl = project._embedded?.['wp:featuredmedia']?.[0]?.source_url;

            return (
              <div key={project.id} className="p-6 bg-white rounded-lg shadow-md border border-gray-100">
                {imageUrl && (
                  <img src={imageUrl} alt={project.title.rendered} className="w-full h-48 object-cover rounded mb-4" />
                )}
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {project.title.rendered}
                </h3>
                <div 
                  className="text-gray-600 text-sm mb-4"
                  dangerouslySetInnerHTML={{ __html: project.content.rendered }} 
                />
                
                {/* ACF Custom Fields (যদি থাকে) */}
                {project.acf && (
                  <div className="flex gap-4 text-sm text-blue-600 font-medium">
                    {project.acf.live_demo_url && (
                      <a href={project.acf.live_demo_url} target="_blank" rel="noreferrer">Live Demo</a>
                    )}
                    {project.acf.github_url && (
                      <a href={project.acf.github_url} target="_blank" rel="noreferrer">Github</a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Projects;