//import Image from "next/image";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <h1 className="text-4xl font-bold">Welcome to Vocab Games</h1>
        <p className="text-lg text-gray-700">
          A collection of games to help you learn and practice vocabulary.
        </p>
        {/* Display 4 cards, each of which will link to a new page with a game
        Clicking the first card takes me to the page that is inside src\app\multiple-choice */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <a
            href="/multiple-choice"
            className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition-shadow duration-200"
          >
            <h2 className="text-xl font-semibold mb-2">Multiple Choice</h2>
            <p className="text-gray-600">
              Test your vocabulary with multiple choice questions.
            </p>
          </a>
          {/* Add more game cards here */}
          <a
            href="/multiple-choice"
            className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition-shadow duration-200"
          >
            <h2 className="text-xl font-semibold mb-2">Game 2</h2>
            <p className="text-gray-600">
              All cards link to the same page.
            </p>
          </a>
          <a
            href="/multiple-choice"
            className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition-shadow duration-200"
          >
            <h2 className="text-xl font-semibold mb-2">Game 3</h2>
            <p className="text-gray-600">
              All cards link to the same page.
            </p>
          </a>
          <a
            href="/multiple-choice"
            className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition-shadow duration-200"
          >
            <h2 className="text-xl font-semibold mb-2">Game 4</h2>
            <p className="text-gray-600">
              All cards link to the same page.
            </p>
          </a>
        </div>
        {/* Add more content or features as needed */}
       
      

        
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        
      </footer>
    </div>
  );
}
