import React from "react";
import { MdWifiOff } from "react-icons/md";

const OfflineWarning = () => {
  return (
    <div className="fixed inset-0 bg-black-900 z-50 flex items-center justify-center">
      <div className="bg-black-800 p-8 rounded-lg shadow-xl text-gray-100 text-center max-w-sm w-full mx-4">
        <div className="mb-6">
          <MdWifiOff className="w-20 h-20 mx-auto text-red-500 animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold mb-4 md:text-3xl">You're Offline</h1>
        <p className="text-gray-300 text-base mt-2 mb-4">
          Please check your internet connection.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300"
        >
          Retry
        </button>
      </div>
    </div>
  );
};

export default OfflineWarning;
