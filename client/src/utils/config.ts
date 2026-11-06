const baseUrl = import.meta.env.VITE_BASE_URL?.trim();

if (!baseUrl) {
  throw new Error('VITE_BASE_URL must be set to the API base URL, including /api/v1.');
}

const parsedBaseUrl = new URL(baseUrl);
if (!parsedBaseUrl.pathname.replace(/\/+$/, '').endsWith('/api/v1')) {
  throw new Error('VITE_BASE_URL must include the /api/v1 path.');
}
if (import.meta.env.PROD && parsedBaseUrl.protocol !== 'https:') {
  throw new Error('VITE_BASE_URL must use HTTPS in production.');
}

export const config = {
  baseUrl: parsedBaseUrl.toString().replace(/\/+$/, ''),
  VITE_CLOUDINARY_CLOUD_NAME: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  VITE_CLOUDINARY_UPLOAD_PRESET: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
}