import React from 'react';
import BlockCard from './Subtopic.tsx/BlockCard';

const BlockGrid: React.FC = () => {
  const blocks = [
    { 
      id: 1, 
      title: "Block A", 
      subject: "Cardiovascular",
      score: 87,
      data: [
        { week: 'Week 1', quiz: 82, exam: 78 },
        { week: 'Week 2', quiz: 88, exam: 85 },
        { week: 'Week 3', quiz: 76, exam: 82 },
        { week: 'Week 4', quiz: 92, exam: 88 },
      ]
    },
    { 
      id: 2, 
      title: "Block B", 
      subject: "Respiratory",
      score: 92,
      data: [
        { week: 'Week 1', quiz: 88, exam: 85 },
        { week: 'Week 2', quiz: 92, exam: 89 },
        { week: 'Week 3', quiz: 85, exam: 88 },
        { week: 'Week 4', quiz: 94, exam: 91 },
      ]
    },
    { 
      id: 3, 
      title: "Block C", 
      subject: "Neurology",
      score: 78,
      data: [
        { week: 'Week 1', quiz: 75, exam: 72 },
        { week: 'Week 2', quiz: 79, exam: 76 },
        { week: 'Week 3', quiz: 82, exam: 78 },
        { week: 'Week 4', quiz: 85, exam: 80 },
      ]
    },
    { 
      id: 4, 
      title: "Block D", 
      subject: "Endocrine",
      score: 83,
      data: [
        { week: 'Week 1', quiz: 80, exam: 77 },
        { week: 'Week 2', quiz: 84, exam: 81 },
        { week: 'Week 3', quiz: 86, exam: 83 },
        { week: 'Week 4', quiz: 88, exam: 85 },
      ]
    },
    { 
      id: 5, 
      title: "Block E", 
      subject: "Gastrointestinal",
      score: 89,
      data: [
        { week: 'Week 1', quiz: 86, exam: 84 },
        { week: 'Week 2', quiz: 89, exam: 87 },
        { week: 'Week 3', quiz: 91, exam: 88 },
        { week: 'Week 4', quiz: 93, exam: 90 },
      ]
    },
    { 
      id: 6, 
      title: "Block F", 
      subject: "Renal",
      score: 85,
      data: [
        { week: 'Week 1', quiz: 82, exam: 80 },
        { week: 'Week 2', quiz: 85, exam: 83 },
        { week: 'Week 3', quiz: 87, exam: 84 },
        { week: 'Week 4', quiz: 89, exam: 86 },
      ]
    },
  ];

  return (
    <div className="p-6 bg-gray-50">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {blocks.map((block) => (
          <div key={block.id} className="transform scale-80 origin-top-left">
            <BlockCard 
              title={block.title}
              subject={block.subject}
              score={block.score}
              data={block.data}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlockGrid;