import React, { useState } from 'react';
import PortfolioLanding from './components/PortfolioLanding';
import ProjectSingle from './components/ProjectSingle';

function App() {
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  return (
    <div>
      {selectedProjectId ? (
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