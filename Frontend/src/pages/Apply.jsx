import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoSend } from "react-icons/io5";
import { ImExit } from "react-icons/im";
import { FaSpinner } from "react-icons/fa";
import { FaPeopleGroup } from "react-icons/fa6";
import toast, { Toaster } from 'react-hot-toast';
import DOMPurify from "dompurify";

const Apply = () => {
  const [inGameName, setInGameName] = useState('');
  const [messageLink, setMessageLink] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [agree, setAgree] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const API = process.env.REACT_APP_API;

  const sanitize = (input) => DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const token = document.cookie.split('; ').find(r => r.startsWith('token='))?.split('=')[1];
    if (!token) {
      toast.error('You must be logged in.');
      setIsLoading(false);
      return;
    }
    const payload = {
      inGameName: sanitize(inGameName),
      messageLink: sanitize(messageLink),
      additionalInfo: sanitize(additionalInfo),
    };
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
      toast.error('Server timeout, try again later.');
      setIsLoading(false);
    }, 10000);

    try {
      const res = await fetch(`${API}/requests/application`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Submission failed.');
        setIsLoading(false);
        return;
      }
      toast.success(data.message || 'Submitted successfully.');
      setInGameName('');
      setMessageLink('');
      setAdditionalInfo('');
      navigate(`/success?request=${data.requestId}`);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error(err);
        toast.error('Error submitting, check your connection.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative text-gray-200 font-sans overflow-hidden">
      <Toaster position="top-center" />
      
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#151515] z-0 overflow-hidden">
        <div className="absolute left-0 top-0 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-purple-700/20 to-transparent blur-3xl animate-spin-slow" />
        <div className="absolute right-0 bottom-0 h-[300px] w-[300px] rounded-full bg-gradient-to-bl from-indigo-700/20 to-transparent blur-2xl animate-spin-slow-reverse" />
      </div>

      <div className="relative z-10 w-full max-w-lg bg-gray-900/30 backdrop-blur-xl p-8 sm:p-12 rounded-3xl border border-purple-500/20 shadow-2xl shadow-purple-900/20">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent mb-6 flex items-center justify-center">
          <FaPeopleGroup className="mr-3" /> Application
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label className="block text-sm font-semibold mb-1">Username (required)</label>
            <input
              type="text"
              className="w-full p-3 rounded-lg bg-[#111]/50 border border-gray-700 text-gray-200"
              placeholder="Enter your username"
              maxLength={16}
              required
              value={inGameName}
              onChange={e => setInGameName(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">{16 - inGameName.length} characters remaining</p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Reason to join (required)</label>
            <textarea
              className="w-full p-3 rounded-lg bg-[#111]/50 border border-gray-700 text-gray-200"
              rows="3"
              maxLength={1750}
              required
              placeholder="Why do you want to join?"
              value={messageLink}
              onChange={e => setMessageLink(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">{1750 - messageLink.length} characters remaining</p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Anything else? (optional)</label>
            <textarea
              className="w-full p-3 rounded-lg bg-[#111]/50 border border-gray-700 text-gray-200"
              rows="2"
              maxLength={1750}
              placeholder="Optional info"
              value={additionalInfo}
              onChange={e => setAdditionalInfo(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">{1750 - additionalInfo.length} characters remaining</p>
          </div>

          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={agree}
              onChange={e => setAgree(e.target.checked)}
              className="checkbox checkbox-accent"
              required
            />
            <span>I agree to the <a className="link link-primary" href="/terms" target="_blank" rel="noopener noreferrer">Terms</a> & <a className="link link-primary" href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.</span>
          </label>

          <div className="flex justify-between items-center pt-6 border-t border-gray-700">
            <button type="button" onClick={() => navigate(-1)} className="px-5 py-3 rounded-lg bg-gradient-to-r from-gray-800 to-gray-700 text-white hover:from-gray-700 hover:to-gray-600 transition-all">
              <ImExit className="inline mr-2" /> Back
            </button>
            <button
              type="submit"
              disabled={!agree || isLoading}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold flex items-center hover:scale-105 transition-all disabled:opacity-50"
            >
              {isLoading ? <FaSpinner className="animate-spin mr-2" /> : <IoSend className="mr-2" />}
              Submit
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-slow-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
        .animate-spin-slow-reverse { animation: spin-slow-reverse 25s linear infinite; }
      `}</style>
    </div>
  );
};

export default Apply;
