import React from "react";
import apiClient, { APIURL } from "../utils/api";
import FocusLock from "react-focus-lock";

const LogoutModal = ({ isOpen, onConfirm, onCancel, setShowAlert, setErrorIssue }) => {
  if (!isOpen) return null;

  const handleLogout = async () => {
    try {
      const res = await apiClient.get(`${APIURL}/auth/signout`);

      if (res.status !== 200) {
        setShowAlert(true);
        setErrorIssue("We are unable to log you out.");
        return;
      }

      document.cookie = "token=; Max-Age=0; path=/; domain=notreal003.org; secure";

      window.location.href = "/";
    } catch (error) {
      setShowAlert(true);
      setErrorIssue(error.response?.data?.message || "We are unable to log you out.");
      console.error(error);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className="bg-gray-800 text-white rounded-lg shadow-lg p-6 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <FocusLock>
          <h3 className="text-lg font-semibold">Are you sure?</h3>
          <p className="text-gray-400 mt-2">
            Do you really want to log out? You’ll need to log back in to access your account.
          </p>
          <div className="flex justify-end mt-4 space-x-3">
            <button
              className="btn no-animation bg-blue-600 text-white font-medium rounded-lg shadow-sm flex items-center hover:bg-blue-700 transition-all"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              className="btn no-animation bg-red-600 text-white font-medium rounded-lg shadow-sm flex items-center hover:bg-red-700 transition-all"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </FocusLock>
      </div>
    </div>
  );
};

export default LogoutModal;
