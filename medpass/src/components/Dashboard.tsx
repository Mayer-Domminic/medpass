"use client"

import React from 'react';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/lib/auth/context';
import Sidebar from '@/components/jake-comp/navbar';
import StepOverview from '@/components/jake-comp/block_cards';
import StudyAnalytics from '@/components/jake-comp/analytics';
import UpcomingTasks from '@/components/jake-comp/upcoming_tasks';
import StudyResources from '@/components/jake-comp/study_resources';
import AnatomyViewer from '@/components/nolan-comp/AnatomyViewer';

export const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar />
      <main className="flex-1 p-8 ml-[72px]">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl text-white">Dashboard</h1>
            <p className="text-gray-400">Welcome back, {user?.username}</p>
          </div>
          <Button
            variant="outline"
            className="bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"
            onClick={logout}
          >
            Logout
          </Button>
        </div>
        <div className="max-w-7xl mx-auto space-y-8">
          <StepOverview />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <StudyAnalytics />
            <UpcomingTasks />
          </div>
          <StudyResources />
        </div>
        <div className="max-w-7xl mx-auto space-y-8">
        <AnatomyViewer />
        </div>
      </main>
    </div>
  );
};