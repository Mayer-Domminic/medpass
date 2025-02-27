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
    thumbsin: { translateX: 5.5, translateY: 0, scale: 1 },
    thumbsout: { translateX: 0, translateY: 0, scale: 1 }
  },
  lymphatic: {
    thumbsin: { translateX: 0, translateY: 0, scale: 1 },
    thumbsout: { translateX: 1.5, translateY: 6, scale: 1 }
  },
  muscular: {
    thumbsin: { translateX: 7.5, translateY: 2, scale: 1 },
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

// Offset values to center each outline properly
const OUTLINE_OFFSETS = {
  thumbsin: { x: 4.5, y: 0 }, // Default offset for thumbsin outline
  thumbsout: { x: 0, y: 0 }  // Default no offset
};

const SystemsViewer = () => {
  const [outlineSvgs, setOutlineSvgs] = useState<{ [key in OutlineType]?: string }>({});
  const [systemSvgs, setSystemSvgs] = useState<{ [key: string]: string }>({});
  const [viewBox, setViewBox] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredSystem, setHoveredSystem] = useState<string | null>(null);
  const [currentOutline, setCurrentOutline] = useState<OutlineType>('thumbsout');

  const [systems] = useState<BodySystem[]>(
    AVAILABLE_SYSTEMS.map(name => ({
      name,
      visible: false,
      alignments: SYSTEM_ALIGNMENTS[name]
    }))
  );

  // Determine which outline to show based on the hovered system
  useEffect(() => {
    if (hoveredSystem === 'integumentary' || hoveredSystem === 'muscular') {
      setCurrentOutline('thumbsin');
    } else if (hoveredSystem) {
      setCurrentOutline('thumbsout');
    }
  }, [hoveredSystem]);

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
    // Use the current outline to determine alignment
    const outlineType = system.name === 'integumentary' || system.name === 'muscular' 
      ? 'thumbsin' 
      : 'thumbsout';
    const alignment = system.alignments[outlineType];
    return `translate(${alignment.translateX} ${alignment.translateY}) scale(${alignment.scale})`;
  };

  const getSystemOpacity = (system: BodySystem) => {
    // Only show systems that match the current outline
    const systemOutline = system.name === 'integumentary' || system.name === 'muscular' 
      ? 'thumbsin' 
      : 'thumbsout';
    
    if (!hoveredSystem) return 'opacity-0';
    if (hoveredSystem === system.name) return 'opacity-100';
    return 'opacity-0';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[500px] text-white">
        <div className="text-center">
          <div className="mb-2">Loading SVGs...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[500px] text-red-400">
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
              className={`p-2 rounded border transition-colors cursor-pointer text-sm
                ${hoveredSystem === system.name 
                  ? 'bg-blue-900/40 border-blue-500 text-white' 
                  : 'border-gray-700/50 text-gray-300 hover:bg-gray-800 hover:border-gray-600'}`}
              onMouseEnter={() => setHoveredSystem(system.name)}
              onMouseLeave={() => setHoveredSystem(null)}
            >
              <span className="capitalize">{system.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 h-[500px] border border-gray-700/50 rounded p-4 bg-gray-800/50">
        <div className="relative h-full">
          <h3 className="text-center font-semibold mb-2 text-white">
            {currentOutline === 'thumbsin' ? 'Thumbs In View' : 'Thumbs Out View'}
          </h3>
          
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
                    transition: opacity 0.3s ease-in-out;
                  }
                  .system-group.visible {
                    opacity: 1;
                  }
                `}
              </style>
            </defs>

            {/* Render all systems but control visibility based on current outline */}
            {systems.map(system => (
              <g
                key={system.name}
                dangerouslySetInnerHTML={{ __html: systemSvgs[system.name] || '' }}
                transform={getSystemTransform(system)}
                className={`system-group ${hoveredSystem === system.name ? 'visible' : ''}`}
                style={{ 
                  filter: hoveredSystem === system.name ? 'url(#glow)' : 'none',
                }}
              />
            ))}
            
            {/* Render current outline with position adjustment */}
            {outlineSvgs[currentOutline] && (
              <g 
                dangerouslySetInnerHTML={{ __html: outlineSvgs[currentOutline] }}
                style={{ stroke: 'white', fill: 'none' }}
                transform={`translate(${OUTLINE_OFFSETS[currentOutline].x}, ${OUTLINE_OFFSETS[currentOutline].y})`}
              />
            )}
          </svg>
          
          {/* System name indicator */}
          {hoveredSystem && (
            <div className="absolute bottom-2 left-0 right-0 text-center text-white bg-black/30 py-1 rounded">
              {hoveredSystem.charAt(0).toUpperCase() + hoveredSystem.slice(1)} System
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemsViewer;