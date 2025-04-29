'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Bar,
  Tooltip,
  Cell
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
  onCardMouseLeave,
}) => {
  const router = useRouter();
  const [hoveredSubject, setHoveredSubject] = useState<string | null>(null);

  if (!data || data.length === 0) {
    return <div className="text-gray-400">No domains available</div>;
  }

  const byDomain = data.reduce<Record<string, DomainRecord[]>>((acc, rec) => {
    const list = (acc[rec.domain] ||= []);
    const existing = list.find((r) => r.subject === rec.subject);
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
    if (domain.length < 20) return 'text-lg';
    if (domain.length < 35) return 'text-base';
    return 'text-sm';
  };

  return (
    <div className="grid grid-cols-3 gap-4 bg-gray-900 p-4">
      {Object.entries(byDomain).map(([domain, records]) => (
        <div
          key={domain}
          className="w-full bg-gray-800 hover:bg-gray-800 rounded-xl p-4 flex flex-col cursor-pointer transition-none overflow-visible"
          onMouseEnter={() => onCardMouseEnter?.(domain)}
          onMouseLeave={() => {
            setHoveredSubject(null);
            onCardMouseLeave?.();
          }}
          onClick={() => handleDomainClick(domain)}
        >
          <div className="mb-2 min-h-[40px] flex items-start">
            <h3 className={`font-bold text-white leading-tight ${getTitleClass(domain)}`}>
              {domain}
            </h3>
          </div>

          <div className="flex-grow flex items-end">
            <div
              className="w-full h-[120px] overflow-x-auto overflow-y-hidden scroll-smooth pb-2 scrollbar-hide-track"
              style={{ scrollbarColor: '#9CA3AF transparent', scrollbarWidth: 'thin' }}
            >
              <div style={{ minWidth: `${Math.max(300, records.length * 100)}px`, height: '120px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={records.map((r) => ({
                      subject: r.subject,
                      'Possible Points': r.attempted,
                      'Points Earned': r.mastered,
                    }))}
                    margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                    onMouseMove={(e) => {
                      if (e && e.activePayload && e.activePayload[0]) {
                        const subject = e.activePayload[0].payload.subject;
                        setHoveredSubject(subject);
                      }
                    }}
                    onMouseLeave={() => setHoveredSubject(null)}
                  >
                    <XAxis dataKey="subject" tick={{ fontSize: 10 }} />
                    <YAxis width={20} tick={{ fontSize: 10 }} />
                    <Tooltip
                      wrapperStyle={{ zIndex: 50 }}
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
                    <Bar dataKey="Possible Points" barSize={32} radius={[6, 6, 0, 0]}>
                      {records.map((entry, index) => (
                        <Cell
                          key={`pp-${index}`}
                          fill={entry.subject === hoveredSubject ? '#9CA3AF' : '#4B5563'}
                        />
                      ))}
                    </Bar>
                    <Bar dataKey="Points Earned" barSize={32} radius={[6, 6, 0, 0]}>
                      {records.map((entry, index) => (
                        <Cell
                          key={`pe-${index}`}
                          fill={entry.subject === hoveredSubject ? '#6EE7B7' : '#10B981'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StepOverview;
