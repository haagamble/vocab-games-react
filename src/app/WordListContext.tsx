'use client';

import { createContext, useContext, useState, ReactNode } from "react";

// Create context for sharing word list across pages
// An interface exists only at compile time (when TypeScript checks your code for type errors).
// An interface describes the shape of an object.
// If something claims to implement that interface, it must match the shape.
// When TypeScript compiles to JavaScript, interfaces disappear completely.

interface WordListContextType {
  selectedWordList: string | null;
  setSelectedWordList: (wordList: string | null) => void;
}

const WordListContext = createContext<WordListContextType | undefined>(undefined);

// Hook to use the word list context
export function useWordList() {
  const context = useContext(WordListContext);
  if (context === undefined) {
    throw new Error('useWordList must be used within a WordListProvider');
  }
  return context;
}

// Provider component
export function WordListProvider({ children }: { children: ReactNode }) {
  const [selectedWordList, setSelectedWordList] = useState<string | null>(null);

  return (
    <WordListContext.Provider value={{ selectedWordList, setSelectedWordList }}>
      {children}
    </WordListContext.Provider>
  );
}