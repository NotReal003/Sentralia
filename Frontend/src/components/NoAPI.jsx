import React from 'react';
import { FaChartBar, FaTools, FaDiscord } from "react-icons/fa";

const NoAPI = () => {
  return (
    <div className="flex items-center justify-center min-h-screen px-6 py-12 bg-gradient-to-br from-black via-gray-900 to-black text-white">
      <div className="max-w-xl text-center">
        
        <div className="mb-6 animate-pulse">
          <FaTools className="w-20 h-20 mx-auto text-yellow-400" />
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight">
          API Temporarily Unavailable
        </h1>

        <p className="mt-4 text-lg text-gray-400">
          Our services are currently undergoing scheduled maintenance. API access is disabled during this time.
          We apologize for the inconvenience and appreciate your patience.
        </p>

        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-center gap-2">
            <FaDiscord className="text-indigo-500 w-5 h-5" />
            <a
              href="https://discord.gg/sqVBrMVQmp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:underline"
            >
              Join our Discord for live updates
            </a>
          </div>

          <div className="flex items-center justify-center gap-2">
            <FaChartBar className="text-cyan-500 w-5 h-5" />
            <a
              href="https://check.notreal003.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:underline"
            >
              View system status
            </a>
          </div>
        </div>

        <p className="mt-10 text-sm text-gray-500">
          We’ll be back shortly. Thank you for your understanding.
        </p>
      </div>
    </div>
  );
};

export default NoAPI;
