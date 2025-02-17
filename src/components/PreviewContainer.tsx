import React from 'react';
import type { ProcessingResult } from '../types';
import ImageComparisonSlider from './ImageComparisonSlider';

interface PreviewContainerProps {
  imageUrl: string;
  result: ProcessingResult | null;
}

export function PreviewContainer({ imageUrl, result }: PreviewContainerProps) {
  return (
    <div className="bg-gray-800 rounded-2xl shadow-xl p-8 transition-all duration-300 hover:shadow-2xl border border-gray-700">
      {result?.outputUrl ? (
        <>
          <h3 className="text-lg font-medium text-gray-200 mb-6">
            Interactive Comparison
          </h3>
          <ImageComparisonSlider before={imageUrl} after={result.outputUrl} />
        </>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-200">Original Image</h3>
          <div className="rounded-xl overflow-hidden shadow-lg">
            <img
              src={imageUrl}
              alt="Original"
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
      )}

      {result?.status === 'error' && (
        <div className="mt-6 p-4 bg-red-900/50 rounded-xl border border-red-700">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-red-400 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-red-400 font-medium">{result.error}</p>
          </div>
        </div>
      )}
    </div>
  );
}