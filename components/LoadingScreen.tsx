'use client';

import { useState, useEffect } from 'react';

export default function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  // Loading screen lifecycle
  useEffect(() => {
    // Start fade out after components have loaded
    const fadeTimer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);

    // Remove from DOM after fade animation completes
    const removeTimer = setTimeout(() => {
      setIsVisible(false);
    }, 1700); // Extra 500ms for fade animation

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 bg-black flex items-center justify-center transition-opacity duration-500 ${isLoading ? 'opacity-100' : 'opacity-0'}`}>
      {/* Clean dark background with subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
        {/* Subtle animated accent */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-r from-forest-500/20 via-transparent to-forest-600/20 animate-pulse" />
        </div>
      </div>

      {/* Loading content */}
      <div className="relative z-10 text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/20 mx-auto mb-4">
            <img 
              src="/logo.svg" 
              alt="Gen-Plasma Logo" 
              className="w-16 h-16 filter brightness-0 invert animate-pulse"
            />
          </div>
        </div>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold plasma-gradient-text mb-2">
            Gen-Plasma
          </h1>
          <p className="text-forest-300 text-lg font-light">
            Generative Collection
          </p>
        </div>

        {/* Loading animation */}
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className="w-2 h-2 bg-forest-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-forest-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-forest-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>

        {/* Loading text */}
        <p className="text-gray-400 text-sm animate-pulse">
          Initializing plasma dynamics...
        </p>
      </div>

    </div>
  );
}
