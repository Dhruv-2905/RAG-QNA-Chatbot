import React, { useState } from 'react';
import { uploadFAQ } from '../services/api';
import './FileUploader.css';

const FileUploader = ({ onFileUploaded }) => {
  const [file, setFile] = useState(null);
  const [moduleName, setModuleName] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
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
    
    if (!file || !moduleName) {
      setError('Please select a file and enter a module name');
      return;
    }
    
    setIsUploading(true);
    setError('');
    setMessage('');
    
    try {
      const result = await uploadFAQ(file, moduleName, description);
      setMessage(`Successfully uploaded ${result.faqs_processed} FAQs for module "${result.module_name}"`);
      setFile(null);
      setFileName('');
      setModuleName('');
      setDescription('');
      
      if (onFileUploaded) {
        setTimeout(() => onFileUploaded(), 2000);
      }
    } catch (error) {
      setError(`Error uploading file: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="file-uploader">
      <div className="card">
        <h2>Upload New FAQ Module</h2>
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
              disabled={isUploading}
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
              disabled={isUploading}
              className="form-control"
              rows="3"
            />
          </div>
          
          <div className="form-group file-input-container">
            <label htmlFor="file">Excel File:</label>
            <div className="file-upload-box">
              <input 
                type="file" 
                id="file" 
                className="file-input"
                accept=".xlsx,.xls" 
                onChange={handleFileChange} 
                disabled={isUploading}
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
            <button type="submit" className="btn-primary" disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Upload FAQ Module'}
            </button>
          </div>
        </form>
        
        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}
      </div>
    </div>
  );
};

export default FileUploader;