'use client';

import Link from "next/link"; // Next.js component for client-side navigation between pages
import { useWordList } from './WordListContext'; // Custom React Context hook for sharing selected word list across pages
import { useState, useEffect } from 'react';

// TypeScript interface: defines the shape of each word list option
// An interface exists only at compile time (when TypeScript checks your code for type errors).
// An interface describes the shape of an object.
// If something claims to implement that interface, it must match the shape.
// When TypeScript compiles to JavaScript, interfaces disappear completely.
interface WordListOption {
  display: string; // Display name for the word list
  filename: string; // Corresponding filename for the word list JSON file 
}

// Main component for the home page
// Displays a welcome message and allows users to select a word list for games
export default function Home() {
  const { selectedWordList, setSelectedWordList } = useWordList();
  const [availableWordLists, setAvailableWordLists] = useState<WordListOption[]>([]);

  // Load available word lists (mapping display names to file names)
  useEffect(() => {
    const wordLists: WordListOption[] = [
      { display: 'Adjectives', filename: 'adjectives' },
      { display: 'Animals & Nature', filename: 'animals-and-nature' },
      { display: 'Around Town', filename: 'around-town' },
      { display: 'First 100 Words', filename: 'first-100-words' },
      { display: 'Food & Drink', filename: 'food-and-drink' },
      { display: 'Friends & Family', filename: 'friends-and-family' },
      { display: 'Spiritual Vocab', filename: 'spiritual' },
      { display: 'Verbs: Level 1', filename: 'verbs-1' },
      { display: 'Verbs: Level 2', filename: 'verbs-2' },     
    ];
    setAvailableWordLists(wordLists);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-8">
      <div className="max-w-6xl mx-auto bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8">
        <main className="flex flex-col gap-4 sm:gap-8 items-center">
          {/* Header Section */}
          <div className="text-center">
            <h1 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
              Welcome to Vocab Games
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl">
              Activities to help you learn and practice vocabulary.
            </p>
          </div>
          
          {/* Word List Selection Dropdown */}
          <div className="w-full max-w-md">
            <label htmlFor="wordListSelect" className="block text-lg font-semibold text-gray-800 mb-2">
              Choose a word list:
            </label>
            <div className="relative">
              <select
                id="wordListSelect"
                value={selectedWordList || ''}
                onChange={(e) => setSelectedWordList(e.target.value || null)}
                className="w-full p-4 border-2 border-gray-200 rounded-xl shadow-md focus:ring-4 focus:ring-blue-200 focus:border-blue-500 bg-white text-gray-800 font-medium text-lg transition-all duration-200 hover:border-blue-300"
              >
                <option value="">Select a word list...</option>
                {availableWordLists.map((list) => (
                  <option key={list.filename} value={list.filename}>
                    {list.display}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Game Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full mt-8">
            {/* Multiple Choice */}
            <Link
              href="/multiple-choice"
              className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 transition-all duration-300 transform hover:-translate-y-2 ${
                selectedWordList 
                  ? 'hover:shadow-2xl hover:border-purple-200 cursor-pointer' 
                  : 'opacity-50 cursor-not-allowed pointer-events-none grayscale'
              }`}
            >
              <div className="text-2xl sm:text-4xl mb-4">🔠✅</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Multiple Choice</h2>
              <p className="text-gray-600 mb-4">
                Test your vocabulary with multiple choice questions.
              </p>
              {!selectedWordList ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm font-medium flex items-center">
                    <span className="mr-2">⚠</span>
                    Please select a word list first
                  </p>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-center py-2 px-4 rounded-lg font-semibold">
                  Take Quiz →
                </div>
              )}
            </Link>            
            {/* Matching */}
            <Link
              href="/matching"
              className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 transition-all duration-300 transform hover:-translate-y-2 ${
                selectedWordList 
                  ? 'hover:shadow-2xl hover:border-green-200 cursor-pointer' 
                  : 'opacity-50 cursor-not-allowed pointer-events-none grayscale'
              }`}
            >
              <div className="text-2xl sm:text-4xl mb-4">🎴🎴</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Matching</h2>
              <p className="text-gray-600 mb-4">
                Match Tajik and English words.
              </p>
              {!selectedWordList ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm font-medium flex items-center">
                    <span className="mr-2">⚠</span>
                    Please select a word list first
                  </p>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white text-center py-2 px-4 rounded-lg font-semibold">
                  Start Matching →
                </div>
              )}
            </Link>
            {/* Flashcards */}
            <Link
              href="/flashcards"
              className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 transition-all duration-300 transform hover:-translate-y-2 ${
                selectedWordList 
                  ? 'hover:shadow-2xl hover:border-orange-200 cursor-pointer' 
                  : 'opacity-50 cursor-not-allowed pointer-events-none grayscale'
              }`}
            >
              <div className="text-2xl sm:text-4xl mb-4">🃏🔄 </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Flashcards</h2>
              <p className="text-gray-600 mb-4">
                Study vocabulary with flashcards.
              </p>
              {!selectedWordList ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm font-medium flex items-center">
                    <span className="mr-2">⚠</span>
                    Please select a word list first
                  </p>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-center py-2 px-4 rounded-lg font-semibold">
                  Study Now →
                </div>
              )}
            </Link>
            {/* template for future activities */}
            {/* <Link
              href="/[put-link-here]"
              className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-6 transition-all duration-300 transform hover:-translate-y-2 ${
                selectedWordList 
                  ? 'hover:shadow-2xl hover:border-pink-200 cursor-pointer' 
                  : 'opacity-50 cursor-not-allowed pointer-events-none grayscale'
              }`}
            >
              <div className="text-2xl sm:text-4xl mb-4">⏰👀</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Activity Name</h2>
              <p className="text-gray-600 mb-4">
                Stay tuned for more activities!
              </p>
              {!selectedWordList ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm font-medium flex items-center">
                    <span className="mr-2">⚠</span>
                    Please select a word list first
                  </p>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-center py-2 px-4 rounded-lg font-semibold">
                  Coming Soon →
                </div>
              )}
            </Link> */}
            {/* Wordsearch */}
            <Link
              href="/wordsearch"
              className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 transition-all duration-300 transform hover:-translate-y-2 ${
                selectedWordList 
                  ? 'hover:shadow-2xl hover:border-pink-200 cursor-pointer' 
                  : 'opacity-50 cursor-not-allowed pointer-events-none grayscale'
              }`}
            >
              <div className="text-2xl sm:text-4xl mb-4">🔍🔤</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Wordsearch</h2>
              <p className="text-gray-600 mb-4">
                How many of the words can you find?
              </p>
              {!selectedWordList ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm font-medium flex items-center">
                    <span className="mr-2">⚠</span>
                    Please select a word list first
                  </p>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-center py-2 px-4 rounded-lg font-semibold">
                  Find Words →
                </div>
              )}
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}