import { useEffect, useState } from 'react';
import Sidebar from '@/components/navbar';
import StepOverview from '@/components/block_cards';

export const dynamic = 'force-dynamic';

export function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-900 text-foreground flex">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area (2/3 width) */}
      <div className="w-2/3 pl-[72px] bg-gray-900">
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-8 text-white">USMLE Step 1</h1>
          <StepOverview />
        </div>
      </div>

      {/* Right Container (1/3 width) */}
      <div className="w-1/3 border-l border-gray-800 bg-gray-900">
        {/* Content for right container will go here */}
      </div>
    </div>
  );
}

export default Dashboard;