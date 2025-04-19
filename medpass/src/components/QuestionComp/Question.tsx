import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

// extends window to include custom attribute, currentQuestionIndex
declare global {
  interface Window {
    currentQuestionIndex?: number;
  }
}

interface QuestionData {
  Question: string;
  Answers: { [key: string]: string };
  correct_option: string;
  Image_Description: string;
  Image_URL: string; //URLs currently but can be changed depending on where we ultimately decide to store images
  Explanation: string;
  Image_Dependent: boolean;
  domain: string;
}

interface QuestionProps {
  questionData: QuestionData;
  showFeedback?: boolean;
  savedAnswer?: string;
  savedConfidenceLevel?: string;
}

const Question = ({ 
  questionData, 
  showFeedback = false, 
  savedAnswer = "", 
  savedConfidenceLevel = "" 
}: QuestionProps) => {
  const [selectedAnswer, setSelectedAnswer] = useState(savedAnswer);
  const [confidenceLevel, setConfidenceLevel] = useState(savedConfidenceLevel);
  const [isShowingFeedback, setIsShowingFeedback] = useState(showFeedback);
  const [isCorrect, setIsCorrect] = useState(false);

  // update state when props change
  useEffect(() => {
    setSelectedAnswer(savedAnswer);
    setConfidenceLevel(savedConfidenceLevel);
    setIsShowingFeedback(showFeedback);
    
    if (showFeedback && savedAnswer && questionData) {
      setIsCorrect(savedAnswer === questionData.correct_option);
    } else {
      setIsCorrect(false);
    }
  }, [questionData, savedAnswer, savedConfidenceLevel, showFeedback]);

  const domainAbbreviations = {
    "Human Development": "HDEV",
    "Blood & Lymphoreticular/Immune Systems": "BLIS",
    "Behavioral Health & Nervous Systems/Special Senses": "BHNS",
    "Musculoskeletal, Skin & Subcutaneous Tissue": "MSST",
    "Cardiovascular System": "CVS",
    "Respiratory & Renal/Urinary Systems": "RRUS",
    "Gastrointestinal System": "GIS",
    "Reproductive & Endocrine Systems": "RES",
    "Multisystem Processes & Disorders": "MPD",
    "Biostatistics & Epidemiology/Population Health": "BEPH",
    "Social Sciences: Communication and Interpersonal Skills": "SSCIS"
  };

  const data = questionData;
  
  const confidenceLevels = [
    { id: "very-bad", label: "Very Bad" },
    { id: "bad", label: "Bad" },
    { id: "neutral", label: "Neutral" },
    { id: "good", label: "Good" },
    { id: "very-good", label: "Very Good" }
  ];
  
  const handleSubmit = () => {
    const correct = selectedAnswer === data.correct_option;
    setIsCorrect(correct);
    setIsShowingFeedback(true);
    
    window.dispatchEvent(new CustomEvent('questionAnswered', { 
      detail: { 
        questionIndex: window.currentQuestionIndex || 0,
        isCorrect: correct,
        selectedAnswer,
        confidenceLevel
      } 
    }));
  };
  
  //helper functions
  //determines if images should be displayed
  const shouldDisplayImage = () => {
    return data.Image_Dependent && (data.Image_URL || data.Image_Description);
  };
  
  //gets abbreviation from domain
  const getDomainAbbreviation = (domain: string) => {
    if (!domain) return "";
    
    //returns abbreviation if exists, otherwise returns "OTHER"
    return domainAbbreviations[domain as keyof typeof domainAbbreviations] || "OTHER";
  };
  
  return (
    <Card className="w-full max-w-2xl mx-auto bg-slate-900 text-slate-100 border-slate-800 cursor-default">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start w-full">
          <div className="text-2xl font-bold tracking-tight">Question</div>
          {data.domain && (
            <div className="rounded-full bg-slate-700 px-3 py-1 text-xs font-medium text-slate-300 whitespace-nowrap" title={data.domain}>
              {getDomainAbbreviation(data.domain)}
            </div>
          )}
        </div>
        
        {/* Question Text Section*/}
        <div className="pb-6">
          <p className="text-base text-slate-400 mt-2">
            {data.Question}
          </p>
        </div>
        
        {/* Image Section - displayed when shouldDisplayImage*/}
        {shouldDisplayImage() && (
          <div className="mt-6 pt-4 border-t border-slate-700 rounded-md overflow-hidden">
            {data.Image_URL ? (
              <div className="flex flex-col items-center">
                <img 
                  src={data.Image_URL} 
                  alt={data.Image_Description || "Question image"} 
                  className="max-w-full rounded-md max-h-96 object-contain bg-slate-800"
                />
                {data.Image_Description && (
                  <p className="mt-2 text-sm italic text-slate-400">{data.Image_Description}</p>
                )}
              </div>
            ) : (
              <div className="p-4 bg-slate-800 rounded-md text-slate-300">
                <p className="italic text-sm">[Image: {data.Image_Description}]</p>
              </div>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {Object.entries(data.Answers).map(([option, text]) => {
            // determines if option is selected, correct, or incorrect
            const isSelected = selectedAnswer === option;
            const isCorrectOption = option === data.correct_option;
           
            // sets bg color based on feedback state
            let bgColor = isSelected ? 'bg-slate-800 border border-slate-600' : '';
            let textColor = isSelected ? 'text-slate-100' : 'text-slate-300';
           
            if (isShowingFeedback) {
              if (isCorrectOption) {
                bgColor = 'bg-green-900/50 border border-green-600';
                textColor = isCorrectOption ? 'text-green-400' : textColor;
              } else if (isSelected && !isCorrectOption) {
                bgColor = 'bg-red-900/50 border border-red-600';
                textColor = 'text-red-400';
              }
            }
           
            return (
              <div
                key={option}
                className={`flex items-center space-x-2 p-2 rounded-lg transition-all duration-200 ${bgColor}`}
              >
                <div
                  className={`w-4 h-4 rounded-full border ${isSelected ? 'border-slate-400' : 'border-slate-600'} flex items-center justify-center ${isShowingFeedback && isCorrectOption ? 'border-green-500' : ''} ${isShowingFeedback && isSelected && !isCorrectOption ? 'border-red-500' : ''} transition-all duration-200`}
                  onClick={() => !isShowingFeedback && setSelectedAnswer(option)}
                >
                  {isSelected && (
                    <div className={`w-2 h-2 rounded-full ${isShowingFeedback && isCorrectOption ? 'bg-green-500' : (isShowingFeedback && !isCorrectOption ? 'bg-red-500' : 'bg-blue-500')}`}></div>
                  )}
                  {isShowingFeedback && isCorrectOption && !isSelected && (
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  )}
                </div>
                <Label
                  className={`flex-grow cursor-pointer ${textColor} ${!isShowingFeedback ? 'hover:text-slate-100' : ''} transition-all duration-200`}
                  onClick={() => !isShowingFeedback && setSelectedAnswer(option)}
                >
                  <span className="font-medium">{option}.</span> {text}
                </Label>
              </div>
            );
          })}
        </div>
       
        {/* Explanation*/}
        <div 
          className={`transition-all duration-500 ease-in-out overflow-hidden ${
            isShowingFeedback 
              ? 'mt-6 mb-6 pt-4 max-h-96 opacity-100 transform translate-y-0 border-t border-slate-700' 
              : 'mt-0 mb-0 pt-0 max-h-0 opacity-0 transform -translate-y-4 border-t-0'
          }`}
        >
          <h3 className="text-lg font-medium text-slate-200 mb-2">
            Explanation
          </h3>
          <p className="text-slate-400">
            {data.Explanation}
          </p>
        </div>
       
        <div className="mt-8">
          <div className="text-xs tracking-wider text-slate-400 uppercase mb-3">
            Confidence Level
          </div>
          <div className="flex w-full justify-between gap-2 transition-all duration-200">
            {confidenceLevels.map((level) => (
              <Button
                key={level.id}
                className={`flex-1 font-medium flex flex-col items-center justify-center py-4 h-auto transition-all duration-200 ${
                  confidenceLevel === level.id
                    ? 'bg-slate-600 text-slate-100 ring-2 ring-white'
                    : 'bg-slate-800 text-slate-300'
                } ${isShowingFeedback && confidenceLevel !== level.id ? 'opacity-80 hover:bg-slate-800 hover:text-slate-300' : 'hover:bg-slate-700'}`}
                onClick={() => !isShowingFeedback && setConfidenceLevel(level.id)}
                disabled={isShowingFeedback}
              >
                <span className="mt-2 mb-2">
                  {level.label}
                </span>
              </Button>
            ))}
          </div>
        </div>
        
        <div className="mt-6">
          <Button 
            className={`w-full py-2 transition-all duration-200 ${
              isShowingFeedback 
                ? 'bg-slate-700 text-slate-300 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            onClick={handleSubmit}
            disabled={!selectedAnswer || !confidenceLevel || isShowingFeedback}
          >
            {isShowingFeedback ? 'Submitted' : 'Submit Answer'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Question;
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

// extends window to include custom attribute, currentQuestionIndex
declare global {
  interface Window {
    currentQuestionIndex?: number;
  }
}

interface QuestionData {
  Question: string;
  Answers: { [key: string]: string };
  correct_option: string;
  Image_Description: string;
  Image_URL: string; //URLs currently but can be changed depending on where we ultimately decide to store images
  Explanation: string;
  Image_Dependent: boolean;
  domain: string;
}

interface QuestionProps {
  questionData: QuestionData;
  showFeedback?: boolean;
  savedAnswer?: string;
  savedConfidenceLevel?: string;
}

const Question = ({ 
  questionData, 
  showFeedback = false, 
  savedAnswer = "", 
  savedConfidenceLevel = "" 
}: QuestionProps) => {
  const [selectedAnswer, setSelectedAnswer] = useState(savedAnswer);
  const [confidenceLevel, setConfidenceLevel] = useState(savedConfidenceLevel);
  const [isShowingFeedback, setIsShowingFeedback] = useState(showFeedback);
  const [isCorrect, setIsCorrect] = useState(false);

  // update state when props change
  useEffect(() => {
    setSelectedAnswer(savedAnswer);
    setConfidenceLevel(savedConfidenceLevel);
    setIsShowingFeedback(showFeedback);
    
    if (showFeedback && savedAnswer && questionData) {
      setIsCorrect(savedAnswer === questionData.correct_option);
    } else {
      setIsCorrect(false);
    }
  }, [questionData, savedAnswer, savedConfidenceLevel, showFeedback]);

  const domainAbbreviations = {
    "Human Development": "HDEV",
    "Blood & Lymphoreticular/Immune Systems": "BLIS",
    "Behavioral Health & Nervous Systems/Special Senses": "BHNS",
    "Musculoskeletal, Skin & Subcutaneous Tissue": "MSST",
    "Cardiovascular System": "CVS",
    "Respiratory & Renal/Urinary Systems": "RRUS",
    "Gastrointestinal System": "GIS",
    "Reproductive & Endocrine Systems": "RES",
    "Multisystem Processes & Disorders": "MPD",
    "Biostatistics & Epidemiology/Population Health": "BEPH",
    "Social Sciences: Communication and Interpersonal Skills": "SSCIS"
  };

  const data = questionData;
  
  const confidenceLevels = [
    { id: "very-bad", label: "Very Bad" },
    { id: "bad", label: "Bad" },
    { id: "neutral", label: "Neutral" },
    { id: "good", label: "Good" },
    { id: "very-good", label: "Very Good" }
  ];
  
  const handleSubmit = () => {
    const correct = selectedAnswer === data.correct_option;
    setIsCorrect(correct);
    setIsShowingFeedback(true);
    
    window.dispatchEvent(new CustomEvent('questionAnswered', { 
      detail: { 
        questionIndex: window.currentQuestionIndex || 0,
        isCorrect: correct,
        selectedAnswer,
        confidenceLevel
      } 
    }));
  };
  
  //helper functions
  //determines if images should be displayed
  const shouldDisplayImage = () => {
    return data.Image_Dependent && (data.Image_URL || data.Image_Description);
  };
  
  //gets abbreviation from domain
  const getDomainAbbreviation = (domain) => {
    if (!domain) return "";
    
    //returns abbreviation if exists, otherwise returns "OTHER"
    return domainAbbreviations[domain] || "OTHER";
  };
  
  return (
    <Card className="w-full max-w-2xl mx-auto bg-slate-900 text-slate-100 border-slate-800 cursor-default">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start w-full">
          <div className="text-2xl font-bold tracking-tight">Question</div>
          {data.domain && (
            <div className="rounded-full bg-slate-700 px-3 py-1 text-xs font-medium text-slate-300 whitespace-nowrap" title={data.domain}>
              {getDomainAbbreviation(data.domain)}
            </div>
          )}
        </div>
        
        {/* Question Text Section*/}
        <div className="pb-6">
          <p className="text-base text-slate-400 mt-2">
            {data.Question}
          </p>
        </div>
        
        {/* Image Section - displayed when shouldDisplayImage*/}
        {shouldDisplayImage() && (
          <div className="mt-6 pt-4 border-t border-slate-700 rounded-md overflow-hidden">
            {data.Image_URL ? (
              <div className="flex flex-col items-center">
                <img 
                  src={data.Image_URL} 
                  alt={data.Image_Description || "Question image"} 
                  className="max-w-full rounded-md max-h-96 object-contain bg-slate-800"
                />
                {data.Image_Description && (
                  <p className="mt-2 text-sm italic text-slate-400">{data.Image_Description}</p>
                )}
              </div>
            ) : (
              <div className="p-4 bg-slate-800 rounded-md text-slate-300">
                <p className="italic text-sm">[Image: {data.Image_Description}]</p>
              </div>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {Object.entries(data.Answers).map(([option, text]) => {
            // determines if option is selected, correct, or incorrect
            const isSelected = selectedAnswer === option;
            const isCorrectOption = option === data.correct_option;
           
            // sets bg color based on feedback state
            let bgColor = isSelected ? 'bg-slate-800 border border-slate-600' : '';
            let textColor = isSelected ? 'text-slate-100' : 'text-slate-300';
           
            if (isShowingFeedback) {
              if (isCorrectOption) {
                bgColor = 'bg-green-900/50 border border-green-600';
                textColor = isCorrectOption ? 'text-green-400' : textColor;
              } else if (isSelected && !isCorrectOption) {
                bgColor = 'bg-red-900/50 border border-red-600';
                textColor = 'text-red-400';
              }
            }
           
            return (
              <div
                key={option}
                className={`flex items-center space-x-2 p-2 rounded-lg transition-all duration-200 ${bgColor}`}
              >
                <div
                  className={`w-4 h-4 rounded-full border ${isSelected ? 'border-slate-400' : 'border-slate-600'} flex items-center justify-center ${isShowingFeedback && isCorrectOption ? 'border-green-500' : ''} ${isShowingFeedback && isSelected && !isCorrectOption ? 'border-red-500' : ''} transition-all duration-200`}
                  onClick={() => !isShowingFeedback && setSelectedAnswer(option)}
                >
                  {isSelected && (
                    <div className={`w-2 h-2 rounded-full ${isShowingFeedback && isCorrectOption ? 'bg-green-500' : (isShowingFeedback && !isCorrectOption ? 'bg-red-500' : 'bg-blue-500')}`}></div>
                  )}
                  {isShowingFeedback && isCorrectOption && !isSelected && (
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  )}
                </div>
                <Label
                  className={`flex-grow cursor-pointer ${textColor} ${!isShowingFeedback ? 'hover:text-slate-100' : ''} transition-all duration-200`}
                  onClick={() => !isShowingFeedback && setSelectedAnswer(option)}
                >
                  <span className="font-medium">{option}.</span> {text}
                </Label>
              </div>
            );
          })}
        </div>
       
        {/* Explanation*/}
        <div 
          className={`transition-all duration-500 ease-in-out overflow-hidden ${
            isShowingFeedback 
              ? 'mt-6 mb-6 pt-4 max-h-96 opacity-100 transform translate-y-0 border-t border-slate-700' 
              : 'mt-0 mb-0 pt-0 max-h-0 opacity-0 transform -translate-y-4 border-t-0'
          }`}
        >
          <h3 className="text-lg font-medium text-slate-200 mb-2">
            Explanation
          </h3>
          <p className="text-slate-400">
            {data.Explanation}
          </p>
        </div>
       
        <div className="mt-8">
          <div className="text-xs tracking-wider text-slate-400 uppercase mb-3">
            Confidence Level
          </div>
          <div className="flex w-full justify-between gap-2 transition-all duration-200">
            {confidenceLevels.map((level) => (
              <Button
                key={level.id}
                className={`flex-1 font-medium flex flex-col items-center justify-center py-4 h-auto transition-all duration-200 ${
                  confidenceLevel === level.id
                    ? 'bg-slate-600 text-slate-100 ring-2 ring-white'
                    : 'bg-slate-800 text-slate-300'
                } ${isShowingFeedback && confidenceLevel !== level.id ? 'opacity-80 hover:bg-slate-800 hover:text-slate-300' : 'hover:bg-slate-700'}`}
                onClick={() => !isShowingFeedback && setConfidenceLevel(level.id)}
                disabled={isShowingFeedback}
              >
                <span className="mt-2 mb-2">
                  {level.label}
                </span>
              </Button>
            ))}
          </div>
        </div>
        
        <div className="mt-6">
          <Button 
            className={`w-full py-2 transition-all duration-200 ${
              isShowingFeedback 
                ? 'bg-slate-700 text-slate-300 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            onClick={handleSubmit}
            disabled={!selectedAnswer || !confidenceLevel || isShowingFeedback}
          >
            {isShowingFeedback ? 'Submitted' : 'Submit Answer'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Question;