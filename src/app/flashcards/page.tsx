'use client';

import Link from 'next/link';
import { useWordList } from '../WordListContext';
import { useEffect, useState } from 'react';
import { loadWordList, shuffleArray, WordItem, WordList } from '../utils/wordListLoader';

interface FlashcardProgress {
  wordId: string;
  word: string;
  definition: string;
  correctCount: number;
  incorrectCount: number;
  lastReviewed: Date;
  difficulty: 'easy' | 'medium' | 'hard';
  isLearned: boolean;
}

type StudyMode = 'all' | 'new' | 'difficult' | 'review';
type CardSide = 'tajik' | 'english';

export default function FlashcardsPage() {
  const { selectedWordList } = useWordList();
  const [wordList, setWordList] = useState<WordList | null>(null);
  const [flashcards, setFlashcards] = useState<FlashcardProgress[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyMode, setStudyMode] = useState<StudyMode>('all');
  const [frontSide, setFrontSide] = useState<CardSide>('tajik');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionStats, setSessionStats] = useState({
    studied: 0,
    correct: 0,
    incorrect: 0
  });
  const [showStats, setShowStats] = useState(false);
  const [filteredCards, setFilteredCards] = useState<FlashcardProgress[]>([]);

  // Load word list and initialize progress
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
        
        // Load saved progress from localStorage or initialize new progress
        const savedProgressKey = `flashcard-progress-${selectedWordList}`;
        const savedProgress = localStorage.getItem(savedProgressKey);
        
        let progress: FlashcardProgress[];
        
        if (savedProgress) {
          const parsed = JSON.parse(savedProgress);
          // Ensure all words from the list are included (in case list was updated)
          progress = data.words.map(wordItem => {
            const existingProgress = parsed.find((p: FlashcardProgress) => p.wordId === `${wordItem.word}-${wordItem.definition}`);
            return existingProgress || {
              wordId: `${wordItem.word}-${wordItem.definition}`,
              word: wordItem.word,
              definition: wordItem.definition,
              correctCount: 0,
              incorrectCount: 0,
              lastReviewed: new Date(),
              difficulty: 'medium' as const,
              isLearned: false
            };
          });
        } else {
          // Initialize progress for all words
          progress = data.words.map(wordItem => ({
            wordId: `${wordItem.word}-${wordItem.definition}`,
            word: wordItem.word,
            definition: wordItem.definition,
            correctCount: 0,
            incorrectCount: 0,
            lastReviewed: new Date(),
            difficulty: 'medium' as const,
            isLearned: false
          }));
        }
        
        setFlashcards(progress);
        
      } catch (err) {
        setError(`Error loading word list: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    }

    loadWordListData();
  }, [selectedWordList]);

  // Filter and shuffle cards based on study mode
  useEffect(() => {
    if (flashcards.length === 0) return;

    let filtered: FlashcardProgress[] = [];

    switch (studyMode) {
      case 'all':
        filtered = [...flashcards];
        break;
      case 'new':
        filtered = flashcards.filter(card => card.correctCount === 0 && card.incorrectCount === 0);
        break;
      case 'difficult':
        filtered = flashcards.filter(card => 
          card.difficulty === 'hard' || 
          (card.incorrectCount > card.correctCount && card.incorrectCount > 0)
        );
        break;
      case 'review':
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        filtered = flashcards.filter(card => 
          card.lastReviewed < oneDayAgo || 
          (card.correctCount > 0 && !card.isLearned)
        );
        break;
    }

    if (filtered.length === 0) {
      filtered = [...flashcards]; // Fallback to all cards
    }

    setFilteredCards(shuffleArray(filtered));
    setCurrentCardIndex(0);
    setIsFlipped(false);
  }, [flashcards, studyMode]);

  // Save progress to localStorage
  const saveProgress = (updatedCards: FlashcardProgress[]) => {
    if (selectedWordList) {
      const savedProgressKey = `flashcard-progress-${selectedWordList}`;
      localStorage.setItem(savedProgressKey, JSON.stringify(updatedCards));
    }
  };

  // Calculate difficulty based on performance
  const calculateDifficulty = (correct: number, incorrect: number): 'easy' | 'medium' | 'hard' => {
    const total = correct + incorrect;
    if (total === 0) return 'medium';
    
    const successRate = correct / total;
    if (successRate >= 0.8) return 'easy';
    if (successRate >= 0.5) return 'medium';
    return 'hard';
  };

  // Handle marking card as correct or incorrect
  const handleCardResponse = (isCorrect: boolean) => {
    if (filteredCards.length === 0) return;

    const currentCard = filteredCards[currentCardIndex];
    
    // Update progress
    const updatedFlashcards = flashcards.map(card => {
      if (card.wordId === currentCard.wordId) {
        const newCorrect = isCorrect ? card.correctCount + 1 : card.correctCount;
        const newIncorrect = isCorrect ? card.incorrectCount : card.incorrectCount + 1;
        const newDifficulty = calculateDifficulty(newCorrect, newIncorrect);
        const newIsLearned = newCorrect >= 3 && newCorrect >= newIncorrect * 2;
        
        return {
          ...card,
          correctCount: newCorrect,
          incorrectCount: newIncorrect,
          lastReviewed: new Date(),
          difficulty: newDifficulty,
          isLearned: newIsLearned
        };
      }
      return card;
    });

    setFlashcards(updatedFlashcards);
    saveProgress(updatedFlashcards);

    // Update session stats
    setSessionStats(prev => ({
      studied: prev.studied + 1,
      correct: isCorrect ? prev.correct + 1 : prev.correct,
      incorrect: isCorrect ? prev.incorrect : prev.incorrect + 1
    }));

    // Move to next card
    setIsFlipped(false);
    if (currentCardIndex < filteredCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    } else {
      // End of deck - show stats
      setShowStats(true);
    }
  };

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const resetSession = () => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setShowStats(false);
    setSessionStats({ studied: 0, correct: 0, incorrect: 0 });
    // Re-filter and shuffle cards
    const filtered = filteredCards.slice();
    setFilteredCards(shuffleArray(filtered));
  };

  const currentCard = filteredCards[currentCardIndex];
  const progress = filteredCards.length > 0 ? ((currentCardIndex) / filteredCards.length) * 100 : 0;

  // Get stats for different categories
  const getStats = () => {
    const newCards = flashcards.filter(card => card.correctCount === 0 && card.incorrectCount === 0).length;
    const difficultCards = flashcards.filter(card => 
      card.difficulty === 'hard' || 
      (card.incorrectCount > card.correctCount && card.incorrectCount > 0)
    ).length;
    const learnedCards = flashcards.filter(card => card.isLearned).length;
    
    return { newCards, difficultCards, learnedCards, total: flashcards.length };
  };

  // No word list selected
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
          <p className="text-gray-700 font-medium text-lg">Loading {selectedWordList} flashcards...</p>
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

  // Session complete
  if (showStats) {
    const stats = getStats();
    const sessionAccuracy = sessionStats.studied > 0 ? Math.round((sessionStats.correct / sessionStats.studied) * 100) : 0;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-8">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-12 text-center max-w-2xl">
          <div className="text-8xl mb-6">🎉</div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-6">
            Session Complete!
          </h1>
          
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6">
              <div className="text-4xl font-bold text-green-600">{sessionStats.correct}</div>
              <div className="text-green-700 font-semibold">Correct</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6">
              <div className="text-4xl font-bold text-red-600">{sessionStats.incorrect}</div>
              <div className="text-red-700 font-semibold">Incorrect</div>
            </div>
          </div>

          <div className="mb-8">
            <div className="text-3xl font-bold text-gray-800 mb-2">
              {sessionAccuracy}% Accuracy
            </div>
            <div className="text-lg text-gray-600">
              You studied {sessionStats.studied} cards
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="font-bold text-blue-800">{stats.learnedCards}</div>
              <div className="text-blue-600">Learned</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <div className="font-bold text-orange-800">{stats.difficultCards}</div>
              <div className="text-orange-600">Difficult</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={resetSession}
              className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
            >
              🔄 Study More
            </button>
            <Link 
              href="/" 
              className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 inline-block"
            >
              🏠 Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main flashcard interface
  if (!currentCard || filteredCards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-8">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center max-w-md">
          <div className="text-6xl mb-4">🎯</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">No Cards Available</h1>
          <p className="text-gray-600 mb-6">
            Try selecting a different study mode or add some words to your list.
          </p>
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

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Link 
            href="/" 
            className="flex items-center text-white/90 hover:text-white font-semibold text-lg hover:underline transition-all duration-200"
          >
            <span className="mr-2">←</span> Back to Home
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 text-white text-sm font-medium">
              {currentCardIndex + 1} / {filteredCards.length}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="bg-white/20 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-yellow-400 to-orange-400 h-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Control Bar */}
        <div className="mb-8">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-4">
            <div className="flex flex-wrap justify-center gap-4 mb-4">
              <select 
                value={studyMode} 
                onChange={(e) => setStudyMode(e.target.value as StudyMode)}
                className="px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Cards ({stats.total})</option>
                <option value="new">New Cards ({stats.newCards})</option>
                <option value="difficult">Difficult ({stats.difficultCards})</option>
                <option value="review">Review ({stats.total - stats.learnedCards})</option>
              </select>

              <select 
                value={frontSide} 
                onChange={(e) => setFrontSide(e.target.value as CardSide)}
                className="px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="tajik">Tajik → English</option>
                <option value="english">English → Tajik</option>
              </select>
            </div>

            <div className="flex justify-center gap-6 text-sm">
              <div className="text-center">
                <div className="font-bold text-green-600">{stats.learnedCards}</div>
                <div className="text-gray-600">Learned</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-orange-600">{stats.difficultCards}</div>
                <div className="text-gray-600">Difficult</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-blue-600">{stats.newCards}</div>
                <div className="text-gray-600">New</div>
              </div>
            </div>
          </div>
        </div>

        {/* Flashcard */}
        <div className="mb-8">
          <div className="relative mx-auto max-w-2xl">
            <div 
              onClick={flipCard}
              className="bg-white rounded-3xl shadow-2xl cursor-pointer transition-all duration-300 hover:shadow-3xl transform hover:-translate-y-1 min-h-[400px] flex flex-col"
            >
              {/* Card Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    currentCard.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                    currentCard.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {currentCard.difficulty}
                  </div>
                  <div className="text-gray-500 text-sm">
                    {currentCard.isLearned ? '✅ Learned' : 
                     `${currentCard.correctCount}✓ ${currentCard.incorrectCount}✗`}
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="text-6xl mb-6">
                    {isFlipped ? '🔄' : '❓'}
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
                    {isFlipped ? 
                      (frontSide === 'tajik' ? currentCard.definition : currentCard.word) :
                      (frontSide === 'tajik' ? currentCard.word : currentCard.definition)
                    }
                  </div>
                  <div className="text-lg text-gray-500 mb-6">
                    {isFlipped ? 
                      (frontSide === 'tajik' ? 'English' : 'Tajik') :
                      (frontSide === 'tajik' ? 'Tajik' : 'English')
                    }
                  </div>
                  {!isFlipped && (
                    <div className="text-gray-400 text-sm">
                      Click to reveal answer
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          {!isFlipped ? (
            <button
              onClick={flipCard}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 text-lg"
            >
              🔍 Show Answer
            </button>
          ) : (
            <>
              <button
                onClick={() => handleCardResponse(false)}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 text-lg"
              >
                ❌ Incorrect
              </button>
              <button
                onClick={() => handleCardResponse(true)}
                className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 text-lg"
              >
                ✅ Correct
              </button>
            </>
          )}
        </div>

        {/* Session Stats */}
        <div className="mt-8 text-center">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 inline-block">
            <div className="flex items-center gap-6 text-white">
              <div>
                <div className="font-bold text-2xl">{sessionStats.studied}</div>
                <div className="text-sm opacity-80">Studied</div>
              </div>
              <div>
                <div className="font-bold text-2xl text-green-200">{sessionStats.correct}</div>
                <div className="text-sm opacity-80">Correct</div>
              </div>
              <div>
                <div className="font-bold text-2xl text-red-200">{sessionStats.incorrect}</div>
                <div className="text-sm opacity-80">Incorrect</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}