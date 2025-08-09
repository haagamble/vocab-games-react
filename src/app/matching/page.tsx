'use client';

import Link from 'next/link';
import { useWordList } from '../WordListContext';
import { useEffect, useState } from 'react';
import { loadWordList, shuffleArray, WordItem, WordList } from '../utils/wordListLoader';

interface Card {
  id: string;
  word: string;
  type: 'tajik' | 'english';
  pairId: string;
  isFlipped: boolean;
  isMatched: boolean;
}

type Difficulty = 'easy' | 'hard';

export default function MatchingGame() {
  const { selectedWordList } = useWordList();
  const [wordList, setWordList] = useState<WordList | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<string[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [guesses, setGuesses] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [isProcessing, setIsProcessing] = useState(false);

  const pairsCount = difficulty === 'easy' ? 6 : 10;

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

  // Generate cards when word list or difficulty changes
  useEffect(() => {
    if (!wordList || wordList.words.length === 0) {
      return;
    }

    // Reset game state
    setFlippedCards([]);
    setMatchedPairs([]);
    setGuesses(0);
    setGameComplete(false);
    setIsProcessing(false);

    // Select random word pairs
    const shuffledWords = shuffleArray(wordList.words);
    const selectedWords = shuffledWords.slice(0, Math.min(pairsCount, wordList.words.length));

    // Create cards for each word pair
    const newCards: Card[] = [];
    selectedWords.forEach((wordItem, index) => {
      const pairId = `pair-${index}`;
      
      // Tajik card
      newCards.push({
        id: `${pairId}-tajik`,
        word: wordItem.word,
        type: 'tajik',
        pairId: pairId,
        isFlipped: false,
        isMatched: false
      });
      
      // English card
      newCards.push({
        id: `${pairId}-english`,
        word: wordItem.definition,
        type: 'english',
        pairId: pairId,
        isFlipped: false,
        isMatched: false
      });
    });

    // Shuffle the cards
    const shuffledCards = shuffleArray(newCards);
    setCards(shuffledCards);
  }, [wordList, difficulty]);

  // Check for matches when flipped cards change
  useEffect(() => {
    if (flippedCards.length === 2 && !isProcessing) {
      setIsProcessing(true);
      setGuesses(prev => prev + 1);

      const [firstCardId, secondCardId] = flippedCards;
      const firstCard = cards.find(card => card.id === firstCardId);
      const secondCard = cards.find(card => card.id === secondCardId);

      if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
        // It's a match!
        setMatchedPairs(prev => [...prev, firstCard.pairId]);
        setCards(prev => prev.map(card => 
          card.pairId === firstCard.pairId 
            ? { ...card, isMatched: true }
            : card
        ));
        setFlippedCards([]);
        setIsProcessing(false);
      } else {
        // Not a match - flip back after 2 seconds
        setTimeout(() => {
          setCards(prev => prev.map(card => 
            flippedCards.includes(card.id) 
              ? { ...card, isFlipped: false }
              : card
          ));
          setFlippedCards([]);
          setIsProcessing(false);
        }, 2000);
      }
    }
  }, [flippedCards, cards, isProcessing]);

  // Check if game is complete
  useEffect(() => {
    if (matchedPairs.length === pairsCount && matchedPairs.length > 0) {
      setGameComplete(true);
    }
  }, [matchedPairs, pairsCount]);

  const handleCardClick = (cardId: string) => {
    if (isProcessing || flippedCards.length >= 2) return;
    
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched) return;

    // Flip the card
    setCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    ));
    
    setFlippedCards(prev => [...prev, cardId]);
  };

  const toggleDifficulty = () => {
    setDifficulty(prev => prev === 'easy' ? 'hard' : 'easy');
  };

  const restartGame = () => {
    setFlippedCards([]);
    setMatchedPairs([]);
    setGuesses(0);
    setGameComplete(false);
    setIsProcessing(false);
    
    // Regenerate cards
    if (wordList) {
      const shuffledWords = shuffleArray(wordList.words);
      const selectedWords = shuffledWords.slice(0, Math.min(pairsCount, wordList.words.length));

      const newCards: Card[] = [];
      selectedWords.forEach((wordItem, index) => {
        const pairId = `pair-${index}`;
        
        newCards.push({
          id: `${pairId}-tajik`,
          word: wordItem.word,
          type: 'tajik',
          pairId: pairId,
          isFlipped: false,
          isMatched: false
        });
        
        newCards.push({
          id: `${pairId}-english`,
          word: wordItem.definition,
          type: 'english',
          pairId: pairId,
          isFlipped: false,
          isMatched: false
        });
      });

      const shuffledCards = shuffleArray(newCards);
      setCards(shuffledCards);
    }
  };

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

  // No cards available
  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-8">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center max-w-md">
          <div className="text-6xl mb-4">❓</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">No Words Available</h1>
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

  if (gameComplete) {
    const getScoreEmoji = () => {
      if (guesses <= pairsCount + 2) return '🏆';
      if (guesses <= pairsCount + 5) return '🎉';
      if (guesses <= pairsCount + 10) return '👍';
      return '💪';
    };

    const getScoreMessage = () => {
      if (guesses <= pairsCount + 2) return 'Amazing memory!';
      if (guesses <= pairsCount + 5) return 'Great job!';
      if (guesses <= pairsCount + 10) return 'Well done!';
      return 'Keep practicing!';
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-8">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-12 text-center max-w-lg">
          <div className="text-8xl mb-6">{getScoreEmoji()}</div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-6">
            Congratulations!
          </h1>
          
          <div className="mb-8">
            <div className="text-2xl text-gray-700 mb-4">
              You matched all {pairsCount} pairs!
            </div>
            <div className="text-6xl font-bold text-gray-800 mb-2">
              {guesses} guesses
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
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4">
          <Link 
            href="/" 
            className="flex items-center text-white/90 hover:text-white font-semibold text-base sm:text-lg hover:underline transition-all duration-200"
          >
            <span className="mr-2">←</span> Back to Home
          </Link>
          
          <div className="flex items-center gap-4">
            <button
              onClick={toggleDifficulty}
              className="bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-2 text-white font-semibold hover:bg-white/30 transition-all duration-200 flex items-center gap-2 text-sm sm:text-base"
            >
              <span className="text-base sm:text-lg">⚡</span>
              <span className="hidden sm:inline">
                {difficulty === 'easy' ? 'Easy (6 pairs)' : 'Hard (10 pairs)'}
              </span>
              <span className="sm:hidden">
                {difficulty === 'easy' ? 'Easy' : 'Hard'}
              </span>
            </button>
          </div>
        </div>

        {/* Game Info */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6 inline-block">
            <div className="flex items-center justify-center gap-4 sm:gap-8">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-800">{matchedPairs.length}</div>
                <div className="text-xs sm:text-sm text-gray-600">Pairs Found</div>
              </div>
              <div className="text-2xl sm:text-4xl">🃏</div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-800">{guesses}</div>
                <div className="text-xs sm:text-sm text-gray-600">Guesses</div>
              </div>
              <div className="text-2xl sm:text-4xl">🎯</div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-800">{pairsCount}</div>
                <div className="text-xs sm:text-sm text-gray-600">Goal</div>
              </div>
            </div>
          </div>
        </div>

        {/* Game Title */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
            Memory Matching Game
          </h1>
          <p className="text-white/80 text-sm sm:text-base md:text-lg px-4">
            Match Tajik words with their English translations!
          </p>
        </div>

        {/* Game Board */}
        <div className={`grid gap-1 sm:gap-2 justify-center max-w-full ${
          difficulty === 'easy' 
            ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' 
            : 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-5'
        }`}>
          {cards.map((card) => (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`
                relative w-full aspect-[3/2] cursor-pointer transition-all duration-300 transform hover:scale-[1.02] max-w-44 sm:max-w-48 md:max-w-52
                ${card.isMatched ? 'opacity-75' : ''}
                ${isProcessing && flippedCards.includes(card.id) ? 'pointer-events-none' : ''}
              `}
            >
              {/* Card Back */}
              <div className={`
                absolute inset-0 rounded-lg sm:rounded-xl shadow-lg transition-all duration-500 transform-gpu
                ${card.isFlipped || card.isMatched ? 'rotate-y-180 opacity-0' : 'rotate-y-0 opacity-100'}
                bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 border-2 border-white/30
              `}>

              </div>

              {/* Card Front */}
              <div className={`
                absolute inset-0 rounded-lg sm:rounded-xl shadow-lg transition-all duration-500 transform-gpu
                ${card.isFlipped || card.isMatched ? 'rotate-y-0 opacity-100' : 'rotate-y-180 opacity-0'}
                bg-blue-600 border-2 border-white/30
                ${card.isMatched ? 'ring-2 sm:ring-4 ring-yellow-400 ring-opacity-75' : ''}
              `}>
                <div className="h-full w-full flex items-center justify-center p-2 sm:p-3">
                  <div className="text-white text-center">
                    <div className="text-sm sm:text-base md:text-lg font-bold leading-tight break-words">
                      {card.word}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="text-center mt-8">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 inline-block">
            <p className="text-white text-sm">
              Click two cards to flip them. Match Tajik words with their English translations!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}