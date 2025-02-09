import React, { useState, useEffect } from 'react';

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
];

const SystemsViewer = () => {
  const [outlineSvg, setOutlineSvg] = useState<string>('');
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
        // Load outline
        const outlineResponse = await fetch('/systems/outline-thumbsin.svg');
        const outlineText = await outlineResponse.text();
        const parser = new DOMParser();
        const outlineDoc = parser.parseFromString(outlineText, 'image/svg+xml');
        const outlineSvg = outlineDoc.querySelector('svg');
        
        if (outlineSvg) {
          setViewBox(outlineSvg.getAttribute('viewBox') || '');
          setOutlineSvg(outlineSvg.innerHTML);
        }

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

  return (
    <div className="flex gap-4">
      <div className="w-64 space-y-4">
        {systems.map((system, index) => (
          <div key={system.name} className="border p-2 rounded">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={system.visible}
                onChange={(e) => updateSystem(index, { visible: e.target.checked })}
              />
              <span className="capitalize">{system.name}</span>
            </div>
            {system.visible && (
              <div className="space-y-2 mt-2">
                <input
                  type="number"
                  value={system.translateX}
                  onChange={(e) => updateSystem(index, { translateX: Number(e.target.value) })}
                  placeholder="X Position"
                  className="w-full"
                />
                <input
                  type="number"
                  value={system.translateY}
                  onChange={(e) => updateSystem(index, { translateY: Number(e.target.value) })}
                  placeholder="Y Position"
                  className="w-full"
                />
                <input
                  type="number"
                  value={system.scale}
                  onChange={(e) => updateSystem(index, { scale: Number(e.target.value) })}
                  step="0.1"
                  placeholder="Scale"
                  className="w-full"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex-1 h-[800px]">
        {outlineSvg && (
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
            {/* Render outline last so it's on top */}
            <g dangerouslySetInnerHTML={{ __html: outlineSvg }} />
          </svg>
        )}
      </div>
    </div>
  );
};

export default SystemsViewer;