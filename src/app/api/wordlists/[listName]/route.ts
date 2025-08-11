import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = "force-static";
export const revalidate = false;

export async function generateStaticParams() {
  const wordLists = [
    'adjectives',
    'animals-and-nature', 
    'around-town',
    'first-100-words',
    'food-and-drink',
    'friends-and-family',
    'spiritual',
    'verbs-1',
    'verbs-2'
  ];
  
  return wordLists.map((listName) => ({
    listName,
  }));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listName: string }> }
) {
  try {
    const { listName } = await params;
    
    // Construct the path to the JSON file
    // This assumes your JSON files are in the data folder at the project root
    const filePath = path.join(process.cwd(), 'data', `${listName}.json`);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { error: `Word list '${listName}' not found` },
        { status: 404 }
      );
    }
    
    // Read and parse the JSON file
    const fileContents = await fs.readFile(filePath, 'utf8');
    const wordListData = JSON.parse(fileContents);
    
    return NextResponse.json(wordListData);
    
  } catch (error) {
    console.error('Error loading word list:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}