export const API_CONFIG = {
    USE_HTTPS: process.env.NEXT_PUBLIC_USE_HTTPS === 'true',
    API_DOMAIN: process.env.NEXT_PUBLIC_API_DOMAIN || 'api.medpass.unr.dev',
    API_VERSION: 'v1',
  };
  
  export const getApiUrl = () => {
    const protocol = API_CONFIG.USE_HTTPS ? 'https' : 'http';
    return `${protocol}://${API_CONFIG.API_DOMAIN}/api/${API_CONFIG.API_VERSION}`;
  };

  // TODO DEV CHANGE THIS TO LOCAL WHEN DEVELOPING 'http://localhost:8000/api/v1';