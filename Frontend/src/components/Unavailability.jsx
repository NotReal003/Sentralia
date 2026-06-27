import React, { useState } from 'react';
import { FaClock, FaTimes } from 'react-icons/fa';

const NetherGamesBanner = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 text-white px-3 py-1.5 flex items-center justify-center relative w-full shadow-sm z-50 text-[11px] sm:text-xs">
      <div className="flex items-center space-x-1.5 sm:space-x-2 font-medium">
        <FaClock className="text-white/90 shrink-0" />
        <span>
          The website and services will cease operations on{' '}
          <span className="font-bold bg-black/10 px-1.5 py-0.5 rounded">
            28 June 2026
          </span>
          .{' '}
          <a
            href="https://support.notreal003.org/closure-announcement"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-semibold hover:text-white/90"
          >
            Read the announcement
          </a>
          .
        </span>
      </div>

      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-2 p-1 hover:bg-black/10 rounded transition-colors"
        aria-label="Dismiss banner"
      >
        <FaTimes className="text-white/90 w-3 h-3" />
      </button>
    </div>
  );
};

export default NetherGamesBanner;
