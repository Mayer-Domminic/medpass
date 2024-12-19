'use client';

import NetIDVerification from '@/components/auth/NetIDVerification';
import { useAuth0 } from '@auth0/auth0-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function VerifyNetIDPage() {
  const { isAuthenticated, isLoading } = useAuth0();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading state or return to login if not authenticated
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return <NetIDVerification />;
}