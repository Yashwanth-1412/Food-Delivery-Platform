import React from 'react';

const LoadingScreen = ({ message = "Loading your dashboard..." }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        {/* Loading Spinner */}
        <div className="relative">
          <div className="w-16 h-16 mx-auto mb-6">
            <svg 
              className="animate-spin w-16 h-16 text-indigo-600" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          
          {/* Pulsing dots */}
          <div className="flex justify-center space-x-2 mb-6">
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>

        {/* Loading Text */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          {message}
        </h2>
        <p className="text-gray-600">
          Please wait while we prepare your experience
        </p>

        {/* Progress indicator */}
        <div className="mt-8 w-64 mx-auto">
          <div className="bg-gray-200 rounded-full h-1 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-blue-600 h-full rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;