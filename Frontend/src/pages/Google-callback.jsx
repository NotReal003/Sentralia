import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaSpinner } from "react-icons/fa";
import toast, { Toaster } from 'react-hot-toast';
import { FcGoogle, FcLock } from "react-icons/fc";

const Callback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(null);
  const API = process.env.REACT_APP_APIURL;

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      setLoading(true);

      axios.get(`${API}/auth/google/callback?code=${code}`, { withCredentials: true })
        .then(response => {
          if (response.status === 200) {
            const token = response.data.jwtToken;

            document.cookie = `token=${token}; domain=notreal003.org; path=/; max-age=${6.048e8 / 1000}; Secure; SameSite=Strict`;

            toast('Verification In Process...');
            
            axios.get(`${API}/auth/user?callback=${token}`, { withCredentials: true })
              .then(userResponse => {
                if (userResponse.status === 200) {
                  window.location.href = '/profile';
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
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-8 transition-all duration-700 relative overflow-hidden">
      <Toaster />

      <div className="flex items-center space-x-6 mb-6 animate-fadeIn drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
        <FcLock className="h-16 w-16" />
        <span className="text-3xl font-bold text-white">+</span>
        <FcGoogle className="h-16 w-16" />
      </div>

      {loading && (
        <div className="flex flex-col items-center text-center mt-6 animate-fadeIn">
          <FaSpinner className="animate-spin h-8 w-8 text-purple-300 drop-shadow-[0_0_10px_rgba(255,0,255,0.7)] mb-3" />
          <p className="font-serif text-lg text-gray-300 animate-pulse">
            Please wait while we securely connect your Google account...
          </p>
        </div>
      )}

      {error && (
        <div className="mt-6 px-4 py-3 bg-red-500/20 border border-red-500/50 text-red-300 font-serif rounded-lg text-center animate-fadeIn drop-shadow-[0_0_12px_rgba(255,0,0,0.4)] transition-all duration-500">
          <strong>{error}</strong>
        </div>
      )}
    </div>
  );
};

export default Callback;
