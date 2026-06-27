import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaLock, FaSpinner } from "react-icons/fa";
import { IoLogoGithub } from "react-icons/io";

const Callback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(null);
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      setLoading(true);
      axios.get(`https://api.notreal003.org/auth/github/callback?code=${code}`, {
        withCredentials: false,
      })
        .then(response => {
          if (response.status === 200) {
            const token = response.data.jwtToken;
            localStorage.setItem('jwtToken', token);
            window.location.href = `https://api.notreal003.org/auth/user?callback=${token}`;
          }
        })
        .catch(error => {
          console.error('Error during authentication:', error);
          setLoading(false);
          setError(error.response.data.message || 'An error occurred while signing in.');
        });
    } else {
      setError('No authorization code found in URL. Please SignIn again.');
      setLoading(false);
    }
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen shadow-lg">
      <div className="flex items-center space-x-4">
        <IoLogoGithub className="h-14 w-14 m-4" />
        <span className="text-2xl m-4 mr-4">+</span>
        <FaLock className="h-14 w-14 m-4 ml-4" />
      </div>
      {loading && (
        <div className="flex items-center mt-8 m-4">
          <div className="flex items-center justify-center">
            <FaSpinner className="animate-spin inline-block align-middle m-4" />
          </div>
          <p className="font-serif">Please wait while we are securely connecting your Github account.</p>
        </div>
      )}
      {error && (
        <div className="mt-8 m-4 font-serif text-red-500 justify-center">
          <strong>{error}</strong>
        </div>
      )}
    </div>
  );
};

export default Callback;
