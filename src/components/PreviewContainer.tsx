import React, { useState } from 'react';
import ImageComparisonSlider from './ImageComparisonSlider';

interface PreviewContainerProps {
  imageUrl: string;
  resultUrl: string | null;
  onBack?: () => void;
}

export function PreviewContainer({ imageUrl, resultUrl, onBack }: PreviewContainerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'enhanced-image.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (isFullscreen && resultUrl) {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
        <div className="relative w-full h-full">
          <div className="absolute top-4 right-4 flex items-center gap-4 z-10">
            <button
              onClick={() => handleDownload(resultUrl)}
              className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 text-white transition-colors duration-200"
              title="Download image"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 text-white transition-colors duration-200"
              title="Exit fullscreen"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="w-full h-full flex items-center justify-center p-8">
            <ImageComparisonSlider before={imageUrl} after={resultUrl} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-2xl shadow-xl p-8 transition-all duration-300 hover:shadow-2xl border border-gray-700">
      {resultUrl ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-200">Interactive Comparison</h3>
            <div className="flex items-center gap-3">
              {onBack && (
                <button
                  onClick={onBack}
                  className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-blue-400 bg-blue-500/20 rounded-full hover:bg-blue-500/30 transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                  </svg>
                  Back to Grid
                </button>
              )}
              <button
                onClick={() => setIsFullscreen(true)}
                className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-purple-400 bg-purple-500/20 rounded-full hover:bg-purple-500/30 transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                Fullscreen
              </button>
            </div>
          </div>
          <div className="relative">
            <ImageComparisonSlider before={imageUrl} after={resultUrl} />
            <button
              onClick={() => handleDownload(resultUrl)}
              className="absolute bottom-4 right-4 p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 text-white transition-colors duration-200"
              title="Download image"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-4 h-screen">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-200">Original Image</h3>
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-3 py-1 text-sm font-medium text-blue-400 bg-blue-500/20 rounded-full hover:bg-blue-500/30 transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
                Back to Grid
              </button>
            )}
          </div>
          <div className="rounded-xl overflow-hidden shadow-lg h-full">
            <img src={imageUrl} alt="Original" className="w-full h-full object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageComparisonSlider;