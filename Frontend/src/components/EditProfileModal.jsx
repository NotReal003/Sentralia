import React, { useState } from 'react';
import axios from 'axios';
import { FaSave, FaSpinner } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';

const EditProfileModal = ({ isOpen, onClose, currentDisplayName, onUpdate }) => {
  const [newDisplayName, setNewDisplayName] = useState(currentDisplayName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const API = process.env.REACT_APP_API;

  const handleSave = async () => {
    if (newDisplayName.length < 3 || newDisplayName.length > 16) {
      setError('Display name must be between 3 and 16 characters.');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.patch(
        `${API}/users/display`,
        { displayName: newDisplayName },
        { withCredentials: true }
      );

      if (response.status === 200) {
        toast.success('Profile updated!');
        onUpdate(newDisplayName);
        onClose();
      } else {
        toast.error(response.data.message || 'Update failed.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/60">
      <Toaster />
      <div className="bg-gray-900/80 border border-purple-500/30 rounded-2xl p-6 shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-white">Edit Display Name</h2>
        <input
          type="text"
          className="input input-bordered w-full mb-3 bg-gray-800 text-white"
          value={newDisplayName}
          onChange={(e) => setNewDisplayName(e.target.value)}
          maxLength={16}
        />
        <p className="text-sm text-gray-400 mb-2">{16 - newDisplayName.length} characters left</p>
        {error && <p className="text-red-400 mb-2">{error}</p>}
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="btn btn-sm bg-gray-700 text-white hover:bg-gray-600">Cancel</button>
          <button onClick={handleSave} className="btn btn-sm bg-purple-600 text-white hover:bg-purple-700" disabled={loading}>
            {loading ? <FaSpinner className="animate-spin mr-2" /> : <FaSave className="mr-2" />} Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
