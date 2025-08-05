'use client';

import React, { useState, useEffect } from 'react';
import { Shuffle, RotateCcw, Check, X, Trophy } from 'lucide-react';
import vocabDataRaw from '../../../data/first-100-words.json' assert { type: 'json' };


// Define types
type VocabPair = [string, string];
type Mode = 'tajik-to-english' | 'english-to-tajik';

// Type the imported data
const vocabData = vocabDataRaw as VocabPair[];
const TajikVocabApp: React.FC = () => {

  const [currentQuestion, setCurrentQuestion] = useState<VocabPair | null>(null);
  const [options, setOptions] = useState<VocabPair[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<VocabPair | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [score, setScore] = useState(0);
  const [mode, setMode] = useState<Mode>('tajik-to-english');
  const [quizComplete, setQuizComplete] = useState(false);
  const [usedQuestions, setUsedQuestions] = useState<VocabPair[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);

  const generateQuestion = () => {
    setSelectedAnswer(null);
    setShowResult(false);

    let availableQuestions = vocabData.filter(
      item => !usedQuestions.some(used => used[0] === item[0])
    );

    if (availableQuestions.length === 0) {
      availableQuestions = vocabData;
      setUsedQuestions([]);
    }

    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const correctAnswer = availableQuestions[randomIndex];
    setUsedQuestions(prev => [...prev, correctAnswer]);

    const wrongOptions: VocabPair[] = [];
    while (wrongOptions.length < 3) {
      const randomWrong = vocabData[Math.floor(Math.random() * vocabData.length)];
      if (
        randomWrong[0] !== correctAnswer[0] &&
        !wrongOptions.some(opt => opt[0] === randomWrong[0])
      ) {
        wrongOptions.push(randomWrong);
      }
    }

    const allOptions = [correctAnswer, ...wrongOptions].sort(() => Math.random() - 0.5);
    setCurrentQuestion(correctAnswer);
    setOptions(allOptions);
  };

  const handleAnswerSelect = (option: VocabPair) => {
    if (showResult || !currentQuestion) return;

    setSelectedAnswer(option);
    setShowResult(true);

    if (option[0] === currentQuestion[0]) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (questionNumber >= 20) {
      setQuizComplete(true);
    } else {
      setQuestionNumber(prev => prev + 1);
      generateQuestion();
    }
  };

  const startNewQuiz = () => {
    setQuestionNumber(1);
    setScore(0);
    setQuizComplete(false);
    setUsedQuestions([]);
    setShowWelcome(false);
    generateQuestion();
  };

  const startQuiz = () => {
    setShowWelcome(false);
    generateQuestion();
  };

  const toggleMode = () => {
    setMode(prev => (prev === 'tajik-to-english' ? 'english-to-tajik' : 'tajik-to-english'));
    setQuestionNumber(1);
    setScore(0);
    setQuizComplete(false);
    setUsedQuestions([]);
    generateQuestion();
  };

  useEffect(() => {
    if (!showWelcome) {
      generateQuestion();
    }
  }, []);

  const getScoreMessage = () => {
    const percentage = (score / 20) * 100;
    if (percentage === 100) return "Perfect! You're a Tajik vocabulary master! 🏆";
    if (percentage >= 90) return "Excellent work! Almost perfect! 🌟";
    if (percentage >= 80) return "Great job! You know your vocabulary well! 🎉";
    if (percentage >= 70) return "Good work! Keep practicing! 👍";
    if (percentage >= 60) return "Not bad! You're getting there! 💪";
    return "Keep studying! Practice makes perfect! 📚";
  };

  // Your JSX from the original stays the same.
  // For brevity, you can now reuse the full JSX UI from your original file.

 if (showWelcome) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-2 sm:p-4 flex items-center justify-center">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2s"></div>
        </div>

        <div className="bg-blue bg-opacity-10 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-2xl p-6 sm:p-8 text-center text-white max-w-md w-full relative z-10">
          <div className="mb-6 sm:mb-8">
            <div className="text-4xl sm:text-6xl mb-4">📚</div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent">
              First 100 Tajik Words
            </h1>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-6">
              Welcome! This quiz will help you practice the most essential Tajik vocabulary words. 
              Test your knowledge with 20 random questions from the first 100 words every learner should know.
            </p>
            <div className="bg-blue bg-opacity-20 rounded-lg p-4 mb-6">
              <h3 className="font-bold mb-2 text-yellow-300">How it works:</h3>
              <ul className="text-xs sm:text-sm text-left space-y-1">
                <li>• 20 questions per quiz</li>
                <li>• Multiple choice format</li>
                <li>• Switch between Tajik→English and English→Tajik</li>
                <li>• See your final score and try again</li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={startQuiz}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-all font-bold text-base sm:text-lg transform hover:scale-105 shadow-lg"
            >
              Start Quiz (Tajik → English) 🚀
            </button>
            
            <button
              onClick={() => {
                setMode('english-to-tajik');
                startQuiz();
              }}
              className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all font-medium text-sm sm:text-base transform hover:scale-105 shadow-lg"
            >
              Start Quiz (English → Tajik) 🎯
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Complete Screen
  if (quizComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-2 sm:p-4 flex items-center justify-center">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2s"></div>
        </div>

        <div className="bg-blue bg-opacity-10 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-8 text-center text-white max-w-sm sm:max-w-md w-full relative z-10">
          <Trophy className="w-12 h-12 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-6 text-yellow-400" />
          
          <h1 className="text-xl sm:text-3xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent">
            Quiz Complete!
          </h1>
          
          <div className="mb-4 sm:mb-6">
            <div className="text-4xl sm:text-6xl font-bold text-white mb-2">
              {score}/20
            </div>
            <div className="text-lg sm:text-xl text-gray-300 mb-3 sm:mb-4">
              {Math.round((score / 20) * 100)}% Correct
            </div>
            <div className="text-sm sm:text-lg text-yellow-300 px-2">
              {getScoreMessage()}
            </div>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <button
              onClick={startNewQuiz}
              className="w-full px-4 sm:px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-all font-bold text-base sm:text-lg transform hover:scale-105 shadow-lg"
            >
              Play Again 🎮
            </button>
            
            <button
              onClick={toggleMode}
              className="w-full px-4 sm:px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all font-medium text-sm sm:text-base transform hover:scale-105 shadow-lg"
            >
              Switch to {mode === 'tajik-to-english' ? 'English → Tajik' : 'Tajik → English'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return <div>Loading...</div>;

  const questionText = mode === 'tajik-to-english' ? currentQuestion[0] : currentQuestion[1];
  const answerIndex = mode === 'tajik-to-english' ? 1 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-2 sm:p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2s"></div>
      </div>

      <div className="max-w-lg mx-auto relative z-10">
        {/* Header */}
        <div className="bg-blue bg-opacity-10 backdrop-blur-lg rounded-lg sm:rounded-xl shadow-2xl p-3 sm:p-6 mb-3 sm:mb-6 text-white">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent">
              📚 First 100 Tajik Words
            </h1>
            
            <button
              onClick={toggleMode}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-md sm:rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all transform hover:scale-105 text-xs sm:text-sm"
            >
              <Shuffle size={12} className="sm:w-4 sm:h-4" />
              {mode === 'tajik-to-english' ? 'Tj→En' : 'En→Tj'}
            </button>
          </div>
          
          {/* Progress */}
          <div className="mb-2 sm:mb-4">
            <div className="flex items-center justify-between mb-1 sm:mb-2 text-xs sm:text-sm">
              <span className="font-medium">Question {questionNumber} of 20</span>
              <span className="font-medium">Score: {score}/{questionNumber - 1}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5 sm:h-2">
              <div 
                className="bg-gradient-to-r from-green-400 to-blue-500 h-1.5 sm:h-2 rounded-full transition-all duration-500"
                style={{ width: `${(questionNumber / 20) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-blue bg-opacity-10 backdrop-blur-lg rounded-lg sm:rounded-xl shadow-2xl p-4 sm:p-8">
          <div className="text-center mb-4 sm:mb-8">
            <h2 className="text-xs sm:text-sm font-medium text-gray-300 mb-2 sm:mb-4">
              {mode === 'tajik-to-english' ? 'What does this mean in English?' : 'How do you say this in Tajik?'}
            </h2>
            <div className="text-2xl sm:text-4xl font-bold text-white bg-blue bg-opacity-20 rounded-lg sm:rounded-xl py-4 sm:py-6 px-3 sm:px-4 backdrop-blur">
              {questionText}
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-2 sm:gap-4 mb-4 sm:mb-8">
            {options.map((option, index) => {
              const isSelected = selectedAnswer && selectedAnswer[0] === option[0];
              const isCorrect = option[0] === currentQuestion[0];
              
              let buttonClass = "w-full p-3 sm:p-4 text-left rounded-md sm:rounded-lg border-2 transition-all duration-300 ";
              
              if (!showResult) {
                buttonClass += "border-white border-opacity-30 bg-green bg-opacity-10 backdrop-blur text-white hover:border-opacity-60 hover:bg-opacity-20 cursor-pointer transform hover:scale-105";
              } else {
                if (isCorrect) {
                  buttonClass += "border-green-400 bg-green-500 bg-opacity-20 text-green-100 transform scale-105";
                } else if (isSelected && !isCorrect) {
                  buttonClass += "border-red-400 bg-red-500 bg-opacity-20 text-red-100 transform scale-95";
                } else {
                  buttonClass += "border-gray-500 bg-gray-500 bg-opacity-10 text-gray-300";
                }
              }

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(option)}
                  className={buttonClass}
                  disabled={showResult}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm sm:text-lg font-medium">
                      {option[answerIndex]}
                    </span>
                    {showResult && (
                      <span className="ml-2">
                        {isCorrect ? (
                          <Check className="text-green-400" size={16} />
                        ) : isSelected ? (
                          <X className="text-red-400" size={16} />
                        ) : null}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Result and Next Button */}
          {showResult && (
            <div className="text-center">
{selectedAnswer && (
  <div
    className={`text-lg sm:text-2xl font-bold mb-4 sm:mb-6 ${
      selectedAnswer[0] === currentQuestion[0] ? 'text-green-400' : 'text-red-400'
    }`}
  >
    {selectedAnswer[0] === currentQuestion[0] ? 'Correct! 🎉' : 'Incorrect 😔'}
  </div>
)}

              
              <button
                onClick={nextQuestion}
                className="px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-md sm:rounded-lg hover:from-green-600 hover:to-blue-600 transition-all font-bold text-sm sm:text-lg transform hover:scale-105 shadow-lg"
              >
                {questionNumber >= 20 ? 'See Results' : 'Next Question'} →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TajikVocabApp;
    // Paste your JSX here exactly as it was.
    // If you want me to plug it in for you with types, let me know
