import React, { useRef, useState } from 'react';

interface ImageComparisonSliderProps {
  before: string;
  after: string;
}

const ImageComparisonSlider: React.FC<ImageComparisonSliderProps> = ({ before, after }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPos, setSliderPos] = useState(100);
  const [isAfterLoaded, setIsAfterLoaded] = useState(false);

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
    window.addEventListener('mousemove', handleMove as any);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseUp = () => {
    window.removeEventListener('mousemove', handleMove as any);
    window.removeEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-96 overflow-hidden select-none"
      onMouseDown={handleMouseDown}
      onTouchStart={handleMove}
      onTouchMove={handleMove}
    >
      <img src={before} alt="Before" className="w-full h-full object-contain" />
      <img
        src={after}
        alt="After"
        className="absolute top-0 left-0 w-full h-full object-contain"
        style={{ opacity: sliderPos / 100 }}
        onLoad={() => setIsAfterLoaded(true)}
      />
      {/* Image labels */}
      <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 text-xs rounded z-10">
         Before
      </div>
      <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 text-xs rounded z-10">
         After
      </div>
      {/* Spinner overlay while after image loads */}
      {!isAfterLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
          <span className="inline-block w-8 h-8 border-4 rounded-full border-t-transparent border-white animate-spin"></span>
        </div>
      )}
      {/* Slider line */}
      <div
        className="absolute top-0 h-full"
        style={{
          left: `${sliderPos}%`,
          width: "2px",
          backgroundColor: 'white',
          borderRight: '1px solid #000'
        }}
      />
      {/* Draggable handle */}
      <div
        className="absolute top-1/2 transform -translate-y-1/2 bg-white border border-gray-400 rounded-full cursor-pointer"
        style={{
          left: `calc(${sliderPos}% - 10px)`,
          width: "20px",
          height: "20px"
        }}
        onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(); }}
      />
    </div>
  );
};

export default ImageComparisonSlider; 