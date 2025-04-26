"use client";

import React, { useState, useEffect } from 'react';

type SystemAlignment = {
  translateX: number;
  translateY: number;
  scale: number;
};

type BodySystem = {
  name: string;
  alignment: SystemAlignment;
};

export const AVAILABLE_SYSTEMS = [
  'cardiovascular',
  'digestive',
  'endocrine',
  'integumentary',
  'lymphatic',
  'muscular',
  'nervous',
  'reproductive',
  'respiratory',
  'skeletal',
  'urinary'
] as const;

export type SystemName = typeof AVAILABLE_SYSTEMS[number];

// Simplified alignment data - only keeping thumbsout values
const SYSTEM_ALIGNMENTS: { [key: string]: SystemAlignment } = {
  cardiovascular: { translateX: 6.5, translateY: 12, scale: 1 },
  digestive: { translateX: 25, translateY: 19, scale: 1 },
  endocrine: { translateX: 28.5, translateY: 5, scale: 1 },
  integumentary: { translateX: -4, translateY: -.5, scale: 1 },
  lymphatic: { translateX: 1.5, translateY: 6, scale: 1 },
  muscular: { translateX: 8.5, translateY: 1, scale: 1 },
  nervous: { translateX: 2.25, translateY: 2, scale: 1 },
  reproductive: { translateX: 33.5, translateY: 79, scale: 1 },
  respiratory: { translateX: 25.25, translateY: 7, scale: 1 },
  skeletal: { translateX: 1.5, translateY: 2, scale: 1 },
  urinary: { translateX: 30.6, translateY: 62, scale: 1 }
};

// Offset value to center the outline properly
const OUTLINE_OFFSET = { x: 0, y: 0 };

interface SystemsViewerProps {
  // Array of systems to highlight
  highlightedSystems: SystemName[];
  // Optional classname for styling
  className?: string;
}

const SystemsViewer: React.FC<SystemsViewerProps> = ({
  highlightedSystems = [],
  className = '',
}) => {
  const [outlineSvg, setOutlineSvg] = useState<string>('');
  const [systemSvgs, setSystemSvgs] = useState<{ [key: string]: string }>({});
  const [viewBox, setViewBox] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const systems: BodySystem[] = AVAILABLE_SYSTEMS.map(name => ({
    name,
    alignment: SYSTEM_ALIGNMENTS[name]
  }));

  useEffect(() => {
    const loadSVGs = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const parser = new DOMParser();

        // Load the outline
        const response = await fetch(`/systems/outline.svg`);
        const text = await response.text();
        const doc = parser.parseFromString(text, 'image/svg+xml');
        const svg = doc.querySelector('svg');
        
        if (svg) {
          if (!viewBox) {
            {}
            const originalViewBox = svg.getAttribute('viewBox') || '0 0 1000 1000';
            const [x, y, width, height] = originalViewBox.split(' ').map(Number);
            // setting the original and then adding pixels fixes bug with highlight cutoff
            const expandedViewBox = `${x - 10} ${y - 10} ${width + 20} ${height + 20}`;
            setViewBox(expandedViewBox);
          }
          setOutlineSvg(text.replace(/<svg[^>]*>/, '').replace('</svg>', ''));
        }

        // Load systems
        const loadedSystems: { [key: string]: string } = {};
        for (const system of AVAILABLE_SYSTEMS) {
          const response = await fetch(`/systems/${system}.svg`);
          const text = await response.text();
          const doc = parser.parseFromString(text, 'image/svg+xml');
          const svg = doc.querySelector('svg');
          if (svg) {
            loadedSystems[system] = text.replace(/<svg[^>]*>/, '').replace('</svg>', '');
          }
        }
        setSystemSvgs(loadedSystems);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load SVGs');
        console.error('Error loading SVGs:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSVGs();
  }, []);

  const getSystemTransform = (system: BodySystem) => {
    const alignment = system.alignment;
    return `translate(${alignment.translateX} ${alignment.translateY}) scale(${alignment.scale})`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        <div className="text-center">
          <div className="mb-2">Loading SVGs...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-400">
        Error: {error}
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="h-full w-full">
        <div className="relative h-full">
          <svg 
            viewBox={viewBox || '0 0 1000 1000'} 
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
            <filter id="glow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
              <style type="text/css">
                {`
                  @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                  }
                  @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                  }
                  .system-group {
                    opacity: 0;
                    transition: opacity 0.15s ease-in-out;
                  }
                  .system-group.visible {
                    opacity: 0.6;
                  }
                `}
              </style>
            </defs>

            {/* Render all systems but only show highlighted ones */}
            {systems.map(system => (
              <g
                key={system.name}
                dangerouslySetInnerHTML={{ __html: systemSvgs[system.name] || '' }}
                transform={getSystemTransform(system)}
                className={`system-group ${highlightedSystems.includes(system.name as SystemName) ? 'visible' : ''}`}
                style={{ 
                  filter: highlightedSystems.includes(system.name as SystemName) ? 'url(#glow)' : 'none',
                }}
              />
            ))}
            
            {/* Render outline with position adjustment */}
            {outlineSvg && (
              <g 
                dangerouslySetInnerHTML={{ __html: outlineSvg }}
                style={{ stroke: 'white', fill: 'none' }}
                transform={`translate(${OUTLINE_OFFSET.x}, ${OUTLINE_OFFSET.y})`}
              />
            )}
          </svg>
        </div>
      </div>
    </div>
  );
};

export default SystemsViewer;