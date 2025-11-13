  // Cloudinary configuration
  const CLOUDINARY_CONFIG = {
    cloud_name: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dfmg8qv7g',
    upload_preset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'SWP-EVM',
  };
  
  const mapResourceType = (resourceType) => {
    if (!resourceType || resourceType === 'auto') return 'image';
    return resourceType; // 'image' | 'raw' | 'video' etc.
  };
  
  export const uploadFile = async (file, resourceType = 'auto') => {
    try {
      const rt = mapResourceType(resourceType);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_CONFIG.upload_preset);
      // Important: send resource_type to Cloudinary
      formData.append('resource_type', rt);
  
      // choose endpoint based on resource_type
      const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud_name}/${rt}/upload`;
  
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Upload failed');
      }
  
      const data = await response.json();
      // Return full data so caller can store public_id + resource_type etc.
      return data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  export const uploadImage = async (file) => uploadFile(file, 'image');

  export const deleteImage = async (publicId) => {
    try {
      // Note: Deleting images requires server-side implementation
      // For now, we'll just log the public ID
      console.log('Image to delete:', publicId);
      return { result: 'ok' };
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  };

  export default {
    uploadFile,
    uploadImage,
    deleteImage,
  };
