import type { NextConfig } from "next";
import { copyFileSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/vocab-games-react',
  assetPrefix: '/vocab-games-react/',
  trailingSlash: true,
  images: {
    unoptimized: true
  },

  async exportPathMap() {
    // Ensure wordlists directory exists
    const outDir = join(process.cwd(), 'out');
    const wordlistsDir = join(outDir, 'wordlists');
    
    try {
      mkdirSync(wordlistsDir, { recursive: true });
      
      // Copy all word list JSON files
      const dataDir = join(process.cwd(), 'data');
      const files = readdirSync(dataDir).filter(file => file.endsWith('.json'));
      
      files.forEach(file => {
        const source = join(dataDir, file);
        const dest = join(wordlistsDir, file);
        copyFileSync(source, dest);
      });
      
      console.log('Word lists copied to out/wordlists/');
    } catch (error) {
      console.error('Error copying word lists:', error);
    }

    return {
      '/': { page: '/' },
      '/matching': { page: '/matching' },
      '/multiple-choice': { page: '/multiple-choice' },
      '/wordsearch': { page: '/wordsearch' },
      '/flashcards': { page: '/flashcards' },
      '/coming-soon': { page: '/coming-soon' }
    };
  }
    
};

export default nextConfig;
