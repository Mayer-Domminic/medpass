'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { isAuthenticated, isLoading, checkAuth } = useAuth();
  const router = useRouter();

  // Run checkAuth only on mount
  useEffect(() => {
    const authenticateUser = async () => {
      await checkAuth();  // Check auth status after loading
    };
    
    authenticateUser();
  }, [checkAuth]);

  // Render loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If authenticated, navigate to the Dashboard
  if (isAuthenticated) {
    router.push('/dashboard');
    return null;  // Optionally show a loading screen here
  }

  // If not authenticated, you could render a message or a redirect to login page
  router.push('/auth/login');
  return null;
}
