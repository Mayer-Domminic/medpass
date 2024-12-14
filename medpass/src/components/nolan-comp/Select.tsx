import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const Select = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState('');

  const blocks = [
    { label: "Block 1: Cardiovascular & Respiratory", value: "block1" },
    { label: "Block 2: Neurology & Endocrine", value: "block2" },
    { label: "Block 3: Gastrointestinal & Renal", value: "block3" }
  ];

  const handleSelect = (value, label) => {
    setSelectedValue(label);
    setIsOpen(false);
  };

  return (
    <div className="relative w-[300px]">
      {/* Select Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
      >
        <span className="text-gray-700 font-medium">
          {selectedValue || "Select a block"}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <div className="absolute mt-2 w-full rounded-lg bg-white shadow-lg border border-gray-100 py-1 z-10">
          {/* Group Label */}
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 border-b border-gray-100">
            Medical Blocks
          </div>
          
          {/* Items */}
          {blocks.map((block) => (
            <div
              key={block.value}
              onClick={() => handleSelect(block.value, block.label)}
              className="px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-colors"
            >
              {block.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Select;