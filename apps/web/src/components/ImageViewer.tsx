"use client";
import React from "react";

type ImageViewerProps = {
  imageUrl: string;
  onClose: () => void;
};

export default function ImageViewer({ imageUrl, onClose }: ImageViewerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col items-center justify-center">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute -top-12 right-0 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        
        {/* Image */}
        <img 
          src={imageUrl} 
          alt="Full Resolution View" 
          className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/10"
        />
        
        <a 
          href={imageUrl} 
          download 
          target="_blank"
          className="mt-6 btn-primary px-6 py-2 text-sm"
        >
          Open Original File
        </a>
      </div>
    </div>
  );
}
