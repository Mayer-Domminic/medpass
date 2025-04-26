import Sidebar from '@/components/navbar';
import StepOverview from "@/components/block_cards";
import SystemsViewer, { SystemName, AVAILABLE_SYSTEMS } from './SystemsViewer';
import { useState } from 'react';
export interface DomainRecord {
  domain: string;
  subject: string;
  attempted: number;
  mastered: number;
}
interface DashboardProps {
  domainData: DomainRecord[];
}
export function Dashboard({ domainData }: DashboardProps) {
  // State to track which systems should be highlighted
  // For demo purposes, initially highlighting cardiovascular and nervous systems
  const [highlightedSystems, setHighlightedSystems] = useState<SystemName[]>(['cardiovascular', 'nervous']);
 
  return (
    <div className="min-h-screen bg-gray-900 text-foreground flex">
      <Sidebar />
      <div className="w-2/3 pl-[72px] bg-gray-900">
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-8 text-white">
            USMLE Step 1
          </h1>
          <StepOverview data={domainData} />
        </div>
      </div>
      <div className="w-1/3 border-l border-gray-800 bg-gray-900">
        <div className="p-6 flex flex-col h-screen">
          <h2 className="text-3xl font-bold mb-4 text-center text-white">Systems Viewer</h2>
          <div className="flex-grow overflow-auto">
            <SystemsViewer
              highlightedSystems={highlightedSystems}
              className="h-full w-full"
            />
          </div>
          <div className="mt-4 text-center text-white">
            <span>{highlightedSystems.length} Systems Highlighted</span>
          </div>
        </div>
      </div>
    </div>
  );
}