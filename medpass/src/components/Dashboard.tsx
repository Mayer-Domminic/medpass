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

// mapping of domains to systems
const DOMAIN_TO_SYSTEMS: Record<string, SystemName[]> = {
  "Human Development": ["reproductive", "endocrine"],
  "Biostatistics & Epidemiology/Population Health": [],
  "Social Sciences: Communication and Interpersonal Skills": ["nervous", "endocrine"],
  "Cardiovascular System": ["cardiovascular"],
  "Respiratory & Renal/Urinary Systems": ["respiratory", "urinary"],
  "Gastrointestinal System": ["digestive"],
  "Reproductive & Endocrine Systems": ["reproductive", "endocrine"],
  "Musculoskeletal, Skin & Subcutaneous Tissue": ["muscular", "skeletal", "integumentary"],
  "Behavioral Health & Nervous Systems/Special Senses": ["nervous"],
  "Blood & Lymphoreticular/Immune Systems": ["lymphatic", "cardiovascular"],
  "Multisystem Processes & Disorders": [...AVAILABLE_SYSTEMS]
};

export function Dashboard({ domainData }: DashboardProps) {

  const [highlightedSystems, setHighlightedSystems] = useState<SystemName[]>([]);
 
  // handle mouse hover
  const handleMouseEnter = (domain: string) => {
    const systemsToHighlight = DOMAIN_TO_SYSTEMS[domain] || [];
    setHighlightedSystems(systemsToHighlight);
  };

  // handle mouse leave
  const handleMouseLeave = () => {
    setHighlightedSystems([]);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-foreground flex">
      <Sidebar />
      <div className="w-2/3 pl-[72px] bg-gray-900">
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-8 text-white">
            USMLE Step 1
          </h1>
          <StepOverview 
            data={domainData}
            onCardMouseEnter={handleMouseEnter}
            onCardMouseLeave={handleMouseLeave}
          />
        </div>
      </div>
      <div className="w-1/3 border-l border-gray-800 bg-gray-900">
        <div className="p-6 flex flex-col h-screen">
          <h2 className="text-4xl font-bold mb-2 text-center text-white">Systems Viewer</h2>
          <div className="flex-grow overflow-auto">
            <SystemsViewer
              highlightedSystems={highlightedSystems}
              className="h-full w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}