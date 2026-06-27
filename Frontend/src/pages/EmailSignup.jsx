import React, { useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { FaSpinner } from "react-icons/fa";
import { IoLogIn } from "react-icons/io5";

const EmailSignup = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const API = process.env.REACT_APP_API;

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!isValidEmail(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!agreedToTerms) {
      toast.error('You must agree to the terms and privacy policy to sign up.');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API}/auth/email-signup`, { email, username });
      toast.success('Verification code sent! Please check your email.');
      setStep(2);
      setLoading(false);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'There was a problem during signup. Please try again.';
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();

    if (!verificationCode) {
      toast.error('Please enter the verification code sent to your email');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${API}/auth/verify-email`,
        { email, code: verificationCode },
        { withCredentials: true }
      );

      const jwtToken = response.data.jwtToken;
      document.cookie = `token=${jwtToken}; domain=notreal003.org; path=/; max-age=${6.048e8 / 1000}; httpOnly: true;`;
      toast.success('Verifying account...');
      axios.get(`${API}/auth/user?callback=${jwtToken}`, {
        headers: {
          'Authorization': `Account ${jwtToken}`,
        },
      })
        .then(userResponse => {
          if (userResponse.status === 200) {
            window.location.href = 'https://request.notreal003.xyz/profile';
          }
        });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Invalid or expired verification code. Please try again.';
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 max-w-md md:max-w-lg mx-auto shadow-lg rounded-lg">
      <Toaster />
      <div className="bg-gradient-to-br from-black-400 via-black-500 to-black-600 p-8 bg-opacity-10 rounded-lg shadow-lg max-w-sm ml-2 mr-2 m-2 w-full">
        <h1 className="text-xl font-bold mb-6 text-center text-white">{step === 1 ? 'Sign Up with Email' : 'Verify Your Email'}</h1>

        {step === 1 && (
          <form onSubmit={handleSignup}>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Username"
                className="input input-bordered w-full"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input input-bordered w-full"
                required
              />
            </div>

            <div className="form-control mb-4">
              <label className="cursor-pointer label">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                />
                <span className="label-text ml-2 text-white">
                  I agree to the NotReal003's{' '}
                  <a href="https://support.notreal003.xyz/terms" className="hover:underline">Terms of Service</a> and{' '}
                  <a href="https://support.notreal003.xyz/privacy" className="hover:underline">Privacy Policy</a>
                </span>
              </label>
            </div>

            <button
              disabled={loading}
              type="submit" className="btn no-animation btn-primary w-full no-animation">
              {loading ? <span> <FaSpinner className="animate-spin inline-block align-middle mr-2" />Sign Up</span> : <span><IoLogIn className="inline-block align-middle mr-2" />Sign Up</span>}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyCode}>
            <div className="mb-4">
              <input
                type="text"
                placeholder="XXXXXX"
                className="input input-bordered w-full"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
              />
            </div>
            <button
              disabled={loading}
              type="submit" className="btn no-animation btn-primary w-full no-animation">
              {loading ? <span> <FaSpinner className="animate-spin inline-block align-middle mr-2" />Verify</span> : <span><IoLogIn className="inline-block align-middle mr-2" />Verify</span>}
            </button>
            <div className="flex items-center justify-center mt-2">
              <p className="mt-2 text-xs text-gray-400">Check your E-mail inbox, if its not there then check spam box.</p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EmailSignup;
