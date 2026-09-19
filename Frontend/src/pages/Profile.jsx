import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoMdSettings, IoMdListBox } from "react-icons/io";
import {
  FaDiscord,
  FaCheck,
  FaUserCircle,
  FaSpinner,
  FaTrash
} from "react-icons/fa";
import apiClient, { API } from '../utils/api';
import EditProfileModal from '../components/EditProfileModal';
import {
  MdMarkEmailRead,
  MdAdminPanelSettings
} from "react-icons/md";
import toast, { Toaster } from 'react-hot-toast';
import { FcLinux } from "react-icons/fc";
import { FiUserCheck } from "react-icons/fi";

const Profile = () => {
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

  const [user, setUser] = useState(null);
  const [requestCount, setRequestCount] = useState(0);

  const [deleteRequestConfig, setDeleteRequestConfig] = useState(null);
  const [deleteFields, setDeleteFields] = useState({});
  const [isLoadingDeleteConfig, setIsLoadingDeleteConfig] = useState(false);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const [
          userResponse,
          requestsResponse,
          deleteConfigResponse
        ] = await Promise.all([
          apiClient.get(`${API}/users/@me`),
          apiClient.get(`${API}/requests`),
          apiClient.get(`${API}/requests/4`)
        ]);

        setUser(userResponse.data);
        setRequestCount(requestsResponse.data.length);
        setDeleteRequestConfig(deleteConfigResponse.data);

        setLoading(false);
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          'Failed to find your profile...';

        console.error('Error fetching profile data:', error);

        toast.error(errorMessage);

        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const handleUpdateDisplayName = (newDisplayName) => {
    setUser((prevUser) => ({
      ...prevUser,
      displayName: newDisplayName
    }));
  };

  const openDeleteModal = async () => {
    setDeleteModalOpen(true);

    if (!deleteRequestConfig) {
      setIsLoadingDeleteConfig(true);

      try {
        const response = await apiClient.get(`${API}/requests/4`);

        setDeleteRequestConfig(response.data);
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
          'Failed to load account deletion form.'
        );

        setDeleteModalOpen(false);
      } finally {
        setIsLoadingDeleteConfig(false);
      }
    }
  };

  const handleDeleteFieldChange = (fieldName, value) => {
    setDeleteFields((prev) => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();

    if (!deleteRequestConfig?.fields) {
      return toast.error('Account deletion form is not available.');
    }

    for (const field of deleteRequestConfig.fields) {
      if (field.disabled) {
        continue;
      }

      const value = deleteFields[field.name];

      const empty =
        value === undefined ||
        value === null ||
        (typeof value === 'string' && value.trim().length === 0);

      if (field.required && empty) {
        toast.error(`${field.label} is required.`);
        return;
      }

      if (
        !empty &&
        field.minLength !== undefined &&
        String(value).length < field.minLength
      ) {
        toast.error(
          `${field.label} must be at least ${field.minLength} characters long.`
        );
        return;
      }

      if (
        !empty &&
        field.maxLength !== undefined &&
        String(value).length > field.maxLength
      ) {
        toast.error(
          `${field.label} must not exceed ${field.maxLength} characters.`
        );
        return;
      }
    }

    setIsSubmittingDelete(true);

    try {
      const response = await apiClient.post(`${API}/requests/4`, {
        type: 4,
        fields: deleteFields
      });

      toast.success(
        response.data.message ||
        'Account deletion request submitted.'
      );

      setDeleteModalOpen(false);
      setDeleteFields({});

      navigate(`/success?request=${response.data.requestId}`);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        'Failed to submit deletion request.'
      );
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-950">
        <FaSpinner className="animate-spin text-purple-500 w-12 h-12" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-950 text-red-400 text-xl font-semibold">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <Toaster position="top-right" />

      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse-slow"></div>

      <div className="relative z-10 max-w-4xl mx-auto backdrop-blur-md bg-gray-900/40 border border-purple-500/20 shadow-xl rounded-3xl p-8">

        <div className="flex items-center space-x-6 mb-8">
          {user?.avatarHash ? (
            <img
              src={user.avatarHash}
              className="w-24 h-24 rounded-full ring-4 ring-purple-600 shadow-md"
              alt={user.username}
            />
          ) : (
            <FaUserCircle className="w-24 h-24 rounded-full text-gray-500" />
          )}

          <div>
            <h1 className="text-3xl font-bold text-white">
              {user.displayName || user.username}
            </h1>

            <p className="text-sm text-gray-400">
              @{user.username}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div className="p-6 bg-gray-800/30 rounded-2xl border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-purple-300">
              Account Details
            </h2>

            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <MdMarkEmailRead className="inline mr-2" />
                Email: {user.email}
              </li>

              <li>
                <FaCheck className="inline mr-2" />
                Joined: {new Date(user.joinedAt).toLocaleDateString()}
              </li>

              <li>
                <MdAdminPanelSettings className="inline mr-2" />
                Admin: {user.admin ? 'Yes' : 'No'}
              </li>

              <li>
                <FiUserCheck className="inline mr-2" />
                Staff: {user.staff ? 'Yes' : 'No'}
              </li>

              <li>
                <FcLinux className="inline mr-2" />
                Auth: {user.authType}
              </li>

              <li>
                <FaDiscord className="inline mr-2" />
                ID: {user.id}
              </li>
            </ul>
          </div>

          <div className="p-6 bg-gray-800/30 rounded-2xl border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-indigo-300">
              Request Summary
            </h2>

            <div className="flex items-center text-lg text-white">
              <IoMdListBox className="text-blue-400 mr-2" />
              {requestCount} requests submitted
            </div>
          </div>

        </div>

        <div className="flex flex-wrap items-center mt-10 gap-4">

          {user.authType === 'discord' && (
            <button
              className="btn bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
              onClick={() =>
                window.location.href = `discord://users/${user.id}`
              }
            >
              <FaDiscord className="mr-2" />
              View Discord Profile
            </button>
          )}

          <button
            className="btn bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            onClick={() => setEditModalOpen(true)}
          >
            <IoMdSettings className="mr-2" />
            Edit Profile
          </button>

          <button
            className="btn bg-red-600/80 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center ml-auto transition-colors"
            onClick={openDeleteModal}
          >
            <FaTrash className="mr-2" />
            Account Deletion
          </button>

        </div>

        {user.authType === 'discord' && (
          <p className="text-xs text-gray-400 mt-3">
            Desktop users or those with the Discord app can use the
            "View Discord Profile" button.
          </p>
        )}

      </div>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setEditModalOpen(false)}
        currentDisplayName={user?.displayName || user?.username}
        onUpdate={handleUpdateDisplayName}
      />

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">

          <div className="bg-gray-900 border border-red-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">

            <h2 className="text-2xl font-bold text-red-400 mb-2">
              {deleteRequestConfig?.title || 'Request Account Deletion'}
            </h2>

            <p className="text-gray-400 text-sm mb-6">
              This will submit an account deletion request to staff.
            </p>

            {isLoadingDeleteConfig || !deleteRequestConfig ? (
              <div className="flex justify-center py-10">
                <FaSpinner className="animate-spin text-red-500 w-8 h-8" />
              </div>
            ) : (
              <form
                onSubmit={handleDeleteAccount}
                className="space-y-4"
              >
                {deleteRequestConfig.fields?.map((field) => {
                  if (field.disabled) {
                    return null;
                  }

                  const value = deleteFields[field.name] || '';

                  const isTextarea =
                    field.style === 2 ||
                    field.maxLength > 500;

                  return (
                    <div key={field.name}>

                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        {field.label}
                        {field.required && !field.label?.includes('*')
                          ? ' *'
                          : ''}
                      </label>

                      {field.description && (
                        <p className="text-xs text-gray-500 mb-2">
                          {field.description}
                        </p>
                      )}

                      {isTextarea ? (
                        <textarea
                          required={field.required}
                          minLength={field.minLength}
                          maxLength={field.maxLength}
                          disabled={field.disabled}
                          rows={field.style === 2 ? 3 : 5}
                          placeholder={field.placeholder || ''}
                          value={value}
                          onChange={(e) =>
                            handleDeleteFieldChange(
                              field.name,
                              e.target.value
                            )
                          }
                          className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-3 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors resize-none disabled:opacity-50"
                        />
                      ) : (
                        <input
                          type="text"
                          required={field.required}
                          minLength={field.minLength}
                          maxLength={field.maxLength}
                          disabled={field.disabled}
                          placeholder={field.placeholder || ''}
                          value={value}
                          onChange={(e) =>
                            handleDeleteFieldChange(
                              field.name,
                              e.target.value
                            )
                          }
                          className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg p-3 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors disabled:opacity-50"
                        />
                      )}

                    </div>
                  );
                })}

                <div className="flex justify-end space-x-3 mt-6">

                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
                    onClick={() => {
                      setDeleteModalOpen(false);
                      setDeleteFields({});
                    }}
                    disabled={isSubmittingDelete}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white flex items-center transition-colors disabled:opacity-50"
                    disabled={
                      isSubmittingDelete ||
                      isLoadingDeleteConfig ||
                      !deleteRequestConfig
                    }
                  >
                    {isSubmittingDelete ? (
                      <FaSpinner className="animate-spin mr-2" />
                    ) : (
                      <FaTrash className="mr-2" />
                    )}

                    {isSubmittingDelete
                      ? 'Submitting...'
                      : 'Submit Request'}
                  </button>

                </div>
              </form>
            )}

          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }

          50% {
            opacity: 0.6;
            transform: scale(1.1);
          }
        }

        .animate-pulse-slow {
          animation: pulse-slow 15s infinite;
        }
      `}</style>

    </div>
  );
};

export default Profile;
