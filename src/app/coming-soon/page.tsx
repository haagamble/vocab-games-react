// app/coming-soon/page.tsx
"use client";

import { useEffect, useState } from "react";

export default function ComingSoonPage() {
  const messages = [
    "More fun is on the way! 🎉",
    "New challenges are brewing... ☕",
    "Your next language adventure is almost ready! 🌍",
    "Learning never stops — and neither do we! 🚀",
  ];

  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-pink-100 via-yellow-100 to-green-100 text-center px-4">
      <div className="animate-bounce text-6xl mb-6">📚✨</div>

      <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 mb-4">
        Coming Soon
      </h1>

      <p className="text-lg sm:text-xl text-gray-600 max-w-lg mb-8 transition-all duration-500 ease-in-out">
        {messages[messageIndex]}
      </p>

      <button
        onClick={() => window.history.back()}
        className="px-6 py-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors duration-300"
      >
        ⬅ Back to Activities
      </button>

      <div className="mt-12 text-sm text-gray-500">
        Happy Language Learning! 💬🌟
      </div>
    </div>
  );
}
