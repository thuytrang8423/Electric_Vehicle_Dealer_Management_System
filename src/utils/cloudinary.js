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
  
      console.log('Uploading to Cloudinary:', {
        cloud_name: CLOUDINARY_CONFIG.cloud_name,
        upload_preset: CLOUDINARY_CONFIG.upload_preset,
        resource_type: rt,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type
      });
  
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: { message: errorText || 'Upload failed' } };
        }
        console.error('Cloudinary upload error:', errorData);
        throw new Error(errorData.error?.message || errorData.message || `Upload failed: ${response.status} ${response.statusText}`);
      }
  
      const data = await response.json();
      console.log('Cloudinary upload success:', {
        public_id: data.public_id,
        secure_url: data.secure_url,
        url: data.url,
        format: data.format
      });
      
      // Return full data so caller can store public_id + resource_type etc.
      return data;
    } catch (error) {
      console.error('Error uploading file to Cloudinary:', error);
      throw error;
    }
  };

  export const uploadImage = async (file) => {
    const data = await uploadFile(file, 'image');
    // Return secure_url for image uploads
    return data.secure_url || data.url || '';
  };

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
