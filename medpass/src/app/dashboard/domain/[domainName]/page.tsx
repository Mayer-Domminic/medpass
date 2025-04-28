'use client';

import { useParams } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/navbar';
import { useSession } from 'next-auth/react';
import { ChevronDown, ChevronRight, Heart, Brain, Microscope, User, Users, Wind, Thermometer, Zap, Stethoscope, Pill } from 'lucide-react';
import AnimatedProgressBar from '@/components/ProgressComponents/AnimatedProgressBar';
import DomainQuestions from '@/components/domain/DomainQuestions';

interface SubdomainQuestion {
  id: string;
  text: string;
  difficulty: 'easy' | 'med' | 'hard';
  points: number;
  isChecked: boolean;
}

interface Subdomain {
  id: string;
  title: string;
  confidence: number;
  proficiency: number;
  questions: SubdomainQuestion[];
}

// Function to convert URL format back to display format
const formatDomainName = (slug: string): string => {
  // Map slugs back to their original domain names
  const domainMapping: Record<string, string> = {
    'human-development': 'Human Development',
    'blood-and-lymphoreticular-immune-systems': 'Blood & Lymphoreticular/Immune Systems',
    'behavioral-health-and-nervous-systems-special-senses': 'Behavioral Health & Nervous Systems/Special Senses',
    'musculoskeletal-skin-and-subcutaneous-tissue': 'Musculoskeletal, Skin & Subcutaneous Tissue', 
    'cardiovascular-system': 'Cardiovascular System',
    'respiratory-and-renal-urinary-systems': 'Respiratory & Renal/Urinary Systems',
    'gastrointestinal-system': 'Gastrointestinal System',
    'reproductive-and-endocrine-systems': 'Reproductive & Endocrine Systems',
    'multisystem-processes-and-disorders': 'Multisystem Processes & Disorders',
    'biostatistics-and-epidemiology-population-health': 'Biostatistics & Epidemiology/Population Health',
    'social-sciences-communication-and-interpersonal-skills': 'Social Sciences: Communication and Interpersonal Skills'
  };
  
  return domainMapping[slug] || 
    slug.split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
};

// Get icon and color based on domain name
const getDomainIcon = (domainName: string) => {
  const iconMapping: Record<string, { icon: React.ElementType; color: string }> = {
    'human-development': { icon: User, color: 'blue' },
    'blood-and-lymphoreticular-immune-systems': { icon: Microscope, color: 'red' },
    'behavioral-health-and-nervous-systems-special-senses': { icon: Brain, color: 'purple' },
    'musculoskeletal-skin-and-subcutaneous-tissue': { icon: Users, color: 'yellow' },
    'cardiovascular-system': { icon: Heart, color: 'rose' },
    'respiratory-and-renal-urinary-systems': { icon: Wind, color: 'cyan' },
    'gastrointestinal-system': { icon: Thermometer, color: 'orange' },
    'reproductive-and-endocrine-systems': { icon: Zap, color: 'green' },
    'multisystem-processes-and-disorders': { icon: Stethoscope, color: 'indigo' },
    'biostatistics-and-epidemiology-population-health': { icon: Pill, color: 'slate' },
    'social-sciences-communication-and-interpersonal-skills': { icon: Users, color: 'emerald' }
  };

  return iconMapping[domainName] || { icon: Stethoscope, color: 'blue' };
};

// Mock data function - would be replaced with actual API call
const getMockSubdomains = (domainName: string): Subdomain[] => {
  switch (domainName) {
    case 'cardiovascular-system':
      return [
        {
          id: 'cardio-1',
          title: 'Cardiac Anatomy',
          confidence: 85,
          proficiency: 75,
          questions: [
            { id: '1', text: 'Structure of heart chambers', difficulty: 'easy', points: 5, isChecked: false },
            { id: '2', text: 'Coronary vessels anatomy', difficulty: 'med', points: 8, isChecked: false },
          ],
        },
        {
          id: 'cardio-2',
          title: 'Cardiac Physiology',
          confidence: 65,
          proficiency: 60,
          questions: [
            { id: '3', text: 'Cardiac action potential', difficulty: 'hard', points: 10, isChecked: false },
          ],
        },
      ];
    case 'respiratory-and-renal-urinary-systems':
      return [
        {
          id: 'resp-1',
          title: 'Pulmonary Anatomy',
          confidence: 70,
          proficiency: 65,
          questions: [
            { id: '4', text: 'Bronchial tree structure', difficulty: 'easy', points: 5, isChecked: false },
          ],
        },
        {
          id: 'resp-2',
          title: 'Pulmonary Physiology',
          confidence: 80,
          proficiency: 75,
          questions: [
            { id: '5', text: 'Gas exchange mechanisms', difficulty: 'med', points: 8, isChecked: false },
          ],
        },
      ];
    // Add more cases for other domains
    default:
      return [
        {
          id: 'default-1',
          title: 'General Topics',
          confidence: 60,
          proficiency: 55,
          questions: [
            { id: '6', text: 'Basic concepts', difficulty: 'easy', points: 5, isChecked: false },
          ],
        },
      ];
  }
};

interface SubdomainComponentProps {
  subdomain: Subdomain;
  isExpanded: boolean;
  onToggle: () => void;
  domainName: string;
}

const SubdomainComponent: React.FC<SubdomainComponentProps> = ({ 
  subdomain, 
  isExpanded, 
  onToggle,
  domainName
}) => {
  return (
    <div className="w-full bg-gray-800 rounded-lg p-4">
      <div 
        className="flex items-center gap-4 cursor-pointer select-none"
        onClick={onToggle}
      >
        <div className="transition-transform duration-300">
          {isExpanded ? (
            <ChevronDown className="text-gray-400 flex-shrink-0" size={20} />
          ) : (
            <ChevronRight className="text-gray-400 flex-shrink-0" size={20} />
          )}
        </div>
        <span className="text-base font-bold text-white flex-grow">{subdomain.title}</span>

        <div className="flex items-center gap-8 ml-auto">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-gray-400">Confidence</span>
            <AnimatedProgressBar
              value={subdomain.confidence}
              color="bg-blue-400"
              size="md"
            />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-gray-400">Proficiency</span>
            <AnimatedProgressBar
              value={subdomain.proficiency}
              color="bg-green-400"
              size="md"
            />
          </div>
        </div>
      </div>

      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[2000px]' : 'max-h-0'
        }`}
      >
        <div 
          className={`pl-10 py-4 transition-opacity duration-300 ${
            isExpanded ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Questions List */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-4">Questions</h3>
            <div className="space-y-2">
              {subdomain.questions.map(question => (
                <div key={question.id} className="flex items-center gap-3 text-gray-300 text-sm">
                  <span className={`px-2 py-1 rounded text-xs ${
                    question.difficulty === 'easy' 
                      ? 'bg-green-900/30 text-green-400' 
                      : question.difficulty === 'med' 
                        ? 'bg-yellow-900/30 text-yellow-400' 
                        : 'bg-red-900/30 text-red-400'
                  }`}>
                    {question.difficulty}
                  </span>
                  <span>{question.text}</span>
                  <span className="ml-auto text-gray-400">{question.points} pts</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Practice Questions Generator using Gemini API */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h3 className="text-lg font-semibold text-gray-300 mb-4">Practice Questions</h3>
            <DomainQuestions 
              domain={domainName}
              subdomain={subdomain.title}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default function DomainPage() {
  const { domainName } = useParams();
  const { data: session } = useSession();
  const [subdomains, setSubdomains] = useState<Subdomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubdomain, setExpandedSubdomain] = useState<string | null>(null);
  
  // Format the domain name for display
  const formattedDomainName = formatDomainName(domainName as string);
  const { icon: DomainIcon, color } = getDomainIcon(domainName as string);

    useEffect(() => {
        if (!session?.accessToken) return;
        fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/domains/${encodeURIComponent(formattedDomainName)}/subdomains`,
            { headers: { Authorization: `Bearer ${session.accessToken}` } }
        )
            .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json() as Promise<string[]>;
            })
            .then(names => {
            const subs = names.map(name => ({
                id: name,
                title: name,
                confidence: 0,
                proficiency: 0,
                questions: []
            }));

            setSubdomains(subs);
            })
            .catch(err => {
            console.error('Failed to fetch subdomains:', err);
            })
            .finally(() => setLoading(false));
    }, [formattedDomainName, session]);
  
  const toggleSubdomain = (id: string) => {
    if (expandedSubdomain === id) {
      setExpandedSubdomain(null);
    } else {
      setExpandedSubdomain(id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar />
      <div className="pl-[100px] p-6">
        <div className="max-w-7xl mx-auto">
          {/* Domain Title */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg bg-${color}-500/10`}>
                <DomainIcon className={`w-8 h-8 text-${color}-400`} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{formattedDomainName}</h1>
                <p className="text-gray-400">Comprehensive study of {formattedDomainName.toLowerCase()}</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {subdomains.map((subdomain) => (
                <SubdomainComponent
                  key={subdomain.id}
                  subdomain={subdomain}
                  isExpanded={expandedSubdomain === subdomain.id}
                  onToggle={() => toggleSubdomain(subdomain.id)}
                  domainName={formattedDomainName}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}