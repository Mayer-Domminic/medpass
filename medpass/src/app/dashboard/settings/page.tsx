import { Suspense } from 'react';
import Sidebar from '@/components/navbar';
import SettingsContent from '@/components/settings/SettingsContent';

const SettingsPageSkeleton = () => (
  <div className="min-h-screen bg-gray-900 text-slate-100">
    <Sidebar />
    <div className="pl-[72px]">
      <div className="container mx-auto py-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-9 w-40 bg-gray-800 rounded-md"></div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Nav skeleton */}
          <div className="col-span-3">
            <div className="space-y-2">
              <div className="h-10 bg-gray-800 rounded-md animate-pulse"></div>
              <div className="h-10 bg-gray-800 rounded-md animate-pulse"></div>
              <div className="h-10 bg-gray-800 rounded-md animate-pulse"></div>
            </div>
          </div>

          {/* Content skeleton */}
          <div className="col-span-9">
            <div className="h-96 bg-gray-800 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-slate-100">
      <Suspense fallback={<SettingsPageSkeleton />}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}