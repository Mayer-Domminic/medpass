import CircularProgress from '../../ProgressCircle';
import ProgressArc from './ProgressArc';

const ProgressExamples = () => {
  // Mock data for ProgressCircle
  const circleExamples = [
    {
      topicName: "Cardiovascular System",
      score: 47,
      segments: [
        { value: 70, color: 'stroke-red-500', category: 'needs_review' as 'needs_review', displayName: 'Needs Review' },
        { value: 20, color: 'stroke-yellow-500', category: 'learning' as 'learning', displayName: 'Learning' },
        { value: 10, color: 'stroke-green-500', category: 'mastered' as 'mastered', displayName: 'Mastered' }
      ],
      questions: [
        { id: "1", correct: false, category: 'needs_review' as 'needs_review' },
        { id: "2", correct: false, category: 'needs_review' as 'needs_review' },
        { id: "3", correct: true, category: 'learning' as 'learning' },
        { id: "4", correct: true, category: 'mastered' as 'mastered' }
      ]
    },
    {
      topicName: "Respiratory System",
      score: 72,
      segments: [
        { value: 30, color: 'stroke-red-500', category: 'needs_review' as 'needs_review', displayName: 'Needs Review' },
        { value: 45, color: 'stroke-yellow-500', category: 'learning' as 'learning', displayName: 'Learning' },
        { value: 25, color: 'stroke-green-500', category: 'mastered' as 'mastered', displayName: 'Mastered' }
      ],
      questions: [
        { id: "5", correct: true, category: 'learning' as 'learning' },
        { id: "6", correct: true, category: 'learning' as 'learning' },
        { id: "7", correct: false, category: 'needs_review' as 'needs_review' },
        { id: "8", correct: true, category: 'mastered' as 'mastered' }
      ]
    },
    {
      topicName: "Nervous System",
      score: 89,
      segments: [
        { value: 10, color: 'stroke-red-500', category: 'needs_review' as 'needs_review', displayName: 'Needs Review' },
        { value: 30, color: 'stroke-yellow-500', category: 'learning' as 'learning', displayName: 'Learning' },
        { value: 60, color: 'stroke-green-500', category: 'mastered' as 'mastered', displayName: 'Mastered' }
      ],
      questions: [
        { id: "9", correct: true, category: 'mastered' as 'mastered' },
        { id: "10", correct: true, category: 'mastered' as 'mastered' },
        { id: "11", correct: true, category: 'learning' as 'learning' },
        { id: "12", correct: false, category: 'needs_review' as 'needs_review' }
      ]
    }
  ];

  // Mock data for ProgressArc
  const arcExamples = [
    {
      segments: [
        { value: 25, color: 'stroke-green-500' },
        { value: 75, color: 'stroke-red-500' }
      ],
      label: "Cardiovascular System",
      sublabel: "Basic concepts"
    },
    {
      segments: [
        { value: 50, color: 'stroke-green-500' },
        { value: 50, color: 'stroke-red-500' }
      ],
      label: "Nervous System",
      sublabel: "Advanced topics"
    },
    {
      segments: [
        { value: 75, color: 'stroke-green-500' },
        { value: 25, color: 'stroke-red-500' }
      ],
      label: "Respiratory System",
      sublabel: "Clinical applications"
    },
    {
      segments: [
        { value: 30, color: 'stroke-green-500' },
        { value: 45, color: 'stroke-yellow-500' },
        { value: 15, color: 'stroke-red-500' },
        { value: 2, color: 'stroke-blue-500'}
      ],
      label: "Mixed Progress",
      sublabel: "Multiple segments"
    }
  ];

  return (
    <div className="p-8 space-y-12">
      {/* Circular Progress Section */}
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Circular Progress Examples
        </h2>
        <div className="flex flex-wrap gap-8 justify-center items-center">
          {circleExamples.map((example, index) => (
            <CircularProgress
              key={index}
              {...example}
            />
          ))}
        </div>
      </section>

      {/* Progress Arc Section */}
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Progress Arc Examples
        </h2>
        <div className="flex flex-wrap gap-8 justify-center items-center">
          {arcExamples.map((data, index) => (
            <ProgressArc
              key={index}
              segments={data.segments}
              label={data.label}
              sublabel={data.sublabel}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default ProgressExamples;