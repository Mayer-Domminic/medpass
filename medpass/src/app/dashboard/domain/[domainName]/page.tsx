'use client';

import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/navbar';
import { useSession } from 'next-auth/react';
import { ChevronDown, ChevronRight, Heart, Brain, Microscope, User, Users, Wind, Thermometer, Zap, Stethoscope, Pill } from 'lucide-react';
import AnimatedProgressBar from '@/components/ProgressComponents/AnimatedProgressBar';

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
    'blood-and-lymphoreticular-immune-systems': 'Blood & Lymphoreticular Immune Systems',
    'behavioral-health-and-nervous-systems-special-senses': 'Behavioral Health & Nervous Systems Special Senses',
    'musculoskeletal-skin-and-subcutaneous-tissue': 'Musculoskeletal, Skin & Subcutaneous Tissue', 
    'cardiovascular-system': 'Cardiovascular System',
    'respiratory-and-renal-urinary-systems': 'Respiratory & Renal Urinary Systems',
    'gastrointestinal-system': 'Gastrointestinal System',
    'reproductive-and-endocrine-systems': 'Reproductive & Endocrine Systems',
    'multisystem-processes-and-disorders': 'Multisystem Processes & Disorders',
    'biostatistics-and-epidemiology-population-health': 'Biostatistics & Epidemiology Population Health',
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
    'human-development': { icon: User, color: 'green' },
    'blood-and-lymphoreticular-immune-systems': { icon: Microscope, color: 'green' },
    'behavioral-health-and-nervous-systems-special-senses': { icon: Brain, color: 'green' },
    'musculoskeletal-skin-and-subcutaneous-tissue': { icon: Users, color: 'green' },
    'cardiovascular-system': { icon: Heart, color: 'green' },
    'respiratory-and-renal-urinary-systems': { icon: Wind, color: 'green' },
    'gastrointestinal-system': { icon: Thermometer, color: 'green' },
    'reproductive-and-endocrine-systems': { icon: Zap, color: 'green' },
    'multisystem-processes-and-disorders': { icon: Stethoscope, color: 'green' },
    'biostatistics-and-epidemiology-population-health': { icon: Pill, color: 'green' },
    'social-sciences-communication-and-interpersonal-skills': { icon: Users, color: 'green' }
  };

  return iconMapping[domainName] || { icon: Stethoscope, color: 'blue' };
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
  const router = useRouter();
  const [generatingAIQuestions, setGeneratingAIQuestions] = useState(false);
  const { data: session } = useSession();
  // add state for questions
  const [questions, setQuestions] = useState<SubdomainQuestion[]>(subdomain.questions || []);
  const [additionalContext, setAdditionalContext] = useState('');
  
  const fetchQuestions = async () => {
    if (!session?.accessToken) return;
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/practice-questions/?domain=${encodeURIComponent(domainName)}&subdomain=${encodeURIComponent(subdomain.title)}`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data.questions)) {
        const formattedQuestions = data.questions.map((q: any) => ({
          id: q.id,
          text: q.text,
          difficulty: q.difficulty === 'medium' ? 'med' : q.difficulty,
          points: 5,
          isChecked: false
        }));
        
        setQuestions(formattedQuestions);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  useEffect(() => {
    setQuestions(subdomain.questions || []);
    
    // fetch questions when component expands
    if (isExpanded && session?.accessToken) {
      fetchQuestions();
    }
  }, [subdomain, isExpanded, session?.accessToken]);

  const generateAIQuestions = async () => {
    if (!session?.accessToken) return;
    
    setGeneratingAIQuestions(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/practice-questions/generate?domain=${encodeURIComponent(domainName)}&subdomain=${encodeURIComponent(subdomain.title)}&count=5&rag=true&additional_context=${encodeURIComponent(additionalContext)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.accessToken}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      await fetchQuestions();
      
      setAdditionalContext('');
    } catch (error) {
      console.error('Error generating AI questions:', error);
    } finally {
      setGeneratingAIQuestions(false);
    }
  };

  const handlePracticeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const encodedDomain = encodeURIComponent(domainName);
    const encodedSubdomain = encodeURIComponent(subdomain.title);
    router.push(
      `/dashboard/review?domain=${encodedDomain}&subdomain=${encodedSubdomain}&practice=true`
    );
  };

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

        <div className="flex items-center gap-2 mr-4">
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={(e) => {
              e.stopPropagation();
              generateAIQuestions();
            }}
            disabled={generatingAIQuestions}
          >
            {generatingAIQuestions ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                Generating...
              </>
            ) : (
              "Generate AI Questions"
            )}
          </Button>
          
          <Button
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white"
            onClick={handlePracticeClick}
          >
            Practice Questions
          </Button>
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
          {/* Context input at top */}
          <div className="mb-6">
            <div className="flex gap-2 mb-4">
              <textarea
                id={`additionalContext-${subdomain.id}`}
                value={additionalContext}
                onChange={e => setAdditionalContext(e.target.value)}
                className="flex-grow bg-gray-800 text-gray-300 border border-gray-700 rounded-md p-2"
                placeholder="Any specific topics or areas you'd like to focus on"
                rows={2}
              />
              <Button
                onClick={generateAIQuestions}
                disabled={generatingAIQuestions}
                className="bg-blue-600 hover:bg-blue-700 text-white self-end"
              >
                {generatingAIQuestions ? 'Generating...' : 'Generate More'}
              </Button>
            </div>
          
            {/* Questions List */}
            <h3 className="text-lg font-semibold text-gray-300 mb-4">
              Questions ({questions.length})
            </h3>
            <div className="space-y-2">
              {questions.length > 0 ? (
                questions.map(question => (
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
                  </div>
                ))
              ) : (
                <div className="text-gray-400 text-sm italic">
                  No questions yet. Click "Generate AI Questions" to generate some.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function DomainPage() {
  const router = useRouter();
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
    
    const encodedDomainName = encodeURIComponent(formattedDomainName);
    
    // Fetch subdomains first
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/domains/${encodedDomainName}/subdomains`,
      { headers: { Authorization: `Bearer ${session.accessToken}` } }
    )
      .then(res => {
        if (!res.ok) {
          console.error(`Failed to fetch subdomains: HTTP ${res.status}`);
          throw new Error(`HTTP ${res.status}`);
        }
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
        
        // After getting subdomains, fetch the stats
        return fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/practice-questions/stats?domain=${encodedDomainName}`,
          { headers: { Authorization: `Bearer ${session.accessToken}` } }
        );
      })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(statsData => {
        // Update subdomains with stats
        setSubdomains(prev => {
          const updated = [...prev];
          
          // Loop through each subdomain and update with stats if available
          for (let i = 0; i < updated.length; i++) {
            const subdomain = updated[i];
            const stats = statsData.subdomains?.[subdomain.title];
            
            if (stats) {
              updated[i] = {
                ...subdomain,
                confidence: stats.confidence || 0,
                proficiency: stats.proficiency || 0
              };
            }
          }
          
          return updated;
        });
      })
      .catch(err => {
        console.error('Failed to fetch data:', err);
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
            <div className="flex items-center justify-between">
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