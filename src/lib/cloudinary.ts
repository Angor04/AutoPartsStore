// src/lib/cloudinary.ts

// Configuración de Cloudinary para uso en el servidor
export const getCloudinaryConfig = () => {
  const cloudName = import.meta.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = import.meta.env.CLOUDINARY_API_KEY;
  const apiSecret = import.meta.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.error('Cloudinary environment variables missing:', {
      CLOUDINARY_CLOUD_NAME: cloudName ? '✓' : '✗',
      CLOUDINARY_API_KEY: apiKey ? '✓' : '✗',
      CLOUDINARY_API_SECRET: apiSecret ? '✓' : '✗',
    });
  }

  return {
    cloudName,
    apiKey,
    apiSecret,
  };
};

// Para uso en cliente
export const getCloudinaryPublicConfig = () => {
  const cloudName = import.meta.env.PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    console.error('PUBLIC_CLOUDINARY_CLOUD_NAME environment variable missing');
  }

  return {
    cloudName,
  };
};

// Helper para construir URLs de Cloudinary
export const getCloudinaryUrl = (publicId: string, options?: Record<string, any>) => {
  const { cloudName } = getCloudinaryPublicConfig();

  if (!cloudName) {
    console.error('Cannot build Cloudinary URL: cloudName missing');
    return '';
  }

  const params = new URLSearchParams();
  if (options) {
    Object.entries(options).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params.append(key, String(value));
      }
    });
  }

  const queryString = params.toString();
  const url = `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;

  return queryString ? `${url}?${queryString}` : url;
};
