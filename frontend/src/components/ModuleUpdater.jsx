import React, { useState } from 'react';
import { updateFAQ } from '../services/api';
import './ModuleUpdater.css';

const ModuleUpdater = ({ module, onUpdateComplete }) => {
  const [file, setFile] = useState(null);
  const [moduleName, setModuleName] = useState(module.name);
  const [description, setDescription] = useState(module.description || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setFileName(selectedFile ? selectedFile.name : '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file');
      return;
    }
    
    setIsUpdating(true);
    setError('');
    setMessage('');
    
    try {
      const result = await updateFAQ(module.id, file, moduleName, description);
      setMessage(`Successfully updated ${result.faqs_processed} FAQs for module "${result.module_name}"`);
      setFile(null);
      setFileName('');
      
      if (onUpdateComplete) {
        setTimeout(() => onUpdateComplete(), 2000);
      }
    } catch (error) {
      setError(`Error updating module: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="module-updater">
      <div className="card">
        <h2>Update FAQ Module</h2>
        <div className="module-info">
          <span className="module-id">ID: {module.id}</span>
          <span className="module-created">Created: {new Date(module.created_at).toLocaleDateString()}</span>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="module-name">Module Name:</label>
            <input
              type="text"
              id="module-name"
              value={moduleName}
              onChange={(e) => setModuleName(e.target.value)}
              placeholder="Enter module name"
              required
              disabled={isUpdating}
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description (optional):</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter module description"
              disabled={isUpdating}
              className="form-control"
              rows="3"
            />
          </div>
          
          <div className="form-group file-input-container">
            <label htmlFor="update-file">New Excel File:</label>
            <div className="file-upload-box">
              <input 
                type="file" 
                id="update-file" 
                className="file-input"
                accept=".xlsx,.xls" 
                onChange={handleFileChange} 
                disabled={isUpdating}
              />
              <div className="file-upload-label">
                {fileName ? (
                  <span className="file-name">{fileName}</span>
                ) : (
                  <span className="upload-instruction">
                    <i className="upload-icon">📄</i>
                    Choose Excel file with Questions and Chat Bot Reply columns
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Update FAQ Module'}
            </button>
          </div>
        </form>
        
        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}
      </div>
    </div>
  );
};

export default ModuleUpdater;