// Cloudinary configuration
const CLOUDINARY_CONFIG = {
  cloud_name: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dfmg8qv7g',
  upload_preset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'SWP-EVM',
};

export const uploadImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.upload_preset);
    formData.append('cloud_name', CLOUDINARY_CONFIG.cloud_name);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud_name}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Upload failed');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
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
  uploadImage,
  deleteImage,
};
