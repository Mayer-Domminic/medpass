import React, { useState } from 'react';
import Subdomain, {subdomainQuestion} from './subdomain';

// Define types for our props and data
export type SubdomainType = {
  id: string;
  title: string;
  questions: subdomainQuestion[];
  isLatestConf?: boolean;
};

export type DomainProps = {
  title: string;
  subdomains: SubdomainType[];
};

const Domain: React.FC<DomainProps> = ({ title, subdomains }) => {
  const [expandedSubdomain, setExpandedSubdomain] = useState<string | null>(null);

  const toggleSubdomain = (id: string) => {
    if (expandedSubdomain === id) {
      setExpandedSubdomain(null);
    } else {
      setExpandedSubdomain(id);
    }
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-lg max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-300 mb-4">{title}</h1>
      
      <div className="space-y-3">
        {subdomains.map((subdomain) => (
          <Subdomain
            key={subdomain.id}
            subdomain={subdomain}
            isExpanded={expandedSubdomain === subdomain.id}
            onToggle={() => toggleSubdomain(subdomain.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default Domain;
