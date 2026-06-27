import React from 'react';
import { FaUserSecret } from "react-icons/fa";

const AdminOnly = () => {
  return (
    <div className="flex flex-col items-center justify-center p-4 h-screen bg-base-100 text-white">
      <div className="text-center">
        <div className="mb-4">
          <FaUserSecret className="w-16 h-16 mx-auto text-gray-400" />
        </div>
        <h1 className="text-3xl font-bold">This Page Isn't Meant for You</h1>
        <p className="text-gray-400 mt-2">
          You do not have the required permissions to access this page.
        </p>
      </div>
    </div>
  );
};

export default AdminOnly;
