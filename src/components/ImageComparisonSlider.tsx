import React, { useRef, useState } from 'react';

interface ImageComparisonSliderProps {
  before: string;
  after: string;
}

const ImageComparisonSlider: React.FC<ImageComparisonSliderProps> = ({ before, after }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPos, setSliderPos] = useState(50);
  const [isAfterLoaded, setIsAfterLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const bounds = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    let newPos = ((clientX - bounds.left) / bounds.width) * 100;
    if (newPos < 0) newPos = 0;
    if (newPos > 100) newPos = 100;
    setSliderPos(newPos);
  };

  const handleMouseDown = () => {
    setIsDragging(true);
    window.addEventListener('mousemove', handleMove as any);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    window.removeEventListener('mousemove', handleMove as any);
    window.removeEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="relative rounded-xl overflow-hidden shadow-lg">
      <div
        ref={containerRef}
        className="relative w-full h-96 overflow-hidden select-none bg-gray-900 group"
        onMouseDown={handleMouseDown}
        onTouchStart={handleMove}
        onTouchMove={handleMove}
      >
        
          <img
            src={after}
            alt="After"
            className="w-full h-full object-contain"
            onLoad={() => setIsAfterLoaded(true)}
          />

          {/* After image with clip path */}
          <div 
            className="absolute top-0 left-0 w-full h-full"
            style={{
              clipPath: `inset(0 ${100 - sliderPos}% 0 0)`
            }}
          >
            
        {/* Before image */}
        <img 
          src={before} 
          alt="Before" 
          className="absolute top-0 left-0 w-full h-full object-contain transition-opacity duration-300"
        />
        </div>

        {/* Image labels */}
        <div className="absolute top-4 left-4 bg-black/80 text-white px-3 py-1.5 text-sm font-medium rounded-full backdrop-blur-sm transition-transform duration-300 transform group-hover:scale-105 border border-gray-700">
          Before
        </div>
        <div className="absolute top-4 right-4 bg-black/80 text-white px-3 py-1.5 text-sm font-medium rounded-full backdrop-blur-sm transition-transform duration-300 transform group-hover:scale-105 border border-gray-700">
          After
        </div>

        {/* Loading spinner */}
        {!isAfterLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-white/30 rounded-full"></div>
              <div className="absolute top-0 w-12 h-12 border-4 border-t-white rounded-full animate-spin"></div>
            </div>
          </div>
        )}

        {/* Slider line */}
        <div
          className={`absolute top-0 h-full transition-colors duration-200 ${
            isDragging ? 'bg-blue-500' : 'bg-white'
          }`}
          style={{
            left: `${sliderPos}%`,
            width: "2px",
            boxShadow: "0 0 10px rgba(0,0,0,0.5)"
          }}
        />

        {/* Slider handle */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 -ml-5 cursor-grab active:cursor-grabbing transition-transform duration-200 ${
            isDragging ? 'scale-110' : 'scale-100'
          }`}
          style={{
            left: `${sliderPos}%`
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            handleMouseDown();
          }}
        >
          <div className="w-6 h-6 rounded-full bg-white shadow-lg flex items-center justify-center border border-gray-200">
            <svg
              className={`w-4 h-4 text-gray-600 transition-colors duration-200 ${
                isDragging ? 'text-blue-500' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 9l4-4 4 4m0 6l-4 4-4-4"
              />
            </svg>
          </div>
        </div>

        {/* Instructions overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-white text-center text-sm font-medium opacity-80">
            Drag the slider to compare images
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImageComparisonSlider;