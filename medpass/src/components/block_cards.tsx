'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Bar,
  Tooltip
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

  const getTitleClass = (domain: string) => {
    if (domain.length < 20) return "text-lg";
    if (domain.length < 35) return "text-base";
    return "text-sm";
  };

  const getDynamicBarSize = (count: number) => {
    if (count <= 3) return 30;
    if (count <= 6) return 20;
    return 14;
  };
  
  return (
    <div className="grid grid-cols-3 gap-4 bg-gray-900 p-4">
      {Object.entries(byDomain).map(([domain, records]) => (
        <div 
          key={domain} 
          className="w-full bg-gray-800 rounded-xl p-4 flex flex-col justify-between hover:bg-gray-700 cursor-pointer transition-colors duration-250"
          onMouseEnter={() => onCardMouseEnter?.(domain)}
          onMouseLeave={onCardMouseLeave}
          onClick={() => handleDomainClick(domain)}
        >
          <div className="mb-2 min-h-[40px] flex items-start">
            <h3 className={`font-bold text-white leading-tight ${getTitleClass(domain)}`}>
              {domain}
            </h3>
          </div>

          <div className="flex-grow flex items-end">
            <div className="w-full h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={records.map(r => ({
                    subject: r.subject,
                    "Possible Points": r.attempted,
                    "Points Earned": r.mastered
                  }))}
                  margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                >
                  <XAxis dataKey="subject" tick={{ fontSize: 10 }} />
                  <YAxis width={20} tick={{ fontSize: 10 }} />
                  
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#E5E7EB' }}
                    itemStyle={{ color: '#E5E7EB' }}
                    cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length > 0) {
                        return (
                          <div className="p-2 bg-gray-800 border border-gray-700 rounded shadow-lg">
                            <p className="text-gray-200 font-medium">{label}</p>
                            {payload.map((entry, index) => (
                              <p key={`item-${index}`} className="text-blue-400">
                                {`${entry.name}: ${entry.value}`}
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  <Bar
                    dataKey="Possible Points"
                    key={`bar-possible-${domain}`}
                    fill="#4B5563"
                    barSize={getDynamicBarSize(records.length)}
                    isAnimationActive={true}
                    animationDuration={400}
                  />
                  <Bar
                    dataKey="Points Earned"
                    key={`bar-earned-${domain}`}
                    fill="#10B981"
                    barSize={getDynamicBarSize(records.length)}
                    isAnimationActive={true}
                    animationDuration={400}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      ))}
    </div>
  );
};

export default StepOverview;
