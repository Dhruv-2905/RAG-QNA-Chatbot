import React from 'react';
import './ModulesList.css';

const ModulesList = ({ modules, onModuleSelect }) => {
  if (modules.length === 0) {
    return (
      <div className="modules-list empty">
        <div className="empty-state">
          <i className="empty-icon">📁</i>
          <h3>No FAQ Modules Found</h3>
          <p>Start by creating a new FAQ module.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modules-list">
      <h2>FAQ Modules</h2>
      <div className="modules-grid">
        {modules.map(module => (
          <div 
            key={module.id} 
            className="module-card"
            onClick={() => onModuleSelect(module)}
          >
            <div className="module-card-header">
              <h3>{module.name}</h3>
              <span className="module-date">
                {new Date(module.created_at).toLocaleDateString()}
              </span>
            </div>
            
            <div className="module-card-body">
              {module.description ? (
                <p>{module.description}</p>
              ) : (
                <p className="no-description">No description provided</p>
              )}
            </div>
            
            <div className="module-card-footer">
              <button className="btn-secondary">Update</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModulesList;