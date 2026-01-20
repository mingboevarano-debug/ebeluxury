'use client';

import React, { useState, useEffect } from 'react';

interface SketchCanvasWrapperProps {
  canvasRef: React.RefObject<any>;
  strokeColor: string;
  strokeWidth: number;
  eraserWidth: number;
}

export default function SketchCanvasWrapper({
  canvasRef,
  strokeColor,
  strokeWidth,
  eraserWidth,
}: SketchCanvasWrapperProps) {
  const [CanvasComponent, setCanvasComponent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only load on client side
    if (typeof window !== 'undefined') {
      import('react-sketch-canvas')
        .then((mod) => {
          if (mod && mod.ReactSketchCanvas) {
            setCanvasComponent(() => mod.ReactSketchCanvas);
          } else {
            console.error('ReactSketchCanvas not found in module');
          }
        })
        .catch((error) => {
          console.error('Failed to load react-sketch-canvas:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

  if (loading || !CanvasComponent) {
    return (
      <div className="flex items-center justify-center h-full min-h-[600px] text-gray-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p>Loading canvas...</p>
        </div>
      </div>
    );
  }

  return (
    <CanvasComponent
      ref={canvasRef}
      width="100%"
      height="600px"
      strokeColor={strokeColor}
      canvasColor="#FFFFFF"
      strokeWidth={strokeWidth}
      eraserWidth={eraserWidth}
      style={{ border: 'none' }}
    />
  );
}
