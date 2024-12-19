import { useAuth0 } from '@auth0/auth0-react';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const {
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout,
    user,
    getAccessTokenSilently
  } = useAuth0();
  const router = useRouter();

  const login = () => loginWithRedirect();

  const logoutUser = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const getToken = async () => {
    try {
      return await getAccessTokenSilently();
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  };

  return {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout: logoutUser,
    getToken
  };
}