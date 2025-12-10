
import React, { useState, useRef, useEffect } from 'react';

interface ImageLightboxProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({ src, alt, onClose }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset on open
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [src]);

  // Handle Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const delta = e.deltaY * -0.002;
    const newScale = Math.min(Math.max(0.5, scale + delta), 5); // Min 0.5x, Max 5x
    setScale(newScale);
  };

  // Handle Pan - Start
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  // Handle Pan - Move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - startPos.x,
      y: e.clientY - startPos.y
    });
  };

  // Handle Pan - End
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center overflow-hidden"
      onClick={onClose}
    >
      <div className="absolute top-4 right-4 z-[110] flex gap-4">
        <div className="text-white/70 text-xs px-3 py-1 rounded-full bg-white/10 backdrop-blur pointer-events-none">
          Scroll to Zoom • Drag to Pan
        </div>
        <button 
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/40 transition-colors font-bold"
        >
          ✕
        </button>
      </div>

      <div 
        ref={containerRef}
        className="w-full h-full flex items-center justify-center cursor-move"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={(e) => e.stopPropagation()} // Prevent close when clicking image area
      >
        <img 
          src={src} 
          alt={alt} 
          className="max-w-[90vw] max-h-[90vh] object-contain transition-transform duration-75 ease-out select-none shadow-2xl"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          }}
          draggable={false}
        />
      </div>
    </div>
  );
};

export default ImageLightbox;