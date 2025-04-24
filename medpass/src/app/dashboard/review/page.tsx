'use client';

// extends window (global object) to include currentQuestionIndex, used by Question component
declare global {
    interface Window {
      currentQuestionIndex?: number;
    }
  }

import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import Sidebar from '@/components/navbar';
import Question from '@/components/QuestionComp/Question';

// structure for user answer data
// plan to add timestamp
// replace questionIndex with questionID, link to userID, and that's a good format to store as a 'session instance' in db?
interface UserAnswer {
  questionIndex: number;
  selectedAnswer: string;
  confidenceLevel: string;
  isCorrect: boolean;
}

export default function DevPage() {
  // mock question data
  const questions = [
    {
      "Question": "What structure is indicated by the arrow in this chest X-ray?",
      "Answers": {
        "A": "Aortic arch",
        "B": "Left ventricle",
        "C": "Pulmonary artery",
        "D": "Right atrium"
      },
      "correct_option": "A",
      "Image_URL": "https://medical.uworld.com/wp-content/uploads/2024/12/MED_USMLE-Step-1_Carousel_01.webp",
      "Image_Description": "Chest X-ray with arrow pointing to aortic arch",
      "Explanation": "The arrow points to the aortic arch, which appears as a prominent curved structure in the upper left mediastinum on chest X-ray.",
      "Image_Dependent": true,
      "domain": "Social Sciences: Communication and Interpersonal Skills"
    },
    {
      "Question": "A 42-year-old female presents with fatigue, cold intolerance, and unexplained weight gain. Laboratory studies show elevated TSH and low free T4. Which of the following is the most likely diagnosis?",
      "Answers": {
        "A": "Graves' disease",
        "B": "Hashimoto's thyroiditis",
        "C": "Subacute thyroiditis",
        "D": "Thyroid storm"
      },
      "correct_option": "B",
      "Image_URL": "",
      "Image_Description": "",
      "Explanation": "The combination of elevated TSH and low free T4 indicates primary hypothyroidism. The most common cause of primary hypothyroidism in developed countries is Hashimoto's thyroiditis, an autoimmune disorder. The patient's symptoms of fatigue, cold intolerance, and weight gain are classic manifestations of hypothyroidism.",
      "Image_Dependent": false,
      "domain": "Reproductive & Endocrine Systems"
    },
    {
      "Question": "Which ECG finding is shown in this tracing of a patient presenting with chest pain?",
      "Answers": {
        "A": "Left bundle branch block",
        "B": "Right bundle branch block", 
        "C": "ST-segment elevation",
        "D": "Ventricular fibrillation"
      },
      "correct_option": "C",
      "Image_URL": "https://previews.123rf.com/images/thunderstock/thunderstock1810/thunderstock181000186/110838061-stop-gesture-focused-made-with-palm-by-mad-angry-indan-doctor-isolated-on-white-studio-background.jpg",
      "Image_Description": "12-lead ECG showing ST-segment elevation in leads V1-V4",
      "Explanation": "The ECG demonstrates ST-segment elevation in the anterior leads (V1-V4), consistent with an acute anterior ST-elevation myocardial infarction (STEMI), likely due to occlusion of the left anterior descending coronary artery.",
      "Image_Dependent": true,
      "domain": "Cardiovascular System"
    },
    {
      "Question": "Which neurotransmitter is primarily involved in the pathophysiology of Parkinson's disease?",
      "Answers": {
        "A": "Acetylcholine",
        "B": "Dopamine",
        "C": "GABA",
        "D": "Serotonin"
      },
      "correct_option": "B",
      "Image_URL": "",
      "Image_Description": "",
      "Explanation": "Parkinson's disease is characterized by the progressive degeneration of dopaminergic neurons in the substantia nigra pars compacta, leading to reduced dopamine levels in the basal ganglia. This dopamine deficiency results in the classic motor symptoms of Parkinson's disease, including bradykinesia, rigidity, and resting tremor.",
      "Image_Dependent": false,
      "domain": "Behavioral Health & Nervous Systems/Special Senses"
    },
    {
      "Question": "A 28-year-old male presents with fever, sore throat, and generalized lymphadenopathy for 10 days. Laboratory studies show atypical lymphocytes on peripheral blood smear and positive heterophile antibody test. Which of the following is the causative agent?",
      "Answers": {
        "A": "Cytomegalovirus",
        "B": "Epstein-Barr virus",
        "C": "Human herpesvirus 6",
        "D": "Toxoplasma gondii"
      },
      "correct_option": "B",
      "Image_URL": "",
      "Image_Description": "",
      "Explanation": "The clinical presentation of fever, sore throat, and generalized lymphadenopathy, along with atypical lymphocytes and a positive heterophile antibody test, is characteristic of infectious mononucleosis. Epstein-Barr virus (EBV) is the most common cause of infectious mononucleosis and is associated with a positive heterophile antibody test (Monospot).",
      "Image_Dependent": false,
      "domain": "Blood & Lymphoreticular/Immune Systems"
    }
  ];

  //--- state variables ---
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);

//--- localstorage functions ---
const saveQuizState = () => {
    const quizState = {
      currentQuestionIndex,
      userAnswers,
      answeredQuestions,
      score
    };
    localStorage.setItem('reviewSessionState', JSON.stringify(quizState));
  };
  
  const loadQuizState = () => {
    const savedState = localStorage.getItem('reviewSessionState');
    if (savedState) {
      try {
        const { currentQuestionIndex, userAnswers, answeredQuestions, score } = JSON.parse(savedState);
        setCurrentQuestionIndex(currentQuestionIndex);
        setUserAnswers(userAnswers);
        setAnsweredQuestions(answeredQuestions);
        setScore(score);
        return true;
      } catch (error) {
        console.error('Error parsing saved quiz state', error);
      }
    }
    return false;
  };
  
  //--- navigation Functions ---
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  //--- helper Functions ---
  const getCurrentQuestionAnswerData = () => {
    return userAnswers.find(answer => answer.questionIndex === currentQuestionIndex);
  };
  
  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setAnsweredQuestions([]);
    setUserAnswers([]);
    setScore(0);
    localStorage.removeItem('reviewSessionState');
  };
  
  //--- calculated properties ---
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isCurrentQuestionAnswered = answeredQuestions.includes(currentQuestionIndex);
  const isQuizCompleted = answeredQuestions.length === questions.length;
  
  //---effect hooks and listeners ---
  
  // load saved state when component mounts
  // '[]' as second argument ensures this effect runs only once
  useEffect(() => {
    loadQuizState();
  }, []);
  
  // save state whenever key state variables changes
  useEffect(() => {
    saveQuizState();
  }, [currentQuestionIndex, userAnswers, answeredQuestions, score]);
  
  // update global window prop to track current question index
  useEffect(() => {
    window.currentQuestionIndex = currentQuestionIndex;
  }, [currentQuestionIndex]);
  
  // question answered event listener
  useEffect(() => {
    const handleQuestionAnswered = (event: CustomEvent<any>) => {
      const { questionIndex, isCorrect, selectedAnswer, confidenceLevel } = event.detail;
      
      // updates answered questions tracking if not already included
      if (!answeredQuestions.includes(questionIndex)) {
        setAnsweredQuestions(prev => [...prev, questionIndex]);
        
        // updates score if correct
        if (isCorrect) {
          setScore(prevScore => prevScore + 1);
        }
      }
      
      // stores user answer data
      setUserAnswers(prev => {
        // removes any existing answer for this question
        const filteredAnswers = prev.filter(answer => answer.questionIndex !== questionIndex);
        // adds new answer
        return [...filteredAnswers, { 
          questionIndex, 
          isCorrect, 
          selectedAnswer, 
          confidenceLevel 
        }];
      });
    };
  
    // listen for custom event from the Question component
    window.addEventListener('questionAnswered', handleQuestionAnswered as EventListener);
    
    return () => {
      window.removeEventListener('questionAnswered', handleQuestionAnswered as EventListener);
    };
  }, [answeredQuestions]);

  return (
    <div className="min-h-screen bg-gray-900 text-slate-100 p-4">
        <Sidebar />
      {/* Progress header */}
      <div className="container mx-auto mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
          <h1 className="text-2xl font-bold mb-2 md:mb-0">Medical Quiz [DEMO]</h1>
          <div className="flex flex-col w-full md:w-auto md:flex-row items-center gap-4">
            <span className="text-slate-400">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <div className="w-full md:w-64 h-2 bg-slate-800 rounded-full">
              <div 
                className="h-full bg-blue-600 rounded-full" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <span className="text-slate-400">
              Score: {score}/{answeredQuestions.length}
            </span>
          </div>
        </div>
      </div>

      {/* Current Question */}
      <div className="container mx-auto mb-6">
        {/* Pass answer data only if this specific question has been answered */}
        {/* use a key to ensure proper re-rendering when switching questions */}
        <Question 
          key={`question-${currentQuestionIndex}`}
          questionData={questions[currentQuestionIndex]}
          ShowFeedback={isCurrentQuestionAnswered}
          savedAnswer={isCurrentQuestionAnswered ? (getCurrentQuestionAnswerData()?.selectedAnswer || "") : ""}
          savedConfidenceLevel={isCurrentQuestionAnswered ? (getCurrentQuestionAnswerData()?.confidenceLevel || "") : ""}
        />

        {/* Navigation buttons */}
        <div className="flex justify-between mt-6">
          <Button 
            variant="outline" 
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          
          <Button 
            onClick={handleNextQuestion}
            disabled={currentQuestionIndex === questions.length - 1}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Next <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quiz Summary*/}
      {isQuizCompleted && (
        <div className="container mx-auto mt-8">
          <Card className="bg-slate-900 border-slate-800 text-slate-100">
            <CardHeader>
              <h2 className="text-2xl font-bold">Quiz Complete!</h2>
            </CardHeader>
            <CardContent>
              <p className="text-xl mb-4">
                Your final score: {score}/{questions.length} ({Math.round((score/questions.length) * 100)}%)
              </p>
              
              {/* Question Summary */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Question Summary:</h3>
                <div className="space-y-2">
                  {questions.map((q, index) => {
                    const answer = userAnswers.find(a => a.questionIndex === index);
                    return (
                      <div key={index} className="flex items-center space-x-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          answer
                            ? (answer.isCorrect ? "bg-green-600" : "bg-red-600") 
                            : "bg-slate-700"
                        }`}>
                          {index + 1}
                        </div>
                        <span className="truncate max-w-md">{q.Question.substring(0, 60)}...</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={resetQuiz}
              >
                Retake Quiz
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}