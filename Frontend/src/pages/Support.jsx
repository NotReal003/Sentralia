import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { API, getAuthHeaders } from '../utils/api';

const MailIcon = ({ className = 'h-6 w-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M1.5 2.25a2.25 2.25 0 0 1 2.25-2.25h16.5a2.25 2.25 0 0 1 2.25 2.25v19.5a2.25 2.25 0 0 1-2.25 2.25H3.75a2.25 2.25 0 0 1-2.25-2.25V2.25ZM3 3.75v.91l6.954 4.348a2.25 2.25 0 0 0 2.092 0L19.5 4.66v-.91A.75.75 0 0 0 18.75 3H3.75a.75.75 0 0 0-.75.75Zm0 2.868v12.882a.75.75 0 0 0 .75.75h16.5a.75.75 0 0 0 .75-.75V6.618l-7.446 4.654a3.75 3.75 0 0 1-3.415 0L3 6.618Z" />
    </svg>
);

const SendIcon = ({ className = 'h-5 w-5' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
    </svg>
);

const BackIcon = ({ className = 'h-5 w-5' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path fillRule="evenodd" d="M11.03 3.97a.75.75 0 0 1 0 1.06l-6.22 6.22H21a.75.75 0 0 1 0 1.5H4.81l6.22 6.22a.75.75 0 1 1-1.06 1.06l-7.5-7.5a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
    </svg>
);

const SpinnerIcon = ({ className = 'h-5 w-5' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${className} animate-spin`}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-4.991-2.691V5.006h-4.992v.001M7.965 4.356l-3.18 3.182m0 0h4.992m-4.992 0l3.18 3.182" />
    </svg>
);

const Support = ({ setCurrentPage }) => {
  const [supportRequest, setSupportRequest] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [agree, setAgree] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  

  const handleSubmit = useCallback(async (e) => {
  e.preventDefault();
  setIsSubmitting(true);

  const token = 'fake-auth-token';

  if (!token) {
    toast.error('You must be logged in to submit a support request.');
    setIsSubmitting(false);
    return;
  }

  if (!agree) {
    toast.error('You must agree to the Terms of Service and Privacy Policy.');
    setIsSubmitting(false);
    return;
  }

  if (!supportRequest.trim()) {
    toast.error('Please provide a detailed description of your support request.');
    setIsSubmitting(false);
    return;
  }

  const payload = {
    messageLink: supportRequest.trim(),
    additionalInfo: additionalInfo.trim(),
  };

  try {
    const response = await fetch(`${API}/requests/support`, {
      method: 'POST',
      credentials: 'include',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.status === 403) {
      toast.error(data.message || 'Your session has expired or you lack permission. Please log in again.');
    } else if (response.ok) {
      toast.success('Your support request has been submitted successfully!');
      navigate(`/success?request=${data.requestId}`);
    } else {
      toast.error(data.message || 'An issue occurred while submitting your request.');
    }
  } catch (error) {
    toast.error(error?.message || 'A network error occurred. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
}, [supportRequest, additionalInfo, agree, navigate]);

  const supportRequestRemaining = 1750 - supportRequest.length;
  const additionalInfoRemaining = 1750 - additionalInfo.length;

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gray-900 font-sans p-4">
      
      <div className="absolute inset-0 z-0">
          <div className="absolute bottom-0 left-[-20%] right-0 top-[-10%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(255,0,150,0.45),rgba(255,255,255,0))]"></div>
          <div className="absolute bottom-[-80px] right-[-30%] h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle_farthest-side,rgba(100,100,255,0.35),rgba(255,255,255,0))]"></div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="relative z-10 flex w-full max-w-2xl flex-col space-y-6 rounded-2xl border border-gray-700/50 bg-gray-800/50 p-6 sm:p-8 shadow-2xl backdrop-blur-lg"
        noValidate
      >
        <header className="text-center">
          <div className="inline-flex items-center justify-center gap-3">
            <MailIcon className="h-8 w-8 text-indigo-400"/>
            <h1 className="text-3xl font-bold text-white">Support Center</h1>
          </div>
          <p className="mt-3 text-gray-300">
            Need help? Fill out the form below and our team will get back to you.
          </p>
        </header>

        <div role="alert" className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-4 text-sm text-sky-200">
          For applications, please specify "Application" in your request. For all other inquiries, provide as much detail as possible to help us resolve your issue quickly.
        </div>

        <div className="space-y-6">
          <div className="form-control">
            <label htmlFor="supportRequest" className="block text-sm font-medium text-gray-200 mb-2">
              Your Support Request <span className="text-red-400">*</span>
            </label>
            <textarea
              id="supportRequest"
              name="supportRequest"
              className="block w-full rounded-lg border border-gray-600 bg-gray-900/50 px-3 py-2 text-white placeholder-gray-500 transition-colors duration-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows="5"
              placeholder="Describe your issue in detail..."
              value={supportRequest}
              onChange={(e) => setSupportRequest(e.target.value)}
              required
              maxLength={1750}
            />
            <p className={`mt-2 text-xs ${supportRequestRemaining < 0 ? 'text-red-400' : 'text-gray-400'}`}>
              {supportRequestRemaining} characters remaining
            </p>
          </div>

          <div className="form-control">
            <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-200 mb-2">
              Additional Information (Optional)
            </label>
            <textarea
              id="additionalInfo"
              name="additionalInfo"
              className="block w-full rounded-lg border border-gray-600 bg-gray-900/50 px-3 py-2 text-white placeholder-gray-500 transition-colors duration-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows="3"
              placeholder="Provide any links, error codes, or extra context."
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              maxLength={1750}
            />
             <p className={`mt-2 text-xs ${additionalInfoRemaining < 0 ? 'text-red-400' : 'text-gray-400'}`}>
              {additionalInfoRemaining} characters remaining
            </p>
          </div>
        </div>

        <div className="form-control">
            <label className="flex items-start sm:items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                id="agree"
                name="agree"
                className="mt-1 sm:mt-0 h-5 w-5 rounded border-gray-600 bg-gray-900/50 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-gray-800"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                required
              />
              <span className="text-sm text-gray-300">
                I agree to the{' '}
                <a href="https://support.notreal003.org/terms" className="font-medium text-indigo-400 hover:underline">Terms of Service</a> and{' '}
                <a href="https://support.notreal003.org/privacy" className="font-medium text-indigo-400 hover:underline">Privacy Policy</a>.
              </span>
            </label>
        </div>

        <footer className="mt-4 flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-4 border-t border-gray-700/50 pt-6">
           <button
              type="button"
              onClick={() => navigate(-1)}
              className="group flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-gray-600 bg-transparent px-4 text-sm font-semibold text-gray-300 transition-all duration-300 hover:border-gray-500 hover:bg-gray-700/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
            >
              <BackIcon />
              <span>Back</span>
            </button>
            <button
                type="submit"
                className="group flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 text-sm font-semibold text-white transition-all duration-300 hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 disabled:cursor-not-allowed disabled:bg-indigo-600/50"
                disabled={isSubmitting || !agree}
            >
                {isSubmitting ? <SpinnerIcon /> : <SendIcon />}
                <span>{isSubmitting ? 'Submit Request' : 'Submit Request'}</span>
            </button>
        </footer>
      </form>
        <Toaster />
    </main>
  );
};

export default function App() {
  const [currentPage, setCurrentPage] = useState({ page: 'support' });

  switch (currentPage.page) {
    case 'support':
      return <Support setCurrentPage={setCurrentPage} />;
    case 'success':
      return (
        <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-white font-sans">
          <div className="text-center p-8 max-w-lg mx-auto rounded-2xl border border-gray-700/50 bg-gray-800/50 shadow-2xl backdrop-blur-lg">
            <h1 className="text-3xl font-bold text-green-400">Request Submitted!</h1>
            <p className="mt-4 text-gray-300">
              Thank you for contacting us. Your support request has been received.
            </p>
            <p className="mt-2 text-lg text-gray-200">
                Your Request ID is: <strong className="text-white font-mono bg-gray-700/50 px-2 py-1 rounded-md">{currentPage.requestId}</strong>
            </p>
            <button
              onClick={() => setCurrentPage({ page: 'support' })}
              className="mt-8 rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-500 transition-all"
            >
              Submit Another Request
            </button>
          </div>
        </div>
      );
    default:
      return (
        <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-white">
            <div className="text-center">
                <h1 className="text-4xl">Home Page</h1>
                <p className="mt-4">This would be the page you return to.</p>
                <button
                onClick={() => setCurrentPage({ page: 'support' })}
                className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500"
                >
                Go to Support
                </button>
            </div>
        </div>
      );
  }
}
