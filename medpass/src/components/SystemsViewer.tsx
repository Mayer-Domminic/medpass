import React, { useState, useEffect } from 'react';

type OutlineType = 'thumbsin' | 'thumbsout';

type BodySystem = {
  name: string;
  translateX: number;
  translateY: number;
  scale: number;
  visible: boolean;
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

const SystemsViewer = () => {
  const [selectedOutline, setSelectedOutline] = useState<OutlineType>('thumbsin');
  const [outlineSvgs, setOutlineSvgs] = useState<{ [key in OutlineType]?: string }>({});
  const [systemSvgs, setSystemSvgs] = useState<{ [key: string]: string }>({});
  const [viewBox, setViewBox] = useState<string>('');
  const [systems, setSystems] = useState<BodySystem[]>(
    AVAILABLE_SYSTEMS.map(name => ({
      name,
      translateX: 0,
      translateY: 0,
      scale: 1,
      visible: false
    }))
  );

  useEffect(() => {
    const loadSVGs = async () => {
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
              setViewBox(svg.getAttribute('viewBox') || '');
            }
            loadedOutlines[variant] = svg.innerHTML;
          }
        }
        setOutlineSvgs(loadedOutlines);

        // Load all systems
        const loadedSystems: { [key: string]: string } = {};
        for (const system of AVAILABLE_SYSTEMS) {
          const response = await fetch(`/systems/${system}.svg`);
          const text = await response.text();
          const doc = parser.parseFromString(text, 'image/svg+xml');
          const svg = doc.querySelector('svg');
          if (svg) {
            loadedSystems[system] = svg.innerHTML;
          }
        }
        setSystemSvgs(loadedSystems);
      } catch (error) {
        console.error('Error loading SVGs:', error);
      }
    };

    loadSVGs();
  }, []);

  const updateSystem = (index: number, updates: Partial<BodySystem>) => {
    setSystems(prev => prev.map((system, i) => 
      i === index ? { ...system, ...updates } : system
    ));
  };

  const toggleOutline = () => {
    setSelectedOutline(prev => prev === 'thumbsin' ? 'thumbsout' : 'thumbsin');
  };

  return (
    <div className="flex gap-4">
      <div className="w-64 space-y-4">
        <div className="border p-2 rounded">
          <button 
            onClick={toggleOutline}
            className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Toggle Outline: {selectedOutline === 'thumbsin' ? 'Thumbs In' : 'Thumbs Out'}
          </button>
        </div>
        
        {systems.map((system, index) => (
          <div key={system.name} className="border p-2 rounded">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={system.visible}
                onChange={(e) => updateSystem(index, { visible: e.target.checked })}
                className="h-4 w-4"
              />
              <span className="capitalize">{system.name}</span>
            </div>
            {system.visible && (
              <div className="space-y-2 mt-2">
                <div className="flex flex-col">
                  <label className="text-sm text-gray-600">X Position</label>
                  <input
                    type="number"
                    value={system.translateX}
                    onChange={(e) => updateSystem(index, { translateX: Number(e.target.value) })}
                    className="w-full p-1 border rounded"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm text-gray-600">Y Position</label>
                  <input
                    type="number"
                    value={system.translateY}
                    onChange={(e) => updateSystem(index, { translateY: Number(e.target.value) })}
                    className="w-full p-1 border rounded"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-sm text-gray-600">Scale</label>
                  <input
                    type="number"
                    value={system.scale}
                    onChange={(e) => updateSystem(index, { scale: Number(e.target.value) })}
                    step="0.1"
                    className="w-full p-1 border rounded"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex-1 h-[800px] border rounded p-4">
        {outlineSvgs[selectedOutline] && (
          <svg viewBox={viewBox} className="w-full h-full">
            {/* Render visible systems */}
            {systems
              .filter(system => system.visible)
              .map(system => (
                <g
                  key={system.name}
                  dangerouslySetInnerHTML={{ __html: systemSvgs[system.name] }}
                  transform={`translate(${system.translateX} ${system.translateY}) scale(${system.scale})`}
                />
              ))}
            {/* Render current outline last so it's on top */}
            <g dangerouslySetInnerHTML={{ __html: outlineSvgs[selectedOutline] }} />
          </svg>
        )}
      </div>
    </div>
  );
};

export default SystemsViewer;