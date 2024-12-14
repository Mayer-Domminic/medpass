import React from 'react';
import Sidebar from '@/components/jake-comp/navbar';
import StepOverview from '@/components/jake-comp/block_cards';
import StudyAnalytics from '@/components/jake-comp/analytics';
import UpcomingTasks from '@/components/jake-comp/upcoming_tasks';
import StudyResources from '@/components/jake-comp/study_resources';

const Dashboard = () => {
  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 ml-[72px]">
        <div className="max-w-7xl mx-auto space-y-8">
          <StepOverview />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <StudyAnalytics />
            <UpcomingTasks />
          </div>
          <StudyResources />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;