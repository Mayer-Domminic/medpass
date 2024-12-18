import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const Dashboard = () => {
  const { isAuthenticated, user, getAccessTokenSilently } = useAuth0();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  // Example of making an authenticated API call
  const fetchProtectedData = async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch('your-api-endpoint', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dashboard />
  );
};