"use client";

import React from 'react';
import Image from 'next/image';
import { StaticImport } from 'next/dist/shared/lib/get-img-props';

interface TeamMember {
  name: string;
}

interface Instructor {
  name: string;
}

interface Advisor {
  name: string;
  affiliation: string;
}

interface Article {
  id: string;
  title: string;
  description: string;
  url?: string;
}

interface Resource {
  id: string;
  title: string;
  description: string;
  url?: string;
}

interface Reference {
  id: number;
  name: string;
  year: number;
  description: string;
  url: string;
}

interface ImageData {
  id: string;
  path: string;
  alt: string;
  caption: string;
}

const AboutPage: React.FC = () => {
  
    // Team information
  const teamMembers: TeamMember[] = [
    { name: 'Rino David' },
    { name: 'Jake Herweg' },
    { name: 'Domminic Mayer' },
    { name: 'Nolan Visitacion' }
  ];

  const instructors: Instructor[] = [
    { name: 'Sara Davis' },
    { name: 'Vinh Le' },
    { name: 'Levi Scully' }
  ];

  const advisors: Advisor[] = [
    { name: 'John Westhoff', affiliation: 'UNR School of Medicine' },
    { name: 'Emily Hand', affiliation: 'UNR Computer Science and Engineering' },
    { name: 'Ankita Shukla', affiliation: 'UNR Computer Science and Engineering' }
  ];

  const projectDate = 'December 13th, 2024';

  const images: ImageData[] = [
    { 
      id: 'image-1', 
      path: '/aboutPage/Architecture.png',
      alt: 'System architecture diagram of the MedPass platform', 
      caption: 'System Architecture: Overview of the MedPass platform and its components'
    },
    { 
      id: 'image-2', 
      path: '/aboutPage/Questions.png',
      alt: 'Quiz interface showing interactive questions and confidence tracking', 
      caption: 'Practice Quiz: Interactive question interface with confidence tracking'
    },
    { 
      id: 'image-3', 
      path: '/aboutPage/Stats.png',
      alt: 'Predictive analysis dashboard displaying student performance metrics', 
      caption: 'Predictive Analysis: Dashboard showcasing student performance metrics and insights'
    },
    { 
      id: 'image-4', 
      path: '/aboutPage/Poster.png',
      alt: 'MedPass Project Poster', 
      caption: 'MedPass Project Poster: Visual representation of the project goals and features'
    }
  ];

  // Articles and resources
  const articles: Article[] = [
    {
      id: '1',
      title: 'The Impact of the USMLE Step 1 Pass/Fail Scoring on Medical Education',
      description: 'This article revolves around a study on current students from the Penn State College of Medicine to field their perceptions on the transition to pass/fail scoring for Step 1 and their effects on students with regard to increasing anxiety and shifting attitudes on residency applications',
      url: 'https://pubmed.ncbi.nlm.nih.gov/39346123/' 
    },
    {
      id: '2',
      title: 'Predictive Models for Clinal Decision Making: Deep Dives in Practical Machine Learning',
      description: 'This paper examines the validity of using machine learning in clinical decision-making using two case studies, one where language models showed promise in predicting treatment outcomes in precision psychiatry and one where models outperformed traditional tools (International Prognostic Index) for lymphoma prediction.',
      url: 'https://pubmed.ncbi.nlm.nih.gov/39346123/' 
    },
    {
      id: '3',
      title: 'Higher Education-Oriented Recommendation Algorithm for Personalized Learning Resource',
      description: 'A study of 625 undergraduate students demonstrated significant performance improvements through a new personalized learning algorithm (Q-LRDP-D) that combines Q matrix theory with machine learning. This approach proved more effective than traditional benchmark methods like student-based collaborative filtering and content-based filtering, allowing students to achieve similar learning outcomes with fewer exercises.',
      url: 'https://online-journals.org/index.php/i-jet/article/view/33179' 
    }
  ];

  const resources: Resource[] = [
    {
      id: '4',
      title: 'USMLE Official Website',
      description: 'The official website for the United States Medical Licensing Examination (USMLE). Provides test materials/tips for Step 1, 2 and 3 exams, resources for interpreting test results, general information regarding the logistics of the test and other common questions about the test',
      url: 'https://www.usmle.org/step-exams/step-1' 
    },
    {
      id: '5',
      title: 'NBME Official Website',
      description: 'The official website for the National Board of Medical Examiners (NBME). Provides information on the USMLE, including test materials, resources for interpreting test results, and general information regarding the logistics of the test',
      url: 'https://www.nbme.org/'
    },
    {
      id: '6',
      title: 'Problem Domain Book: Machine Learning in Medicine: A Complete Overview by Ton J. Cleophas and Aeilko H. Zwinderman',
      description: 'This book covers a variety of machine learning methodologies, such as cluster models and neural networks and their applications in medical settings. Additionally, the authors do well to detail a wealth of background information for each approach, supplementing each with relevant clinical examples',
      url: 'https://www.amazon.com/Machine-Learning-Medicine-Complete-Overview/dp/3030339696' 
    }
  ];

  // References
  const references: Reference[] = [
    { 
      id: 1, 
      name: 'UWorld LLC',
      year: 2024,
      description: 'UWorld Medical - USMLE Step 1 Preparation',
      url: 'https://medical.uworld.com/usmle/usmle-step-1/'
    },
    { 
      id: 2, 
      name: 'AMBOSS GmbH',
      year: 2024,
      description: 'AMBOSS Medical Learning Platform',
      url: 'https://www.amboss.com/us'
    },
    { 
      id: 3, 
      name: 'Osmosis',
      year: 2024,
      description: 'Osmosis Medical Education Platform',
      url: 'https://www.osmosis.org/'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0f1520] text-white font-sans">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-6 bg-[#141c2e] p-4 rounded">
          <div className="flex items-center gap-4">
            <Image 
              src="/medpass_white.png" 
              alt="MEDPASS Logo" 
              width={50} 
              height={50} 
              className="h-10 w-auto"
              priority
            />
            <h1 className="text-3xl font-bold text-white mb-0">CSE-13 MEDPASS - Predictive Assessment for Student Success</h1>
          </div>
        </header>


        <section className="mb-8">
          <div className="rounded-lg bg-[#242e42] p-6 shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-white">Project Description</h2>
            <div className="text-gray-300 space-y-4">
              <p>The MedPass project aims to address the concerning decline in USMLE Step 1 examination performance among UNR medical students. The platform serves to supplement current learning resources and classes by utilizing predictive tools and machine learning models to analyze student performance data across multiple sources.</p>
              
              <p>Through identifying specific knowledge gaps that could be overlooked due to the pass/fail grading system, MedPass creates personalized learning plans that are tailored to each student's unique needs. By leverging AI/ML tools, our application restores agency and confidence to students by allowing them to discover and address weakness while also allowing faculty to garner valuable insight on the effectiveness of current curriculum.</p>
              
              <p>Students will be provided quizzes to aid in their academic studies; these quizzes will have a mix of questions created by faculty and generated by AI based on lectures and a student's current risk assessment. In addition, a contextually-trained chatbot will facilitate a conversation-based approach to learning.</p>
              
              <p>The platform analytics serve to benefit students but also faculty as well, who gain valuable insights into class/year-wide performance trends enabling targeted curriculum adjustments based on analysis. Student Tutors will also have access individual student reports, outlining current weaknesses for more effective instructional lessons.</p>
              
              <p>The MedPass program utilizes industry standard technologies and practices such as NextJS, Tailwind CSS, Pandas and more opening the door for continuous development and improvement. The project hopes to be an indispensable tool for a medical student's academic career as failing the USMLE Step 1 can dramatically alter a student's career trajectory and potentially reduce the already limited pool of new upcoming medical professionals.</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-white border-b border-[#2a3449] pb-2">Team & Advisors</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-lg bg-[#242e42] p-6 shadow-md">
              <h3 className="text-2xl font-bold mb-4 text-white">Team 13</h3>
              <ul className="space-y-2">
                {teamMembers.map((member, index) => (
                  <li key={`member-${index}`} className="text-gray-300">
                    {member.name}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg bg-[#242e42] p-6 shadow-md">
              <h3 className="text-2xl font-bold mb-4 text-white">Instructors</h3>
              <ul className="space-y-2">
                {instructors.map((instructor, index) => (
                  <li key={`instructor-${index}`} className="text-gray-300">
                    {instructor.name}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg bg-[#242e42] p-6 shadow-md">
              <h3 className="text-2xl font-bold mb-4 text-white">External Advisors</h3>
              <ul className="space-y-2">
                {advisors.map((advisor, index) => (
                  <li key={`advisor-${index}`} className="text-gray-300">
                    <span className="font-medium">{advisor.name}</span>
                    <span className="text-gray-400"> ({advisor.affiliation})</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 text-right text-gray-400">
            <p><strong>Project Date:</strong> {projectDate}</p>
          </div>
        </section>

        {/* Platform Features section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-white border-b border-[#2a3449] pb-2">Platform Features</h2>
          
          <div className="space-y-8">
            {images.map((image: { id: React.Key | null | undefined; path: string | StaticImport; alt: string; caption: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; }) => (
              <div key={image.id} className="rounded-lg bg-[#242e42] p-6 shadow-md">
                <div className="flex flex-col lg:flex-row gap-6 items-center">
                  <div className="w-full lg:w-2/3 rounded overflow-hidden">
                    {/* Image with next/image for optimization */}
                    <Image 
                      src={image.path}
                      alt={image.alt}
                      width={800}
                      height={450}
                      className="w-full h-auto object-cover"
                      // Below attributes for better accessibility
                      priority={true}
                      loading="eager"
                    />
                  </div>
                  <div className="w-full lg:w-1/3">
                    <h3 className="text-2xl font-bold mb-4 text-white">{image.caption}</h3>
                    <p className="text-gray-300">
                      {/* additional description *OPTIONAL* */}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-white border-b border-[#2a3449] pb-2">Literature Review</h2>
          
          <div className="space-y-8">
            {articles.map((article) => (
              <div key={article.id} className="rounded-lg bg-[#242e42] p-6 shadow-md">
                <h3 className="text-2xl font-bold mb-2 text-white">
                  Article {article.id}: {article.title}{' '}
                  <a 
                    href={article.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#3b82f6] hover:text-white transition-colors text-lg ml-1"
                    aria-label={`Link to article: ${article.title}`}
                  >
                    <span>↗</span>
                  </a>
                </h3>
                <p className="text-gray-300">{article.description}</p>
              </div>
            ))}

            {resources.map((resource) => (
              <div key={resource.id} className="rounded-lg bg-[#242e42] p-6 shadow-md">
                <h3 className="text-2xl font-bold mb-2 text-white">
                  {resource.title}{' '}
                  <a 
                    href={resource.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#3b82f6] hover:text-white transition-colors text-lg ml-1"
                    aria-label={`Link to resource: ${resource.title}`}
                  >
                    <span>↗</span>
                  </a>
                </h3>
                <p className="text-gray-300">{resource.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-white border-b border-[#2a3449] pb-2">Inspirations</h2>
          <div className="bg-[#242e42] rounded-lg p-6 shadow-md">
            <ol className="list-decimal list-inside space-y-3 text-gray-300">
              {references.map((reference) => (
                <li key={`ref-${reference.id}`} className="pl-2">
                  <span className="font-medium">{reference.name}</span> ({reference.year}). {reference.description}. Retrieved from{' '}
                  <a 
                    href={reference.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#3b82f6] hover:underline"
                  >
                    {reference.url}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;