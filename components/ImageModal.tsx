import React from 'react';

interface ImageModalProps {
    src: string | null;
    onClose: () => void;
}

export default function ImageModal({ src, onClose }: ImageModalProps) {
    if (!src) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
            onClick={onClose}
        >
            <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white text-4xl font-bold bg-black/50 w-12 h-12 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors z-60"
                >
                    &times;
                </button>
                <img
                    src={src}
                    alt="Zoomed"
                    className="max-w-full max-h-full object-contain cursor-zoom-out"
                    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
                />
            </div>
        </div>
    );
}
