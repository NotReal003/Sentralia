import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaDiscord,
  FaUserSecret
} from 'react-icons/fa';
import {
  MdSupportAgent
} from 'react-icons/md';
import {
  IoMdMail
} from 'react-icons/io';
import {
  IoShieldCheckmark
} from 'react-icons/io5';
import apiClient, { API } from '../utils/api';

const Home = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    apiClient.get(`${API}/users/@me`)
      .then(res => {
        setIsAdmin(res.data.admin || false);
        setIsStaff(res.data.staff || false);
      })
      .catch(err => console.error('Failed to fetch user:', err))
      .finally(() => setLoading(false));
  }, [API]);

  const nav = (path) => navigate(path);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden text-white">
      
      <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0e0e0e] to-[#1a1a1a] -z-10">
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-gradient-to-br from-purple-600/20 to-transparent rounded-full blur-3xl animate-spin-slow" />
        <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-gradient-to-bl from-pink-600/20 to-transparent rounded-full blur-2xl animate-spin-slow-reverse" />
      </div>

      <div className="relative z-10 w-full max-w-md sm:max-w-lg bg-[#1e1e1e]/60 backdrop-blur-2xl border border-purple-500/20 p-6 sm:p-10 rounded-3xl shadow-2xl">
        <h1 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
          Request Panel
        </h1>

        <div className="space-y-4">
          
          <button onClick={() => nav('/one')} className="btn-style bg-gradient-to-r from-blue-500 to-blue-700">
            <IoShieldCheckmark className="mr-2" /> Your Requests
          </button>

          <h2 className="text-xl font-semibold mt-6 mb-2">New Request</h2>

          <button onClick={() => nav('/report')} className="btn-style bg-gradient-to-r from-yellow-400 to-yellow-600 text-black">
            <FaDiscord className="mr-2" /> Report Activity
          </button>

          <button onClick={() => nav('/apply')} className="btn-style bg-gradient-to-r from-purple-500 to-purple-700">
            <IoMdMail className="mr-2" /> Application
          </button>

          <button onClick={() => nav('/support')} className="btn-style bg-gradient-to-r from-teal-500 to-teal-700">
            <MdSupportAgent className="mr-2" /> Support Request
          </button>

          {loading && (
            <div className="space-y-3 mt-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-gray-700/40 animate-pulse" />
              ))}
            </div>
          )}

          {(isStaff || isAdmin) && (
            <button onClick={() => nav('/admin')} className="btn-style bg-gradient-to-r from-red-500 to-red-700 mt-6">
              Requests Dashboard / Staff Area
            </button>
          )}

          {isStaff && (
            <>
              <button onClick={() => nav('/admin/manage')} className="btn-style bg-gradient-to-r from-red-500 to-red-700">
                Admin Manage Dash
              </button>
              <button onClick={() => nav('/Analytics')} className="btn-style bg-gradient-to-r from-red-500 to-red-700">
                Analytics
              </button>
              <button onClick={() => nav('/admin/users')} className="btn-style bg-gradient-to-r from-red-500 to-red-700">
                Admin | Users
              </button>
              
            </>
          )}
        </div>
      </div>

      <style>{`
        .btn-style {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .btn-style:hover {
          transform: scale(1.03);
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.15);
        }
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes spin-slow-reverse {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        .animate-spin-slow { animation: spin-slow 35s linear infinite; }
        .animate-spin-slow-reverse { animation: spin-slow-reverse 45s linear infinite; }
      `}</style>
    </div>
  );
};

export default Home;
