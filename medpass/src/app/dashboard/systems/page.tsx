"use client";

import React, { useState } from 'react';
import SystemsViewer, { SystemName, AVAILABLE_SYSTEMS } from '@/components/SystemsViewer';

// Define domains with associated body systems based on NBME domains and blocks
const DOMAINS = [
  {
    id: 1,
    name: 'Block 1: Human Development',
    systems: ['reproductive'] as SystemName[],
    color: 'bg-purple-600',
    percentRange: '1-3%'
  },
  {
    id: 6,
    name: 'Block 6: Blood & Lymphoreticular/Immune',
    systems: ['lymphatic'] as SystemName[],
    color: 'bg-yellow-600',
    percentRange: '9-13%'
  },
  {
    id: 5,
    name: 'Block 5: Behavioral Health & Nervous Systems',
    systems: ['nervous'] as SystemName[],
    color: 'bg-indigo-600',
    percentRange: '10-14%'
  },
  {
    id: 10,
    name: 'Block 10: Special Senses',
    systems: ['nervous'] as SystemName[],
    color: 'bg-indigo-400',
    percentRange: '10-14%'
  },
  {
    id: 4,
    name: 'Block 4: Musculoskeletal, Skin & Subcutaneous',
    systems: ['muscular', 'skeletal', 'integumentary'] as SystemName[],
    color: 'bg-blue-600',
    percentRange: '8-12%'
  },
  {
    id: 2,
    name: 'Block 2: Cardiovascular & Respiratory Systems',
    systems: ['cardiovascular', 'respiratory'] as SystemName[],
    color: 'bg-red-600',
    percentRange: '7-11% + 11-15%'
  },
  {
    id: 8,
    name: 'Block 8: Renal/Urinary Systems',
    systems: ['urinary'] as SystemName[],
    color: 'bg-teal-600',
    percentRange: '11-15%'
  },
  {
    id: 3,
    name: 'Block 3: Gastrointestinal System',
    systems: ['digestive'] as SystemName[],
    color: 'bg-green-600',
    percentRange: '6-10%'
  },
  {
    id: 9,
    name: 'Block 9: Reproductive & Endocrine Systems',
    systems: ['reproductive', 'endocrine'] as SystemName[],
    color: 'bg-pink-600',
    percentRange: '12-16%'
  },
  {
    id: 7,
    name: 'Block 7: Multisystem Processes & Disorders',
    systems: ['cardiovascular', 'respiratory', 'nervous', 'digestive', 'urinary', 'reproductive', 'endocrine', 'lymphatic', 'integumentary', 'skeletal', 'muscular'] as SystemName[],
    color: 'bg-gray-500',
    percentRange: '8-12%'
  }
];

const TestPage = () => {
  // Track which systems should be highlighted
  const [highlightedSystems, setHighlightedSystems] = useState<SystemName[]>([]);
  
  // Track the active domain (if any) for UI purposes
  const [activeDomainId, setActiveDomainId] = useState<number | null>(null);
  
  // When a domain is hovered, highlight its associated systems
  const handleDomainHover = (domain: typeof DOMAINS[0] | null) => {
    if (domain) {
      setHighlightedSystems(domain.systems);
      setActiveDomainId(domain.id);
    } else {
      setHighlightedSystems([]);
      setActiveDomainId(null);
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">NBME Step 1 Body Systems</h1>
          <p className="text-gray-400 mt-2">
            Hover over a block to highlight associated body systems covered on the NBME Step 1 exam
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="col-span-1">
            <h2 className="text-xl font-bold mb-4">NBME Blocks</h2>
            <div className="space-y-3">
              {DOMAINS.map(domain => (
                <div
                  key={domain.id}
                  className={`p-4 rounded-lg cursor-pointer transition-all duration-200 
                    ${domain.color} ${activeDomainId === domain.id ? 'ring-2 ring-white' : 'opacity-80 hover:opacity-100'}`}
                  onMouseEnter={() => handleDomainHover(domain)}
                  onMouseLeave={() => handleDomainHover(null)}
                >
                  <h3 className="font-bold">{domain.name}</h3>
                  <div className="mt-1 text-sm opacity-90">
                    <span className="block text-xs">{domain.percentRange} of exam</span>
                    <div className="mt-1">
                      {domain.systems.map(system => (
                        <span key={system} className="capitalize inline-block mr-2 text-xs bg-black/20 px-2 py-0.5 rounded-full">
                          {system}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <h2 className="text-xl font-bold mb-4">Active Systems</h2>
              {highlightedSystems.length === 0 ? (
                <p className="text-gray-400">No systems selected</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {highlightedSystems.map(system => (
                    <span 
                      key={system}
                      className="px-3 py-1 bg-blue-900 rounded-full text-sm capitalize"
                    >
                      {system}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="col-span-1 md:col-span-2">
            <h2 className="text-xl font-bold mb-4">Body Systems</h2>
            <SystemsViewer 
              highlightedSystems={highlightedSystems}
              className="h-full"
            />
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4">SystemsViewer in Dashboard Mode</h2>
          <p className="text-gray-400 mb-4">
            Example of how the viewer would appear embedded in a dashboard (without sidebar)
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-bold mb-2">Performance Analytics</h3>
              <div className="h-64 flex items-center justify-center text-gray-500 border border-gray-700 rounded">
                [Performance Chart Placeholder]
              </div>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-bold mb-2">Body Systems</h3>
              <div className="h-64">
                <SystemsViewer 
                  highlightedSystems={highlightedSystems}
                />
              </div>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-lg md:col-span-2">
              <h3 className="font-bold mb-2">NBME Systems by Block</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                {DOMAINS.map(domain => {
                  // Skip Blocks 11+ for cleaner display
                  if (domain.id >= 11) return null;
                  
                  return (
                    <div 
                      key={domain.id}
                      className={`p-2 rounded border ${activeDomainId === domain.id ? 'border-white' : 'border-gray-700'} 
                        cursor-pointer hover:bg-gray-700`}
                      onMouseEnter={() => handleDomainHover(domain)}
                      onMouseLeave={() => handleDomainHover(null)}
                    >
                      <div className={`w-3 h-3 rounded-full mb-1 ${domain.color}`}></div>
                      <h4 className="font-medium">Block {domain.id}</h4>
                      <p className="text-gray-400 mt-0.5 text-xs">{domain.percentRange}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPage;