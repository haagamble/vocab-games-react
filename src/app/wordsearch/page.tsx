'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useWordList } from '../WordListContext';
import { loadWordList, WordList } from '../utils/wordListLoader';
import confetti from 'canvas-confetti';

const GRID_SIZE = 10;
const PICK_COUNT = 15;
const TAJIK_ALPHABET = 'АБВГҒДЕЁЖЗИЙӢКЛМНООПҚРСТУӮФХҲЧҶШЪЭЮЯ';

type Coord = [number, number];
type Placement = { 
  word: string; 
  coords: Coord[]; 
  placedWord?: string; 
};

type ConfettiOptions = {
  spread?: number;
  startVelocity?: number;
  decay?: number;
  scalar?: number;
  ticks?: number;
  gravity?: number;
  particleCount?: number;
};

// Fallback words if a list isn't selected/loaded
const mockWords = [
  'КИТОБ', 'ДАРЁ', 'ОСМОН', 'ГУЛҲО', 'ШАҲР', 
  'МАКТАБ', 'ДӮСТ', 'ХОНА', 'ОИЛА', 'МОДАР',
  'ПАДАР', 'БАРОР', 'ХОҲАР', 'РӮЗ', 'ШАБ',
  'БАХОР', 'ТОБИСТОН', 'ТИРАМОҲ', 'ЗИМИСТОН'
];

export default function WordSearchPage() {
  const { selectedWordList } = useWordList();
  const [wordList, setWordList] = useState<WordList | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [grid, setGrid] = useState<string[][]>([]);
  const [words, setWords] = useState<string[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [celebrated, setCelebrated] = useState<boolean>(false);

  // Enhanced selection state
  const [selecting, setSelecting] = useState(false);
  const [selection, setSelection] = useState<Coord[]>([]);
  const [selectionDirection, setSelectionDirection] = useState<Coord | null>(null);

  // Timer state
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<number | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(null);

  // Timer effect
  useEffect(() => {
    if (running && timerRef.current === null) {
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    } else if (!running && timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [running]);

  // Load selected word list
  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!selectedWordList) {
        setWordList(null);
        setLoading(false);
        setError(null);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const data = await loadWordList(selectedWordList);
        if (!cancelled) {
          if (data) {
            setWordList(data);
          } else {
            setError(`Failed to load word list: ${selectedWordList}`);
          }
        }
      } catch {
        if (!cancelled) setError('Error loading word list');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [selectedWordList]);

  // Initialize puzzle when word list changes/loads
  useEffect(() => {
    initializePuzzle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordList]);

  // Filter words: 3-10 letters, single word (no whitespace)
  function filterCandidateWords(candidates: string[]): string[] {
    return candidates
      .map((w) => (w || '').toUpperCase().trim())
      .filter((w) => w.length >= 3 && w.length <= 10 && !/\s/.test(w));
  }

  function initializePuzzle() {
    setRunning(false);
    setSeconds(0);
    setFoundWords([]);
    setSelection([]);
    setSelecting(false);
    setSelectionDirection(null);
    setCelebrated(false);

    // Choose words from loaded list, fallback to mock words, then apply constraints
    const sourceWords = wordList?.words?.map(w => w.word || '').filter(Boolean) || [];
    const basePool = sourceWords.length > 0 ? sourceWords : mockWords;
    const pool = filterCandidateWords(basePool);
    const chosen = shuffleArray([...pool]).slice(0, Math.min(PICK_COUNT, pool.length));

    // Generate puzzle with retries
    let tries = 0;
    let result;
    do {
      result = generateGrid(GRID_SIZE, chosen);
      tries++;
    } while (result.placements.length < chosen.length && tries < 20);

    setGrid(result.grid);
    setPlacements(result.placements);
    // Only show words that were actually placed
    setWords(result.placements.map((p) => p.word));
    setFoundWords([]);
    setSeconds(0);
    setRunning(true);
  }

  function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  function generateGrid(size: number, wordList: string[]) {
    const g: string[][] = Array.from({ length: size }, () => Array(size).fill(''));
    const dirs: Coord[] = [
      [0, 1], [0, -1], [1, 0], [-1, 0],
      [1, 1], [-1, -1], [1, -1], [-1, 1],
    ];

    const placementsAcc: Placement[] = [];

    function canPlace(word: string, r: number, c: number, dir: Coord) {
      for (let i = 0; i < word.length; i++) {
        const rr = r + dir[0] * i;
        const cc = c + dir[1] * i;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) return false;
        if (g[rr][cc] && g[rr][cc] !== word[i]) return false;
      }
      return true;
    }

    function write(word: string, r: number, c: number, dir: Coord) {
      const coords: Coord[] = [];
      for (let i = 0; i < word.length; i++) {
        const rr = r + dir[0] * i;
        const cc = c + dir[1] * i;
        g[rr][cc] = word[i];
        coords.push([rr, cc]);
      }
      return coords;
    }

    for (const originalWord of wordList) {
      const word = Math.random() < 0.5 ? originalWord : [...originalWord].reverse().join('');
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 300) {
        attempts++;
        const dir = dirs[Math.floor(Math.random() * dirs.length)];
        const maxR = dir[0] === 1 ? size - word.length : dir[0] === -1 ? word.length - 1 : size - 1;
        const minR = dir[0] === -1 ? word.length - 1 : 0;
        const maxC = dir[1] === 1 ? size - word.length : dir[1] === -1 ? word.length - 1 : size - 1;
        const minC = dir[1] === -1 ? word.length - 1 : 0;
        const r = Math.floor(Math.random() * (maxR - minR + 1)) + minR;
        const c = Math.floor(Math.random() * (maxC - minC + 1)) + minC;

        if (canPlace(word, r, c, dir)) {
          const coords = write(word, r, c, dir);
          // Store both the original word and the placed word for matching
          placementsAcc.push({ 
            word: originalWord, // Always store the original word
            coords,
            placedWord: word // Also store how it was actually placed
          });
          placed = true;
        }
      }
    }

    // Fill empty cells with random letters
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!g[r][c]) {
          g[r][c] = TAJIK_ALPHABET[Math.floor(Math.random() * TAJIK_ALPHABET.length)];
        }
      }
    }

    return { grid: g, placements: placementsAcc };
  }

  // Get direction between two points
  function getDirection(from: Coord, to: Coord): Coord {
    const [r1, c1] = from;
    const [r2, c2] = to;
    const dr = r2 - r1;
    const dc = c2 - c1;
    
    // Normalize to get direction (-1, 0, 1)
    const normalizeVal = (val: number) => val === 0 ? 0 : val > 0 ? 1 : -1;
    return [normalizeVal(dr), normalizeVal(dc)];
  }

  // Check if a point is on the same line as start point in the given direction
  function isOnStraightLine(start: Coord, point: Coord, direction: Coord): boolean {
    const [r1, c1] = start;
    const [r2, c2] = point;
    const [dr, dc] = direction;
    
    if (dr === 0 && dc === 0) return r1 === r2 && c1 === c2;
    
    // Check if the point lies on the line from start in the given direction
    const steps = dr !== 0 ? (r2 - r1) / dr : dc !== 0 ? (c2 - c1) / dc : 0;
    
    if (steps < 0) return false; // Point is in opposite direction
    
    const expectedR = r1 + steps * dr;
    const expectedC = c1 + steps * dc;
    
    return Math.abs(expectedR - r2) < 0.001 && Math.abs(expectedC - c2) < 0.001;
  }

  function startSelection(r: number, c: number) {
    setSelecting(true);
    setSelection([[r, c]]);
    setSelectionDirection(null);
    if (!running) {
      setSeconds(0);
      setRunning(true);
    }
  }

  function continueSelection(r: number, c: number) {
    if (!selecting) return;
    
    setSelection((prev) => {
      if (prev.length === 0) return [[r, c]];
      
      const start = prev[0];
      const current: Coord = [r, c];
      
      // If this is the second point, establish direction
      if (prev.length === 1) {
        if (start[0] === r && start[1] === c) return prev; // Same cell
        
        const newDirection = getDirection(start, current);
        setSelectionDirection(newDirection);
        return [start, current];
      }
      
      // For subsequent points, only allow if on the same straight line
      if (selectionDirection) {
        if (isOnStraightLine(start, current, selectionDirection)) {
          // Build the complete straight line from start to current
          const [startR, startC] = start;
          const [dr, dc] = selectionDirection;
          const steps = Math.max(Math.abs(r - startR), Math.abs(c - startC));
          
          const straightLine: Coord[] = [];
          for (let i = 0; i <= steps; i++) {
            const newR = startR + i * dr;
            const newC = startC + i * dc;
            if (newR >= 0 && newR < GRID_SIZE && newC >= 0 && newC < GRID_SIZE) {
              straightLine.push([newR, newC]);
            }
          }
          return straightLine;
        }
      }
      
      return prev;
    });
  }

  function endSelection() {
    if (!selecting || selection.length === 0) {
      setSelecting(false);
      setSelection([]);
      setSelectionDirection(null);
      return;
    }

    const attempt = selection.map(([r, c]) => grid[r][c]).join('');
    const rev = [...attempt].reverse().join('');
    
    console.log('User selected:', attempt, 'or reversed:', rev);
    console.log('Selection coordinates:', selection);
    
    // Find matching placement by checking the placed word (or its reverse) against our attempt
    const match = placements.find((p) => {
      const placedWord = p.placedWord || p.word;
      const placedWordRev = [...placedWord].reverse().join('');
      const isMatch = (placedWord === attempt || placedWord === rev || 
                      placedWordRev === attempt || placedWordRev === rev) && 
                     !foundWords.includes(p.word);
      
      if (isMatch) {
        console.log('Matched placement:', p.word, 'at coords:', p.coords);
      }
      return isMatch;
    });
    
    if (match) {
      // Always add the original word (not the placed word) to foundWords
      const newFound = [...foundWords, match.word];
      setFoundWords(newFound);
      console.log('Added to found words:', match.word);
      
      if (newFound.length === words.length) {
        setRunning(false);
        if (bestTime === null || seconds < bestTime) {
          setBestTime(seconds);
        }
        // Trigger celebration
        setCelebrated(true);
      }
    } else {
      console.log('No match found for selection');
    }
    
    setSelecting(false);
    setSelection([]);
    setSelectionDirection(null);
  }

  function handleTouchMove(e: React.TouchEvent) {
    const t = e.touches[0];
    const el = document.elementFromPoint(t.clientX, t.clientY);
    if (el && el instanceof HTMLElement && el.dataset.cell) {
      const [rStr, cStr] = el.dataset.cell.split(',');
      const r = Number(rStr);
      const c = Number(cStr);
      if (!Number.isNaN(r) && !Number.isNaN(c)) {
        continueSelection(r, c);
      }
    }
  }

  function cellSelected(r: number, c: number) {
    return selection.some(([rr, cc]) => rr === r && cc === c);
  }

  function cellFound(r: number, c: number) {
    for (const p of placements) {
      if (foundWords.includes(p.word)) {
        for (const [rr, cc] of p.coords) {
          if (rr === r && cc === c) return p.word;
        }
      }
    }
    return null;
  }

   // Calculate oriented rounded rectangle aligned with the word direction
  function getWordOrientedRect(placement: Placement) {
    if (placement.coords.length === 0) return null;

    const firstCoord = placement.coords[0];
    const lastCoord = placement.coords[placement.coords.length - 1];

    const firstCell = document.querySelector(`[data-cell="${firstCoord[0]},${firstCoord[1]}"]`);
    const lastCell = document.querySelector(`[data-cell="${lastCoord[0]},${lastCoord[1]}"]`);
    if (!firstCell || !lastCell) return null;

    const gridContainer = firstCell.parentElement;
    if (!gridContainer) return null;
    const gridRect = gridContainer.getBoundingClientRect();

    const firstRect = (firstCell as HTMLElement).getBoundingClientRect();
    const lastRect = (lastCell as HTMLElement).getBoundingClientRect();

    const firstCenterX = (firstRect.left - gridRect.left) + firstRect.width / 2;
    const firstCenterY = (firstRect.top - gridRect.top) + firstRect.height / 2;
    const lastCenterX = (lastRect.left - gridRect.left) + lastRect.width / 2;
    const lastCenterY = (lastRect.top - gridRect.top) + lastRect.height / 2;

    const dx = lastCenterX - firstCenterX;
    const dy = lastCenterY - firstCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Infer cell size from first cell
    const cellWidth = firstRect.width;
    const cellHeight = firstRect.height;

    // Make the bar slightly thinner than a cell and extend to cover full cells at ends
    const thickness = Math.max(8, Math.min(cellWidth, cellHeight) - 6);
    const length = distance + Math.max(cellWidth, cellHeight);

    const cx = (firstCenterX + lastCenterX) / 2;
    const cy = (firstCenterY + lastCenterY) / 2;

    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const rx = Math.min(10, thickness / 2);

    return {
      cx,
      cy,
      width: length,
      height: thickness,
      angle,
      rx,
    };
  }

  function formatTime(sec: number) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  // Celebrate when puzzle completes
  useEffect(() => {
    if (celebrated && words.length > 0 && foundWords.length === words.length) {
      const defaults = { ticks: 200, gravity: 1.0, spread: 70, scalar: 1 };
      const shoot = (particleRatio: number, opts: ConfettiOptions) => {
        confetti(Object.assign({}, defaults, opts, {
          particleCount: Math.floor(400 * particleRatio),
        }));
      };
      shoot(0.25, { spread: 26, startVelocity: 55 });
      shoot(0.2, { spread: 60 });
      shoot(0.35, { spread: 100, decay: 0.91, scalar: 1.1 });
      shoot(0.1, { spread: 120, startVelocity: 25, decay: 0.92 });
      shoot(0.1, { spread: 120, startVelocity: 45 });
    }
  }, [celebrated, foundWords.length, words.length]);

  // Guards for selection/loading/error
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
          <p className="text-gray-700 font-medium text-lg">Loading {selectedWordList} word list...</p>
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

  return (
    <div className="p-2 max-w-screen-sm mx-auto bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        
        <div className="flex gap-2">
        <Link 
            href="/" 
            className="flex items-center text-white/90 hover:text-white font-semibold text-base sm:text-lg hover:underline transition-all duration-200"
          >
            <span className="mr-2">←</span> Back to Home
          </Link>
          <button
            onClick={initializePuzzle}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            New Game ↻
          </button>
          <button
            onClick={() => setRunning(!running)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            {running ? 'Pause' : 'Resume'}
          </button>
        </div>
        
      </div>
      <h2 className="text-lg sm:text-3xl md:text-4xl font-bold text-white mb-2">Word Search</h2>
      <div className="flex gap-6 items-center mb-2 bg-white rounded-lg p-3 shadow-sm">
        <div>
          <div className="text-sm text-gray-600">Time</div>
          <div className="font-mono text-lg font-bold text-gray-800">{formatTime(seconds)}</div>
        </div>
        {/* <div>
          <div className="text-sm text-gray-600">Best</div>
          <div className="font-mono text-lg font-bold text-gray-800">
            {bestTime === null ? '--:--' : formatTime(bestTime)}
          </div>
        </div> */}
        <div>
          <div className="text-sm text-gray-600">Progress</div>
          <div className="font-bold text-lg text-gray-800">{foundWords.length}/{words.length}</div>
        </div>
      </div>

      {grid.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-600">Loading puzzle…</div>
        </div>
      ) : (
        <>
          <div
            className="grid gap-1 mx-auto mb-6 p-4 bg-white rounded-lg shadow-lg relative"
            style={{ 
              gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
              gap: '0.15rem',
              touchAction: 'none',
              maxWidth: '500px', 
            }}
            onMouseUp={endSelection}
            onTouchEnd={endSelection}
            onTouchMove={(e) => e.preventDefault()}
          >
            {grid.map((row, r) =>
              row.map((letter, c) => {
                const isSelected = cellSelected(r, c);
                const foundWord = cellFound(r, c);
                
                return (
                  <div
                    key={`${r}-${c}`}
                    data-cell={`${r},${c}`}
                    onMouseDown={() => startSelection(r, c)}
                    onMouseEnter={() => continueSelection(r, c)}
                    onTouchStart={() => startSelection(r, c)}
                    onTouchMove={handleTouchMove}
                    className={`
                      aspect-square flex items-center justify-center border rounded-lg select-none font-bold cursor-pointer transition-all duration-150
                      ${foundWord 
                        ? 'bg-blue-50 text-blue-800' 
                        : isSelected 
                        ? 'bg-yellow-100 border-yellow-400 border-4 text-gray-800 scale-110' 
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }
                    `}
                    style={{ 
                      fontSize: 'clamp(0.75rem, 3vw, 1.25rem)',
                      userSelect: 'none', 
                      touchAction: 'none',
                      boxShadow: isSelected ? '0 0 10px rgba(255, 193, 7, 0.5)' : 'none'
                    }}
                  >
                    {letter}
                  </div>
                );
              })
            )}
            
            {/* SVG overlay for word rectangles */}
            <svg 
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
            >
              {placements
                .filter(p => foundWords.includes(p.word))
                .map((placement, index) => {
                  const orect = getWordOrientedRect(placement);
                  if (!orect) return null;
                  
                  // Use different colors for different words
                  const colors = ['#dc2626', '#059669', '#7c3aed', '#ea580c', '#0891b2', '#be123c'];
                  const color = colors[index % colors.length];
                  
                  return (
                    <rect
                      key={`rect-${placement.word}-${index}`}
                      x={orect.cx - orect.width / 2}
                      y={orect.cy - orect.height / 2}
                      width={orect.width}
                      height={orect.height}
                      rx={orect.rx}
                      ry={orect.rx}
                      transform={`rotate(${orect.angle} ${orect.cx} ${orect.cy})`}
                      fill="none"
                      stroke={color}
                      strokeWidth="3"
                      strokeLinecap="round"
                      opacity="0.8"
                    />
                  );
                })}
            </svg>
          </div>

          <div className="bg-white rounded-lg p-2 sm:p-4 shadow-sm">
            <h3 className="font-bold text-lg mb-1 sm:mb-3 text-gray-800">Find these words:</h3>
            <div className="flex flex-wrap gap-2">
              {words.map((w) => {
                const isFound = foundWords.includes(w);
                // Get the color for this word (same as used in circles)
                const wordIndex = placements.findIndex(p => p.word === w);
                const colors = ['#dc2626', '#059669', '#7c3aed', '#ea580c', '#0891b2', '#be123c'];
                const wordColor = colors[wordIndex % colors.length];
                
                return (
                  <div 
                    key={w} 
                    className={`
                      px-2 py-1 border-2 rounded-lg font-medium transition-all duration-300 relative
                      ${isFound 
                        ? 'bg-blue-50 text-blue-800' 
                        : 'bg-gray-50 border-gray-200 text-gray-700'
                      }
                    `}
                    style={{
                      borderColor: isFound ? wordColor : '#e5e7eb'
                    }}
                  >
                    <span className={isFound ? 'line-through decoration-2' : ''} 
                          style={{ textDecorationColor: isFound ? wordColor : 'inherit' }}>
                      {w}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {foundWords.length === words.length && words.length > 0 && (
            <div className="mt-6 p-4 bg-gradient-to-r from-green-400 to-green-500 border-0 rounded-lg text-white font-bold text-center shadow-lg">
              <div className="text-2xl mb-1">🎉 Congratulations!</div>
              <div>You found all words in {formatTime(seconds)}!</div>
              {bestTime === seconds && (
                <div className="text-sm mt-1 opacity-90">New best time! ⭐</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}