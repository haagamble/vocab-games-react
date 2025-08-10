// src/app/utils/wordListLoader.ts

export interface WordItem {
  word: string;
  definition: string;
  // Add other properties your JSON files might have
  example?: string;
  difficulty?: string;
  partOfSpeech?: string;
}

export interface WordList {
  name: string;
  words: WordItem[];
}

/**
 * Load a word list from the data folder
 * @param listName - The name of the JSON file (without .json extension)
 * @returns Promise with the word list data
 */
export async function loadWordList(listName: string): Promise<WordList | null> {
  try {
    // Determine the correct URL based on environment
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
    
    // In production (GitHub Pages), load from static wordlists folder
    // In development (localhost), load from API
    const url = isProduction 
      ? `${basePath}/wordlists/${listName}.json`
      : `/api/wordlists/${listName}`;
    
    console.log('Loading word list from:', url);
    console.log('Base path:', basePath);
    console.log('Is production:', isProduction);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Failed to load word list: ${listName} (${response.status})`);
      return null;
    }
    
    const rawData = await response.json();
    
    // Transform the array-of-arrays format to WordItem objects
    const words: WordItem[] = rawData.map((item: [string, string]) => ({
      word: item[0],      // Tajik word
      definition: item[1] // English definition
    }));
    
    return {
      name: listName,
      words: words
    };
  } catch (error) {
    console.error(`Error loading word list ${listName}:`, error);
    return null;
  }
}

/**
 * Generate multiple choice options for a word
 * @param correctWord - The correct word
 * @param allWords - All words in the current word list
 * @param numOptions - Number of total options (default 4)
 * @returns Array of options with the correct answer included
 */
export function generateMultipleChoiceOptions(
  correctWord: string,
  allWords: WordItem[],
  numOptions: number = 4
): string[] {
  // Get incorrect options (exclude the correct word)
  const incorrectWords = allWords
    .filter(item => item.word !== correctWord)
    .map(item => item.word);
  
  // Shuffle and take the needed number of incorrect options
  const shuffledIncorrect = incorrectWords.sort(() => Math.random() - 0.5);
  const incorrectOptions = shuffledIncorrect.slice(0, numOptions - 1);
  
  // Combine correct and incorrect options
  const allOptions = [correctWord, ...incorrectOptions];
  
  // Shuffle the final options so correct answer isn't always first
  return allOptions.sort(() => Math.random() - 0.5);
}

/**
 * Shuffle an array (Fisher-Yates algorithm)
 * @param array - Array to shuffle
 * @returns New shuffled array
 */
export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}