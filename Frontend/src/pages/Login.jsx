import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { APIURL } from '../utils/api';

const DiscordIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="h-5 w-5"
    aria-hidden="true"
  >
    <path d="M20.317 4.36981C18.777 3.50481 17.067 2.85981 15.217 2.45981C15.117 2.71981 14.967 3.09981 14.867 3.37981C13.037 3.07981 11.207 3.07981 9.377 3.37981C9.277 3.09981 9.127 2.71981 9.027 2.45981C7.177 2.85981 5.467 3.50481 3.927 4.36981C1.657 8.07981 0.877 11.6098 1.157 15.0698C3.257 16.5998 5.147 17.5898 7.007 18.2898C7.457 17.5898 7.847 16.8698 8.167 16.1198C7.507 15.8198 6.887 15.4898 6.307 15.1198C6.447 15.0198 6.587 14.9098 6.717 14.7998C10.237 16.2598 14.047 16.2598 17.557 14.7998C17.687 14.9098 17.827 15.0198 17.967 15.1198C17.387 15.4898 16.767 15.8198 16.107 16.1198C16.427 16.8698 16.817 17.5898 17.267 18.2898C19.127 17.5898 20.997 16.6098 23.097 15.0698C23.407 10.9898 22.117 7.31981 20.317 4.36981ZM8.677 13.2298C7.707 13.2298 6.907 12.4198 6.907 11.4598C6.907 10.4998 7.707 9.68981 8.677 9.68981C9.647 9.68981 10.457 10.4998 10.447 11.4598C10.447 12.4198 9.647 13.2298 8.677 13.2298ZM15.577 13.2298C14.607 13.2298 13.807 12.4198 13.807 11.4598C13.807 10.4998 14.607 9.68981 15.577 9.68981C16.547 9.68981 17.357 10.4998 17.347 11.4598C17.347 12.4198 16.547 13.2298 15.577 13.2298Z" />
  </svg>
);

const GoogleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="h-5 w-5"
    aria-hidden="true"
  >
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.16c1.56 0 2.95.54 4.04 1.58l3.15-3.15C17.45 1.8 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const MailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
        <rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
    </svg>
);

const GithubIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path>
    </svg>
);

const Login = ({ setCurrentPage }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const API_BASE_URL = APIURL;

  const handleDiscordLogin = () => {
   const redirectPath = location.state?.from || '/profile';
    window.location.href = `${API_BASE_URL}/auth/signin?redirect=${encodeURIComponent(redirectPath)}`;
  };

  const handleGoogleLogin = () => {
  const redirectPath = location.state?.from || '/profile';
  window.location.href = `${API_BASE_URL}/auth/google?redirect=${encodeURIComponent(redirectPath)}`;
  console.log("Redirecting to Google OAuth...");
};

  return (
    <main className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-gray-900 font-sans">
      
      <div className="absolute inset-0 z-0">
          <div className="absolute bottom-0 left-[-20%] right-0 top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(255,0,150,0.45),rgba(255,255,255,0))]"></div>
          <div className="absolute bottom-[-80px] right-[-30%] h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(100,100,255,0.35),rgba(255,255,255,0))]"></div>
      </div>

      <section 
        className="relative z-10 flex w-full max-w-md flex-col space-y-6 rounded-2xl border border-gray-700/50 bg-gray-800/50 p-8 shadow-2xl backdrop-blur-lg"
        aria-labelledby="login-heading"
      >
        <div className="text-center">
          <h1 id="login-heading" className="text-3xl font-bold text-white">
            Welcome Back
          </h1>
          <p className="mt-2 text-gray-300">Choose a login method to continue.</p>
        </div>

        <div className="flex flex-col space-y-4">
          <button
            onClick={handleDiscordLogin}
            className="group flex h-12 items-center justify-center gap-3 rounded-lg border border-gray-600 bg-gray-700/50 px-4 text-base font-semibold text-white transition-all duration-300 hover:border-indigo-500 hover:bg-indigo-600/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
          >
            <DiscordIcon />
            <span>Login with Discord</span>
          </button>

          <button
            onClick={handleGoogleLogin}
            className="group flex h-12 items-center justify-center gap-3 rounded-lg border border-gray-600 bg-gray-700/50 px-4 text-base font-semibold text-white transition-all duration-300 hover:border-blue-500 hover:bg-blue-600/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
          >
            <GoogleIcon />
            <span>Login with Google</span>
          </button>
          
          <button
            disabled
            className="group flex h-12 cursor-not-allowed items-center justify-center gap-3 rounded-lg border border-gray-700 bg-gray-800/60 px-4 text-base font-semibold text-gray-500"
            aria-label="Email login (currently disabled)"
            onClick={() => toast.error('Email SignIn is not accepted...')}
          >
            <MailIcon />
            <span>Login with Email</span>
          </button>

          <button
            disabled
            className="group flex h-12 cursor-not-allowed items-center justify-center gap-3 rounded-lg border border-gray-700 bg-gray-800/60 px-4 text-base font-semibold text-gray-500"
            aria-label="GitHub login (currently disabled)"
            onClick={() => toast.error('Github SignIn is not accepted...')}
          >
            <GithubIcon />
            <span>Login with GitHub</span>
          </button>
        </div>
        
        <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="bg-gray-800/80 px-2 text-gray-400">or</span>
            </div>
        </div>

        <p className="text-center text-sm text-gray-400">
          Don’t have an account?{' '}
          <button
            onClick={() => navigate('/email-signin')}
            className="font-medium text-indigo-400 hover:text-indigo-300 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
          >
            Sign up
          </button>
        </p>
      </section>
      <Toaster />
    </main>
  );
};

export default function App() {
  const [currentPage, setCurrentPage] = useState('login');

  switch (currentPage) {
    case 'login':
      return <Login setCurrentPage={setCurrentPage} />;
    case 'signup':
      return (
        <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-white">
          <div className="text-center">
            <h1 className="text-4xl">Sign Up Page</h1>
            <p className="mt-4">This is where the sign-up form would be.</p>
            <button
              onClick={() => setCurrentPage('login')}
              className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500"
            >
              Back to Login
            </button>
          </div>
        </div>
      );
    default:
      return <Login setCurrentPage={setCurrentPage} />;
  }
}
