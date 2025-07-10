const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

export const uploadFAQ = async (file, moduleName, description) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('module_name', moduleName);
  
  if (description) {
    formData.append('module_description', description);
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/upload-faq/`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to upload FAQ');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error uploading FAQ:', error);
    throw error;
  }
};

export const updateFAQ = async (moduleId, file, moduleName, description) => {
  const formData = new FormData();
  formData.append('file', file);
  
  if (moduleName) {
    formData.append('module_name', moduleName);
  }
  
  if (description !== undefined) {
    formData.append('module_description', description);
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/update-faq/${moduleId}`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update FAQ');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating FAQ:', error);
    throw error;
  }
};

export const fetchModules = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/modules/`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch modules');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching modules:', error);
    throw error;
  }
};