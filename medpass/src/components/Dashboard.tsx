import Sidebar from '@/components/navbar';
import StepOverview from "@/components/block_cards";

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
      <div className="w-1/3 border-l border-gray-800 bg-gray-900" />
    </div>
  );
}
