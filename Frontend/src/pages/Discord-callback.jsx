import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient, { APIURL as API } from '../utils/api';
import { FaSpinner, FaDiscord } from "react-icons/fa";
import { FcLock } from "react-icons/fc";
import toast, { Toaster } from 'react-hot-toast';

const Callback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(null);
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code) {
      setLoading(true);
      apiClient.get(`${API}/auth/callback?code=${code}`)
        .then(response => {
          if (response.status === 200) {
            const token = response.data.jwtToken;
            const redirectPath = state || response.data.redirectPath || '/profile';

            document.cookie = `token=${token}; domain=notreal003.org; path=/; max-age=${6.048e8 / 1000}; httpOnly: true;`;

            toast('Verification In Process...');
            apiClient.get(`${API}/auth/user?callback=${token}`)
              .then(userResponse => {
                if (userResponse.status === 200) {
                  window.location.href = redirectPath;
                }
              })
              .catch(userError => {
                console.error('Error during user authentication:', userError);
                setLoading(false);
                setError(userError.response?.data?.message || 'An error occurred while verifying user.');
              });
          }
        })
        .catch(error => {
          console.error('Error during authentication:', error);
          setLoading(false);
          setError(error.response?.data?.message || 'An error occurred while signing in.');
        });
    } else {
      toast.error('No authorization code found in URL. Please SignIn again.');
      setError('No authorization code found in URL. Please SignIn again.');
      setLoading(false);
    }
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-8 shadow-lg">
  <Toaster />
  
  <div className="flex items-center space-x-6 mb-6">
    <FcLock className="h-14 w-14 text-gray-700" />
    <span className="text-3xl font-semibold">+</span>
    <FaDiscord className="h-16 w-16 text-blue-600" />
  </div>

  {loading && (
    <div className="flex flex-col items-center mt-6 space-y-4">
      <FaSpinner className="h-6 w-6 animate-spin text-gray-600" />
      <p className="font-serif text-center text-gray-700">
        Please wait while we are securely connecting your Discord account.
      </p>
    </div>
  )}

  {error && (
    <div className="mt-6 px-4 py-2 text-center font-serif text-red-500 border border-red-400 rounded-md bg-red-100">
      <strong>{error}</strong>
    </div>
  )}
</div>

  );
};

export default Callback;
