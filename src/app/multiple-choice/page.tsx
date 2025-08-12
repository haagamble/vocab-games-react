'use client';

import Link from 'next/link';
import { useWordList } from '../WordListContext';
import { useEffect, useState } from 'react';
import { loadWordList, generateMultipleChoiceOptions, shuffleArray, WordList } from '../utils/wordListLoader';

interface Question {
  word: string;
  definition: string;
  options: string[];
}

type QuizMode = 'tajik-to-english' | 'english-to-tajik';

export default function MultipleChoice() {
  const { selectedWordList } = useWordList();
  const [wordList, setWordList] = useState<WordList | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizMode, setQuizMode] = useState<QuizMode>('tajik-to-english'); // Default to Tajik→English

  // Load word list data when component mounts or selectedWordList changes
  useEffect(() => {
    async function loadWordListData() {
      if (!selectedWordList) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const data = await loadWordList(selectedWordList);
        
        if (!data) {
          setError(`Failed to load word list: ${selectedWordList}`);
          return;
        }

        setWordList(data);
        
      } catch (err) {
        setError(`Error loading word list: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    }

    loadWordListData();
  }, [selectedWordList]);

  // Generate questions when word list or quiz mode changes
  useEffect(() => {
    if (!wordList || wordList.words.length === 0) {
      return;
    }

    // Generate questions from the word list
    const shuffledWords = shuffleArray(wordList.words);
    const gameQuestions = shuffledWords.slice(0, Math.min(10, wordList.words.length)).map(wordItem => {
      let options: string[];
      
      if (quizMode === 'english-to-tajik') {
        // English→Tajik mode: show English definition, choose from Tajik words
        options = generateMultipleChoiceOptions(wordItem.word, wordList.words);
      } else {
        // Tajik→English mode: show Tajik word, choose from English words
        const correctEnglishWord = wordItem.definition;
        const wrongEnglishWords: string[] = [];
        
        // Get 3 random wrong English words
        while (wrongEnglishWords.length < 3) {
          const randomWord = wordList.words[Math.floor(Math.random() * wordList.words.length)];
          if (randomWord.definition !== correctEnglishWord && 
              !wrongEnglishWords.includes(randomWord.definition)) {
            wrongEnglishWords.push(randomWord.definition);
          }
        }
        
        // Shuffle all options (English words)
        options = [correctEnglishWord, ...wrongEnglishWords].sort(() => Math.random() - 0.5);
      }
      
      return {
        word: wordItem.word,
        definition: wordItem.definition,
        options: options
      };
    });

    setQuestions(gameQuestions);
  }, [wordList, quizMode]);

  // Reset game state when word list or mode changes
  useEffect(() => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowResult(false);
    setGameComplete(false);
  }, [selectedWordList, quizMode]);

  // If no word list is selected, show message
  if (!selectedWordList) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-8">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center max-w-md">
          <div className="text-6xl mb-4">📚</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">No Word List Selected</h1>
          <p className="text-gray-600 mb-6">Please go back and select a word list first.</p>
          <Link 
            href="/" 
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 inline-block"
          >
            Go Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-8">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center max-w-md">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto mb-6"></div>
          <p className="text-gray-700 font-medium text-lg">Loading {selectedWordList} word list...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-8">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-3xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link 
            href="/" 
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 inline-block"
          >
            Go Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // No questions available
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-8">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center max-w-md">
          <div className="text-6xl mb-4">❓</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">No Questions Available</h1>
          <p className="text-gray-600 mb-6">The selected word list appears to be empty.</p>
          <Link 
            href="/" 
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 inline-block"
          >
            Go Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    setShowResult(true);
    
    // Check if answer is correct based on current mode
    const correctAnswer = quizMode === 'english-to-tajik' ? currentQ.word : currentQ.definition;
    if (answer === correctAnswer) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setGameComplete(true);
    }
  };

  const toggleMode = () => {
    setQuizMode(prev => prev === 'tajik-to-english' ? 'english-to-tajik' : 'tajik-to-english');
  };

  const restartGame = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowResult(false);
    setGameComplete(false);
  };

  if (gameComplete) {
    const percentage = (score / questions.length) * 100;
    const getScoreEmoji = () => {
      if (score === questions.length) return '🏆';
      if (percentage >= 80) return '🎉';
      if (percentage >= 60) return '👍';
      return '💪';
    };

    const getScoreMessage = () => {
      if (score === questions.length) return 'Perfect Score!';
      if (percentage >= 80) return 'Excellent work!';
      if (percentage >= 60) return 'Good effort!';
      return 'Keep practicing!';
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-8">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-12 text-center max-w-lg">
          <div className="text-8xl mb-6">{getScoreEmoji()}</div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-6">
            Game Complete!
          </h1>
          
          <div className="mb-8">
            <div className="text-6xl font-bold text-gray-800 mb-2">
              {score}/{questions.length}
            </div>
            <div className="text-xl text-gray-600 mb-4">
              {Math.round(percentage)}% Correct
            </div>
            <p className="text-2xl font-semibold text-purple-600">
              {getScoreMessage()}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={restartGame}
              className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
            >
              🔄 Play Again
            </button>
            <Link 
              href="/" 
              className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 inline-block"
            >
              🏠 Choose Different Game
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link 
            href="/" 
            className="flex items-center text-white/90 hover:text-white font-semibold text-base sm:text-lg hover:underline transition-all duration-200 py-1"
          >
            <span className="mr-2">←</span> Back to Home
          </Link>
          
          <div className="flex flex-wrap justify-between items-center mb-4 sm:mb-8 gap-2">
            <button
              onClick={toggleMode}
              className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-white font-semibold hover:bg-white/30 transition-all duration-200 flex items-center gap-2"
            >
              <span className="text-lg">🔄</span>
              {quizMode === 'tajik-to-english' ? 'Тоҷикӣ→English' : 'English→Тоҷикӣ'}
            </button>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-sm sm:text-base text-white font-semibold">
              Question {currentQuestion + 1} of {questions.length}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/20 rounded-full h-4 mb-8 shadow-inner">
          <div 
            className="bg-gradient-to-r from-green-400 to-blue-500 h-4 rounded-full transition-all duration-500 shadow-lg"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          ></div>
        </div>

        {/* Question Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-6">
          <div className="flex items-center mb-6">
            <div className="text-4xl mr-4">📝</div>
            <h1 className="text-xl sm:text-3xl font-bold text-gray-800">
              Multiple Choice - {wordList?.name || selectedWordList}
            </h1>
          </div>
          
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-purple-500 p-6 rounded-xl">
              <p className="text-2xl font-semibold text-gray-800 leading-relaxed">
                {quizMode === 'english-to-tajik' ? currentQ.definition : currentQ.word}
              </p>
            </div>
          </div>

          {/* Answer Options */}
          <div className="grid gap-4 mb-8">
            {currentQ.options.map((option, index) => {
              const correctAnswer = quizMode === 'english-to-tajik' ? currentQ.word : currentQ.definition;
              
              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(option)}
                  disabled={showResult}
                  className={`w-full p3 sm:p-5 text-left rounded-xl border-2 font-medium text-lg transition-all duration-200 transform hover:scale-[1.02] ${
                    showResult
                      ? option === correctAnswer
                        ? 'bg-green-100 border-green-400 text-green-800 shadow-lg scale-[1.02]'
                        : option === selectedAnswer
                        ? 'bg-red-100 border-red-400 text-red-800 shadow-lg'
                        : 'bg-gray-100 border-gray-300 text-gray-600'
                      : 'bg-white hover:bg-blue-50 border-gray-300 hover:border-blue-400 text-gray-800 shadow-md hover:shadow-lg'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{option}</span>
                    {showResult && option === correctAnswer && <span className="text-2xl">✅</span>}
                    {showResult && option === selectedAnswer && option !== correctAnswer && <span className="text-2xl">❌</span>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Result & Next Button */}
          {showResult && (
            <div className="text-center border-t pt-6">
              <div className={`inline-flex items-center px-6 py-3 rounded-xl font-bold text-xl mb-6 ${
                selectedAnswer === (quizMode === 'english-to-tajik' ? currentQ.word : currentQ.definition)
                  ? 'bg-green-100 text-green-700 border border-green-300' 
                  : 'bg-red-100 text-red-700 border border-red-300'
              }`}>
                <span className="mr-2">{selectedAnswer === (quizMode === 'english-to-tajik' ? currentQ.word : currentQ.definition) ? '🎉' : '😔'}</span>
                {selectedAnswer === (quizMode === 'english-to-tajik' ? currentQ.word : currentQ.definition) 
                  ? 'Correct!' 
                  : `Incorrect. The answer was "${quizMode === 'english-to-tajik' ? currentQ.word : currentQ.definition}".`
                }
              </div>
              <br />
              <button
                onClick={nextQuestion}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 text-lg"
              >
                {currentQuestion < questions.length - 1 ? '➡️ Next Question' : '🏁 Finish Game'}
              </button>
            </div>
          )}
        </div>

        {/* Score Display */}
        <div className="text-center">
          <div className="inline-flex items-center bg-white/90 backdrop-blur-sm rounded-xl px-6 py-3 shadow-lg">
            <span className="text-2xl mr-3">🏆</span>
            <span className="text-xl font-bold text-gray-800">
              Current Score: {score} / {currentQuestion + (showResult ? 1 : 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}