import React, { useState } from 'react';
import axios from 'axios';
import { FaSpinner } from "react-icons/fa";
import toast, { Toaster } from 'react-hot-toast';
import { IoLogIn } from "react-icons/io5";

const EmailSignin = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const API = process.env.REACT_APP_API;

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignin = async (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API}/auth/email-signin`, { email });
      toast.success(response.data.message || 'Verification code sent to your email.');
      setStep(2);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'There was a problem during signup. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.post(
        `${API}/auth/verify-signin-email-code`,
        { email, code },
        { withCredentials: true }
      );

      const jwtToken = response.data.jwtToken;
      document.cookie = `token=${jwtToken}; domain=notreal003.org; path=/; max-age=${6.048e8 / 1000}; httpOnly: true;`;
      toast('Sign-in in process...');
      axios.get(`${API}/auth/user?callback=${jwtToken}`, {
        headers: {
          'Authorization': `Account ${jwtToken}`,
        },
      })
        .then(userResponse => {
          if (userResponse.status === 200) {
            window.location.href = 'https://request.notreal003.org/profile';
          }
        });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'There was a problem during signup. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 max-w-md md:max-w-lg mx-auto shadow-lg rounded-lg">
      <Toaster />
      <div className="bg-gradient-to-br from-black-400 via-black-500 to-black-600 p-8 bg-opacity-10 rounded-lg shadow-lg max-w-sm ml-2 mr-2 m-2 w-full">
        {step === 1 ? (
          <>
            <h1 className="text-xl font-bold mb-6 text-center text-white">Sign In with Email</h1>
            <form onSubmit={handleSignin}>
              <div className="mb-4">
                <input
                  type="email"
                  placeholder="example@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input input-bordered w-full"
                  required
                  disabled={loading}
                />
              </div>
              <button type="submit" className="btn no-animation btn-primary w-full" disabled={loading}>
                {loading ? <span><FaSpinner className="animate-spin inline-block mr-2" />Send Verification Code </span> : <span><IoLogIn className="inline-block align-middle mr-2" />Send Verification Code</span>}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold mb-6 text-center text-white">Enter Verification Code</h1>
            <form onSubmit={handleVerifyCode}>
              <div className="mb-4">
                <input
                  type="number"
                  placeholder="XXXXXX"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="input input-bordered w-full"
                  required
                  disabled={loading}
                />
              </div>
              <button type="submit" className="btn no-animation btn-primary w-full" disabled={loading}>
                {loading ? <span><FaSpinner className="animate-spin inline-block mr-2" /> Verify Code </span> : <span><IoLogIn className="inline-block align-middle mr-2" />Verify Code</span>}
              </button>
              <div className="flex items-center justify-center mt-2">
                <p className="mt-2 text-xs text-gray-400">Check your E-mail inbox, if its not there then check spam box.</p>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default EmailSignin;
