'use client';

import { useAuth } from '@/hooks/useAuth';
import { LogoutButton } from '@/components/LogoutButton';

export function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, {user?.net_id}!
            </h1>
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  );
}