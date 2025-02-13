//TODO: handling for changing between thumbsin and thumbsout outline when implemented

import React, { useState, useEffect } from 'react';

type OutlineType = 'thumbsin' | 'thumbsout';

type SystemAlignment = {
  translateX: number;
  translateY: number;
  scale: number;
};

type BodySystem = {
  name: string;
  visible: boolean;
  alignments: {
    [key in OutlineType]: SystemAlignment;
  };
};

const AVAILABLE_SYSTEMS = [
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

const SYSTEM_ALIGNMENTS: { [key: string]: { [key in OutlineType]: SystemAlignment } } = {
  cardiovascular: {
    thumbsin: { translateX: 0, translateY: 0, scale: 1 },
    thumbsout: { translateX: 6.5, translateY: 12, scale: 1 }
  },
  digestive: {
    thumbsin: { translateX: 0, translateY: 0, scale: 1 },
    thumbsout: { translateX: 25, translateY: 19, scale: 1 }
  },
  endocrine: {
    thumbsin: { translateX: 0, translateY: 0, scale: 1 },
    thumbsout: { translateX: 28.5, translateY: 5, scale: 1 }
  },
  integumentary: {
    thumbsin: { translateX: 0.5, translateY: 0, scale: 1 },
    thumbsout: { translateX: 0, translateY: 0, scale: 1 }
  },
  lymphatic: {
    thumbsin: { translateX: 0, translateY: 0, scale: 1 },
    thumbsout: { translateX: 1.5, translateY: 6, scale: 1 }
  },
  muscular: {
    thumbsin: { translateX: 3.5, translateY: 2, scale: 1 },
    thumbsout: { translateX: 0, translateY: 0, scale: 1 }
  },
  nervous: {
    thumbsin: { translateX: 0, translateY: 0, scale: 1 },
    thumbsout: { translateX: 2.25, translateY: 2, scale: 1 }
  },
  reproductive: {
    thumbsin: { translateX: 0, translateY: 0, scale: 1 },
    thumbsout: { translateX: 33.5, translateY: 79, scale: 1 }
  },
  respiratory: {
    thumbsin: { translateX: 0, translateY: 0, scale: 1 },
    thumbsout: { translateX: 25.25, translateY: 7, scale: 1 }
  },
  skeletal: {
    thumbsin: { translateX: 0, translateY: 0, scale: 1 },
    thumbsout: { translateX: 1.5, translateY: 2, scale: 1 }
  },
  urinary: {
    thumbsin: { translateX: 0, translateY: 0, scale: 1 },
    thumbsout: { translateX: 30.6, translateY: 62, scale: 1 }
  }
};

const SystemsViewer = () => {
  const [outlineSvgs, setOutlineSvgs] = useState<{ [key in OutlineType]?: string }>({});
  const [systemSvgs, setSystemSvgs] = useState<{ [key: string]: string }>({});
  const [viewBox, setViewBox] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredSystem, setHoveredSystem] = useState<string | null>(null);

  const [systems] = useState<BodySystem[]>(
    AVAILABLE_SYSTEMS.map(name => ({
      name,
      visible: false,
      alignments: SYSTEM_ALIGNMENTS[name]
    }))
  );

  useEffect(() => {
    const loadSVGs = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const parser = new DOMParser();

        // Load both outlines
        const outlineVariants: OutlineType[] = ['thumbsin', 'thumbsout'];
        const loadedOutlines: { [key in OutlineType]?: string } = {};
        
        for (const variant of outlineVariants) {
          const response = await fetch(`/systems/outline-${variant}.svg`);
          const text = await response.text();
          const doc = parser.parseFromString(text, 'image/svg+xml');
          const svg = doc.querySelector('svg');
          
          if (svg) {
            if (!viewBox) {
              setViewBox(svg.getAttribute('viewBox') || '0 0 1000 1000');
            }
            loadedOutlines[variant] = text.replace(/<svg[^>]*>/, '').replace('</svg>', '');
          }
        }
        setOutlineSvgs(loadedOutlines);

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
    const outlineType = system.name === 'integumentary' || system.name === 'muscular' ? 'thumbsin' : 'thumbsout';
    const alignment = system.alignments[outlineType];
    return `translate(${alignment.translateX} ${alignment.translateY}) scale(${alignment.scale})`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[800px] text-white">
        <div className="text-center">
          <div className="mb-2">Loading SVGs...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[800px] text-red-400">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      <div className="w-64 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {systems.map((system) => (
            <div
              key={system.name}
              className="p-2 rounded border border-gray-700/50 transition-colors cursor-pointer hover:bg-gray-800 hover:border-gray-600 text-gray-300"
              onMouseEnter={() => setHoveredSystem(system.name)}
              onMouseLeave={() => setHoveredSystem(null)}
            >
              <span className="capitalize text-sm">{system.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 h-[800px] border border-gray-700/50 rounded p-4 bg-gray-800/50">
        <div className="flex gap-4 h-full">
          {/* Thumbs In View */}
          <div className="flex-1 border-r border-gray-700/50 pr-4">
            <h3 className="text-center font-semibold mb-2 text-white">Thumbs In</h3>
            <svg 
              viewBox={viewBox || '0 0 1000 1000'} 
              className="w-full h-full"
            >
              <defs>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
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
                    }
                    .system-group.visible {
                      animation: fadeIn 0.3s forwards;
                    }
                    .system-group:not(.visible) {
                      animation: fadeOut 0.3s forwards;
                    }
                  `}
                </style>
              </defs>

              {/* Render systems that use thumbsin */}
              {systems
                .filter(system => (system.name === 'integumentary' || system.name === 'muscular'))
                .map(system => (
                  <g
                    key={system.name}
                    dangerouslySetInnerHTML={{ __html: systemSvgs[system.name] || '' }}
                    transform={getSystemTransform(system)}
                    className={`system-group ${hoveredSystem === system.name ? 'visible' : ''}`}
                    style={{ 
                      filter: hoveredSystem === system.name ? 'url(#glow)' : 'none',
                      transition: 'filter 0.3s ease-in-out'
                    }}
                  />
                ))}
              
              {/* Render thumbsin outline */}
              {outlineSvgs.thumbsin && (
                <g 
                  dangerouslySetInnerHTML={{ __html: outlineSvgs.thumbsin }}
                  style={{ stroke: 'white', fill: 'none' }}
                />
              )}
            </svg>
          </div>

          {/* Thumbs Out View */}
          <div className="flex-1 pl-4">
            <h3 className="text-center font-semibold mb-2 text-white">Thumbs Out</h3>
            <svg 
              viewBox={viewBox || '0 0 1000 1000'} 
              className="w-full h-full"
            >
              <defs>
                <filter id="glow2" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Render systems that use thumbsout */}
              {systems
                .filter(system => system.name !== 'integumentary' && system.name !== 'muscular')
                .map(system => (
                  <g
                    key={system.name}
                    dangerouslySetInnerHTML={{ __html: systemSvgs[system.name] || '' }}
                    transform={getSystemTransform(system)}
                    className={`system-group ${hoveredSystem === system.name ? 'visible' : ''}`}
                    style={{ 
                      filter: hoveredSystem === system.name ? 'url(#glow2)' : 'none',
                      transition: 'filter 0.3s ease-in-out'
                    }}
                  />
                ))}
              
              {/* Render thumbsout outline */}
              {outlineSvgs.thumbsout && (
                <g 
                  dangerouslySetInnerHTML={{ __html: outlineSvgs.thumbsout }}
                  style={{ stroke: 'white', fill: 'none' }}
                />
              )}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemsViewer;