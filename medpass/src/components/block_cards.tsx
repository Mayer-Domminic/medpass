'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Bar
} from 'recharts';

export interface DomainRecord {
  domain: string;
  subject: string;
  attempted: number;
  mastered: number;
}

export interface StepOverviewProps {
  data: DomainRecord[];
  onCardMouseEnter?: (domain: string) => void;
  onCardMouseLeave?: () => void;
}

const domainToSlug = (domain: string): string =>
  domain
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[\/\\]/g, '-')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

const StepOverview: React.FC<StepOverviewProps> = ({ 
  data,
  onCardMouseEnter,
  onCardMouseLeave
}) => {
  const router = useRouter();
  
  if (!data || data.length === 0) {
    return <div className="text-gray-400">No domains available</div>;
  }
  
  const byDomain = data.reduce<Record<string, DomainRecord[]>>((acc, rec) => {
    const list = (acc[rec.domain] ||= []);
    const existing = list.find(r => r.subject === rec.subject);
    if (existing) {
      existing.attempted += rec.attempted;
      existing.mastered += rec.mastered;
    } else {
      list.push({ ...rec });
    }
    return acc;
  }, {});
  
  const handleDomainClick = (domain: string) => {
    const slug = domainToSlug(domain);
    router.push(`/dashboard/domain/${slug}`);
  };
  
  return (
    <div className="grid grid-cols-3 gap-4 bg-gray-900">
      {Object.entries(byDomain).map(([domain, records]) => (
        <div 
          key={domain} 
          className="w-full bg-gray-800 rounded-xl p-4 transition-colors duration-250 hover:bg-gray-700 cursor-pointer"
          onMouseEnter={() => onCardMouseEnter?.(domain)}
          onMouseLeave={onCardMouseLeave}
          onClick={() => handleDomainClick(domain)}
        >
          <h3 className="text-xl font-bold text-white mb-2">
            {domain}
          </h3>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart
              data={records.map(r => ({
                subject: r.subject,
                Attempted: r.attempted,
                Mastered: r.mastered
              }))}
            >
              <XAxis dataKey="subject" tick={{ fontSize: 10 }} />
              <YAxis />
              <Bar
                dataKey="Attempted"
                key={`bar-attempted-${domain}`}
                fill="#4B5563" // Default gray
              />
              <Bar
                dataKey="Mastered"
                key={`bar-mastered-${domain}`}
                fill="#10B981" // Green
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
};

export default StepOverview;