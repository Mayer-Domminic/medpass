import { useAuth0 } from '@auth0/auth0-react';

export function useAuthApi() {
  const { getAccessTokenSilently } = useAuth0();

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = await getAccessTokenSilently();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    return response.json();
  };

  return { fetchWithAuth };
}