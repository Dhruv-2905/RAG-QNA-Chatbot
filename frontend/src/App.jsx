import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import FileUploader from './components/FileUploader';
import ModulesList from './components/ModulesList';
import ModuleUpdater from './components/ModuleUpdater';
import './App.css';

// Define the context path as a constant
const CONTEXT_PATH = '/internal/admin';

function App() {
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('list'); // 'list', 'upload', 'update'

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const fetchModules = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/modules/`);
      if (!response.ok) {
        throw new Error('Failed to fetch modules');
      }
      const data = await response.json();
      setModules(data);
    } catch (error) {
      console.error('Error fetching modules:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const handleFileUploaded = () => {
    fetchModules();
    setView('list');
  };

  const handleModuleSelect = (module) => {
    setSelectedModule(module);
    setView('update');
  };

  const handleBackToList = () => {
    setSelectedModule(null);
    setView('list');
  };

  // Main component content
  const AppContent = () => (
    <div className="app">
      <header className="app-header">
        <h1>FAQ Manager</h1>
        <div className="nav-buttons">
          {view !== 'list' && (
            <button 
              className="nav-button"
              onClick={handleBackToList}
            >
              ← Back to Modules
            </button>
          )}
          {view === 'list' && (
            <button 
              className="nav-button primary"
              onClick={() => setView('upload')}
            >
              + New Module
            </button>
          )}
        </div>
      </header>

      <main className="app-content">
        {loading && <div className="loading">Loading...</div>}
        
        {!loading && view === 'list' && (
          <ModulesList 
            modules={modules} 
            onModuleSelect={handleModuleSelect}
          />
        )}
        
        {view === 'upload' && (
          <FileUploader onFileUploaded={handleFileUploaded} />
        )}
        
        {view === 'update' && selectedModule && (
          <ModuleUpdater 
            module={selectedModule} 
            onUpdateComplete={handleFileUploaded}
          />
        )}
      </main>
      
      <footer className="app-footer">
        <p>FAQ Chatbot Administration Panel</p>
      </footer>
    </div>
  );

  return (
    <Router basename={CONTEXT_PATH}>
      <Routes>
        <Route path="/" element={<AppContent />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;