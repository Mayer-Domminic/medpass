/*
if (session?.user?.issuperuser) {
      console.log("ADMIN")
      redirect("/admin");
    }
*/
'use client';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Dashboard } from '@/components/Dashboard';
import { DomainRecord } from '@/components/block_cards';

export default function DashboardPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated: () => redirect('/auth/login'),
  });
  const [domainData, setDomainData] = useState<DomainRecord[]>([]);

  useEffect(() => {
    if (!session?.accessToken) return;
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/domainreport`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    })
      .then(res => res.json())
      .then(raw => {
        const domains = (raw.Domains || {}) as Record<string, any>;

        const allRecords: DomainRecord[] = Object.entries(domains).flatMap(
          ([domain, entries]) =>
            (Array.isArray(entries) ? entries : Object.values(entries)).map((entry: any) => {
              let subject = entry[1] as string;
              let attempted = entry[2] as number;
              let mastered = entry[3] as number;

              if (typeof entry === 'object' && !Array.isArray(entry)) {
                if (entry.ClassificationName !== undefined && entry.PointsAvailable !== undefined) {
                  subject = entry.ClassificationName;
                  attempted = entry.PointsAvailable;
                  mastered = entry.PointsEarned;
                } else {
                  subject = entry.subject;
                  attempted = entry.attempted;
                  mastered = entry.mastered;
                }
              }

              return {
                domain,
                subject,
                attempted: Number(attempted) || 0,
                mastered: Number(mastered) || 0,
              };
            })
        );

        // Group records by domain
        const recordsByDomain: Record<string, DomainRecord[]> = {};
        allRecords.forEach(record => {
          if (!recordsByDomain[record.domain]) {
            recordsByDomain[record.domain] = [];
          }
          recordsByDomain[record.domain].push(record);
        });

        // ✅ NO MORE LIMITING - return all records sorted
        const allRecordsUncapped: DomainRecord[] = Object.entries(recordsByDomain).flatMap(
          ([domain, records]) => {
            return [...records].sort((a, b) => b.attempted - a.attempted);
          }
        );

        setDomainData(allRecordsUncapped);
      })
      .catch(console.error);
  }, [session]);

  if (status === 'loading') return <div>Loading…</div>;
  return <Dashboard domainData={domainData} />;
}
