'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useWordList } from '../WordListContext';
import { loadWordList, WordItem, WordList } from '../utils/wordListLoader';
import confetti from 'canvas-confetti';

type StudyMode = 'all' | 'wrong-only';

type CardRecord = {
  id: string;
  word: string;
  definition: string;
  correctCount: number;
  incorrectCount: number;
  lastResult?: 'correct' | 'incorrect';
};

export default function Flashcards() {
  const { selectedWordList } = useWordList();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wordList, setWordList] = useState<WordList | null>(null);

  const [cards, setCards] = useState<CardRecord[]>([]);
  const [wrongIds, setWrongIds] = useState<Set<string>>(new Set());
  const [rightIds, setRightIds] = useState<Set<string>>(new Set());

  const [studyMode, setStudyMode] = useState<StudyMode>('all');
  const [frontIsTajik, setFrontIsTajik] = useState<boolean>(true);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [celebrated, setCelebrated] = useState(false);

  const storageKey = selectedWordList ? `flashcards-progress-${selectedWordList}` : '';

  // Load word list and saved progress
  useEffect(() => {
    async function run() {
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

        // Initialize cards
        const initial: CardRecord[] = data.words.map((w: WordItem) => ({
          id: `${w.word}::${w.definition}`,
          word: w.word,
          definition: w.definition,
          correctCount: 0,
          incorrectCount: 0,
          lastResult: undefined,
        }));

        // Merge saved progress if present
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const saved = JSON.parse(raw) as { cards: CardRecord[]; wrongIds: string[]; rightIds?: string[] };
          const savedById = new Map(saved.cards.map((c) => [c.id, c] as const));
          const merged = initial.map((c) => savedById.get(c.id) ?? c);
          setCards(merged);
          setWrongIds(new Set(saved.wrongIds ?? []));
          if (saved.rightIds) {
            setRightIds(new Set(saved.rightIds));
          } else {
            // Derive rightIds if not saved: correct once and not currently wrong
            const derived = merged.filter((c) => c.correctCount > 0 && !(saved.wrongIds ?? []).includes(c.id)).map((c) => c.id);
            setRightIds(new Set(derived));
          }
        } else {
          setCards(initial);
          setWrongIds(new Set());
          setRightIds(new Set());
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    run();
    // reset session state
    setCurrentIndex(0);
    setIsFlipped(false);
    setCelebrated(false);
  }, [selectedWordList, storageKey]);

  // Persist progress
  useEffect(() => {
    if (!storageKey) return;
    const wrong = Array.from(wrongIds);
    const right = Array.from(rightIds);
    localStorage.setItem(storageKey, JSON.stringify({ cards, wrongIds: wrong, rightIds: right }));
  }, [cards, wrongIds, rightIds, storageKey]);

  // Build current deck based on mode
  const deck = useMemo(() => {
    if (studyMode === 'wrong-only') {
      return cards.filter((c) => wrongIds.has(c.id));
    }
    // In 'all' mode, skip cards already in the right stack
    return cards.filter((c) => !rightIds.has(c.id));
  }, [cards, wrongIds, rightIds, studyMode]);

  const current = deck[currentIndex];

  // Clamp current index when deck changes (e.g., removing items from wrong list)
  useEffect(() => {
    if (deck.length === 0) {
      if (currentIndex !== 0) setCurrentIndex(0);
    } else if (currentIndex >= deck.length) {
      setCurrentIndex(0);
    }
  }, [deck.length, currentIndex]);

  // Celebrate only when all words have been answered correctly at least once and no wrongs remain
  useEffect(() => {
    if (cards.length === 0) return;
    const allCorrectOnce = cards.every((c) => c.correctCount > 0);
    if (wrongIds.size === 0 && allCorrectOnce && !celebrated) {
      setCelebrated(true);
      confetti({ particleCount: 200, spread: 70, origin: { y: 0.6 } });
    }
  }, [wrongIds.size, celebrated, cards]);

  const flip = () => setIsFlipped((f) => !f);

  const mark = (isCorrect: boolean) => {
    if (!current) return;

    setCards((prev) =>
      prev.map((c) =>
        c.id === current.id
          ? {
              ...c,
              correctCount: c.correctCount + (isCorrect ? 1 : 0),
              incorrectCount: c.incorrectCount + (isCorrect ? 0 : 1),
              lastResult: isCorrect ? 'correct' : 'incorrect',
            }
          : c
      )
    );

    setWrongIds((prev) => {
      const next = new Set(prev);
      if (isCorrect) next.delete(current.id); else next.add(current.id);
      return next;
    });

    setRightIds((prev) => {
      const next = new Set(prev);
      if (isCorrect) next.add(current.id); else next.delete(current.id);
      return next;
    });

    // advance
    setIsFlipped(false);
    let nextIndex = 0;
    if (studyMode === 'wrong-only' && isCorrect) {
      // Keep the same index so the next wrong card shifts into this slot
      nextIndex = Math.min(currentIndex, Math.max(0, deck.length - 1));
    } else if (currentIndex < deck.length - 1) {
      nextIndex = currentIndex + 1;
    } else {
      nextIndex = 0;
    }
    setCurrentIndex(nextIndex);
  };

  if (!selectedWordList) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-8">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center max-w-md">
          <div className="text-6xl mb-4">📚</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">No Word List Selected</h1>
          <p className="text-gray-600 mb-6">Please go back and select a word list first.</p>
          <Link href="/" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 inline-block">Go Back to Home</Link>
        </div>
      </div>
    );
  }

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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-8">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-3xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 inline-block">Go Back to Home</Link>
        </div>
      </div>
    );
  }

  const total = cards.length;
  const wrongCount = wrongIds.size;
//   const deckCount = deck.length;
  const progress = total > 0 ? Math.round((rightIds.size / total) * 100) : 0;

  const allCorrect = total > 0 && wrongCount === 0 && cards.every((c) => c.correctCount > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="flex items-center text-white/90 hover:text-white font-semibold text-lg hover:underline transition-all duration-200">
            <span className="mr-2">←</span> Back to Home
          </Link>
          <div className="flex items-center gap-3 text-white/90">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 text-sm font-medium">
              {`${rightIds.size} / ${total}`}
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="bg-white/20 rounded-full h-2 overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 h-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Controls */}
        <div className="mb-8">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-4">
            <div className="flex flex-wrap justify-center gap-4 mb-4">
              <select
                value={studyMode}
                onChange={(e) => { setStudyMode(e.target.value as StudyMode); setIsFlipped(false); }}
                className="px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
              >
                <option value="all">All Cards ({total})</option>
                <option value="wrong-only" disabled={wrongCount === 0}>Wrong Only ({wrongCount})</option>
              </select>

              <select
                value={frontIsTajik ? 'tajik' : 'english'}
                onChange={(e) => setFrontIsTajik(e.target.value === 'tajik')}
                className="px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
              >
                <option value="tajik">Tajik → English</option>
                <option value="english">English → Tajik</option>
              </select>

              <div className="flex items-center gap-4 text-sm">
                <div className="text-green-700 font-semibold bg-green-50 rounded px-2 py-1">Correct: {rightIds.size}</div>
                <div className="text-red-700 font-semibold bg-red-50 rounded px-2 py-1">Wrong: {wrongIds.size}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Flashcards</h1>
          <p className="text-white/80 text-lg">Flip the card, then mark if you were right or wrong. Practice your wrong list until it is empty.</p>
        </div>

        {/* Card */}
        <div className="mb-8">
          <div className="relative mx-auto max-w-2xl">
            <div onClick={flip} className="bg-white rounded-3xl shadow-2xl cursor-pointer transition-all duration-300 hover:shadow-3xl transform hover:-translate-y-1 min-h-[360px] flex flex-col">
              <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <div className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">{frontIsTajik ? 'Тоҷикӣ → English' : 'English → Тоҷикӣ'}</div>
                  <div className="text-gray-500 text-sm">Wrong list: {wrongCount}</div>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="text-6xl mb-6">{isFlipped ? '🔄' : '❓'}</div>
                  <div className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
                    {current
                      ? isFlipped
                        ? frontIsTajik
                          ? current.definition
                          : current.word
                        : frontIsTajik
                          ? current.word
                          : current.definition
                      : 'No cards'}
                  </div>
                  <div className="text-lg text-gray-500 mb-6">
                    {isFlipped ? (frontIsTajik ? 'English' : 'Tajik') : (frontIsTajik ? 'Tajik' : 'English')}
                  </div>
                  {!isFlipped && <div className="text-gray-400 text-sm">Click to reveal answer</div>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          {!isFlipped ? (
            <button onClick={flip} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 text-lg">🔍 Show Answer</button>
          ) : (
            <>
              <button onClick={() => mark(false)} className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 text-lg">❌ Wrong</button>
              <button onClick={() => mark(true)} className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 text-lg">✅ Right</button>
            </>
          )}
        </div>

        {/* Celebration */}
        {allCorrect && (
          <div className="mt-8 p-4 bg-gradient-to-r from-green-400 to-green-500 border-0 rounded-lg text-white font-bold text-center shadow-lg">
            <div className="text-2xl mb-1">🎉 Awesome!</div>
            <div>You’ve answered all words correctly.</div>
          </div>
        )}
      </div>
    </div>
  );
}


