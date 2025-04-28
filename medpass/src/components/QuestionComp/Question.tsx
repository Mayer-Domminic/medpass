'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// Import from shared interface and utility files
import { QuestionProps, confidenceLevels } from '@/types/review';
import {
  checkIfCorrect,
  getCorrectAnswerCount,
  shouldDisplayImage,
  getGradeClassificationName,
} from '@/lib/reviewUtils';

// extends window to include custom attribute, currentQuestionIndex
declare global {
  interface Window {
    currentQuestionIndex?: number;
  }
}

const Question = ({
  questionData,
  showFeedback = false,
  savedAnswers = [],
  savedConfidenceLevel = ""
}: QuestionProps) => {
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [confidenceLevel, setConfidenceLevel] = useState(savedConfidenceLevel);
  const [isShowingFeedback, setIsShowingFeedback] = useState(showFeedback);
  const [isCorrect, setIsCorrect] = useState(false);

  // update state when props change - making sure component stays in sync with parent
  useEffect(() => {
    console.log("Question component received savedAnswers:", savedAnswers);

    // Only update selected answers if savedAnswers exists and is an array
    if (Array.isArray(savedAnswers)) {
      setSelectedAnswers([...savedAnswers]); // Create a new array to ensure state update
    } else {
      setSelectedAnswers([]);
    }

    setConfidenceLevel(savedConfidenceLevel);
    setIsShowingFeedback(showFeedback);

    if (showFeedback && Array.isArray(savedAnswers) && savedAnswers.length > 0 && questionData) {
      setIsCorrect(checkIfCorrect(savedAnswers, questionData.Options));
    } else {
      setIsCorrect(false);
    }
  }, [questionData, savedAnswers, savedConfidenceLevel, showFeedback]);

  // Handle option change for multiple/single answer selection
  const handleOptionChange = (optionId: number) => {
    if (!isShowingFeedback) {
      // Check if this is a single-answer question (only one correct answer)
      const isSingleAnswerQuestion = getCorrectAnswerCount(questionData) === 1;

      setSelectedAnswers(prev => {
        if (prev.includes(optionId)) {
          // Remove option if already selected
          return prev.filter(id => id !== optionId);
        } else {
          // For single-answer questions, replace the current selection
          // For multiple-answer questions, add to the current selection
          if (isSingleAnswerQuestion) {
            return [optionId];
          } else {
            return [...prev, optionId];
          }
        }
      });
    }
  };

  const handleSubmit = () => {
    console.log("Submit button clicked");
    console.log("Selected Answers:", selectedAnswers);
    console.log("Confidence Level:", confidenceLevel);
    console.log("Is Showing Feedback:", isShowingFeedback);

    // Make sure we have both answers and confidence level
    if (selectedAnswers.length === 0 || !confidenceLevel) {
      console.log("Missing required inputs - not submitting");
      return;
    }

    // Check if the selected answers match the correct answers
    const correct = questionData && questionData.Options ? checkIfCorrect(selectedAnswers, questionData.Options) : false;
    setIsCorrect(correct);
    setIsShowingFeedback(true);

    console.log("Dispatching event with data:", {
      questionIndex: window.currentQuestionIndex || 0,
      isCorrect: correct,
      selectedAnswers,
      confidenceLevel
    });

    // Create and dispatch the custom event
    const event = new CustomEvent('questionAnswered', {
      detail: {
        questionIndex: window.currentQuestionIndex || 0,
        isCorrect: correct,
        selectedAnswers,
        confidenceLevel
      }
    });

    window.dispatchEvent(event);
    console.log("Event dispatched");
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-slate-900 text-slate-100 border-slate-800 cursor-default">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start w-full">
          <div className="text-2xl font-bold tracking-tight">Question</div>
          <div className="flex space-x-2">
            {/* Display the GradeClassification if available */}
            {questionData && questionData.GradeClassification && (
              <Badge
                variant="outline"
                className="bg-blue-900 text-blue-300"
              >
                {getGradeClassificationName(questionData)}
              </Badge>
            )}

            {questionData && questionData.Question && (
              <Badge
                variant="outline"
                className="bg-slate-800 text-slate-400"
              >
                {questionData.Question.QuestionDifficulty}
              </Badge>
            )}
          </div>
        </div>

        {/* Question Text Section*/}
        <div className="pb-6">
          <p className="text-base text-slate-400 mt-2">
            {questionData && questionData.Question ? questionData.Question.Prompt : ''}
          </p>
          {questionData && getCorrectAnswerCount(questionData) > 1 && (
            <p className="text-sm text-blue-400 mt-2">
              Select all that apply. ({getCorrectAnswerCount(questionData)} correct answers)
            </p>
          )}
        </div>

        {/* Image Section */}
        {questionData && shouldDisplayImage(questionData) && (
          <div className="mt-6 pt-4 border-t border-slate-700 rounded-md overflow-hidden">
            {questionData.Question.ImageUrl ? (
              <div className="flex flex-col items-center">
                <img
                  src={questionData.Question.ImageUrl}
                  alt={questionData.Question.ImageDescription || "Question image"}
                  className="max-w-full rounded-md max-h-96 object-contain bg-slate-800"
                />
                {questionData.Question.ImageDescription && (
                  <p className="mt-2 text-sm italic text-slate-400">{questionData.Question.ImageDescription}</p>
                )}
              </div>
            ) : (
              <div className="p-4 bg-slate-800 rounded-md text-slate-300">
                <p className="italic text-sm">[Image: {questionData.Question.ImageDescription}]</p>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Answer Options - Custom implementation for multiple selection */}
        <div className="space-y-3">
          {questionData && questionData.Options && questionData.Options.map(option => {
            // determines if option is selected, correct, or incorrect
            const isSelected = selectedAnswers.includes(option.OptionID);
            const isCorrectOption = option.CorrectAnswer;

            // sets bg color based on feedback state
            let bgColor = isSelected ? 'bg-slate-800 border border-slate-600' : '';
            let textColor = isSelected ? 'text-slate-100' : 'text-slate-300';

            if (isShowingFeedback) {
              if (isCorrectOption) {
                if (isSelected) {
                  // Correct and selected - green
                  bgColor = 'bg-green-900/50 border border-green-600';
                  textColor = 'text-green-400';
                } else {
                  // Correct but not selected - gray
                  bgColor = 'bg-slate-700/50 border border-slate-500';
                  textColor = 'text-slate-400';
                }
              } else if (isSelected) {
                // Selected but incorrect - red
                bgColor = 'bg-red-900/50 border border-red-600';
                textColor = 'text-red-400';
              }
            }

            return (
              <div
                key={option.OptionID}
                className={`flex items-start space-x-2 p-3 rounded-lg transition-all duration-200 ${bgColor}`}
              >
                <div
                  className={`w-5 h-5 mt-0.5 flex-shrink-0 border ${isSelected ? 'bg-slate-700 border-slate-400' : 'border-slate-600'
                    } rounded ${getCorrectAnswerCount(questionData) > 1 ? 'rounded-md' : 'rounded-full'
                    } flex items-center justify-center ${isShowingFeedback && isCorrectOption ? 'border-green-500' : ''
                    } ${isShowingFeedback && isSelected && !isCorrectOption ? 'border-red-500' : ''
                    } ${isShowingFeedback && isCorrectOption && !isSelected ? 'border-slate-500' : ''
                    } transition-all duration-200`}
                  onClick={() => !isShowingFeedback && handleOptionChange(option.OptionID)}
                >
                  {isSelected && (
                    <div className={`${getCorrectAnswerCount(questionData) > 1
                      ? 'w-3 h-3 flex items-center justify-center text-xs'
                      : 'w-3 h-3 rounded-full'
                      } ${isShowingFeedback && isCorrectOption
                        ? 'bg-green-500'
                        : (isShowingFeedback && !isCorrectOption ? 'bg-red-500' : 'bg-blue-500')
                      }`}>
                      {getCorrectAnswerCount(questionData) > 1 && (
                        <span className="text-white">✓</span>
                      )}
                    </div>
                  )}
                  {isShowingFeedback && isCorrectOption && !isSelected && (
                    <div className={`${getCorrectAnswerCount(questionData) > 1
                      ? 'w-3 h-3 flex items-center justify-center text-xs'
                      : 'w-3 h-3 rounded-full'
                      } bg-slate-500`}>
                      {getCorrectAnswerCount(questionData) > 1 && (
                        <span className="text-white">✓</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Label
                    className={`flex-grow cursor-pointer ${textColor} ${isShowingFeedback && isCorrectOption && !isSelected ? 'text-slate-500' : ''
                      } ${!isShowingFeedback ? 'hover:text-slate-100' : ''} transition-all duration-200`}
                    onClick={() => !isShowingFeedback && handleOptionChange(option.OptionID)}
                  >
                    {option.OptionDescription}
                  </Label>

                  {/* Show explanation when feedback is shown */}
                  {isShowingFeedback && (
                    <p className={`mt-1 text-sm ${isCorrectOption
                      ? isSelected ? 'text-green-400' : 'text-slate-500'
                      : 'text-slate-400'
                      }`}>
                      {option.Explanation}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8">
          <div className="text-xs tracking-wider text-slate-400 uppercase mb-3">
            Confidence Level
          </div>
          <div className="flex w-full justify-between gap-2 transition-all duration-200">
            {confidenceLevels.map((level) => (
              <Button
                key={level.id}
                className={`flex-1 font-medium flex flex-col items-center justify-center py-4 h-auto transition-all duration-200 ${confidenceLevel === level.id
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
            className={`w-full py-2 transition-all duration-200 ${isShowingFeedback
              ? 'bg-slate-700 text-slate-300 cursor-not-allowed'
              : selectedAnswers.length > 0 && confidenceLevel
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            onClick={handleSubmit}
            disabled={selectedAnswers.length === 0 || !confidenceLevel || isShowingFeedback}
          >
            {isShowingFeedback ? 'Submitted' : 'Submit Answer'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Question;