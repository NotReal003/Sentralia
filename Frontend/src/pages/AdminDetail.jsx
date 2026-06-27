import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import {
  MdDelete, MdUpdate, MdContentCopy, MdArrowBack,
  MdInfoOutline, MdQuestionAnswer, MdPerson, MdLink
} from 'react-icons/md';
import { FaExclamationTriangle } from 'react-icons/fa';
import { ImSpinner6 } from 'react-icons/im';
import AdminOnly from '../components/AdminOnly';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black bg-opacity-70 z-50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700/50">
        <h2 className="text-2xl font-bold mb-4 text-white">{title}</h2>
        <div className="text-gray-400 mb-6">{children}</div>
        <div className="flex justify-end space-x-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-700/50 rounded hover:bg-gray-600/70">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 rounded hover:bg-red-700">Confirm</button>
        </div>
      </div>
    </div>
  );
};

const RequestInfoField = ({ icon, label, value }) => (
  <div>
    <label className="flex items-center text-sm font-semibold text-gray-400 mb-1">{icon} {label}</label>
    <div className="p-3 bg-[#2a2a2a]/50 rounded-lg border border-gray-700/50 text-gray-300">{value || <span className="text-gray-500">Not provided</span>}</div>
  </div>
);

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-gray-400">
    <ImSpinner6 className="animate-spin text-5xl mb-4" />
    <p>Loading Request Details...</p>
  </div>
);

const AdminDetail = () => {
  const location = useLocation();
  const requestId = new URLSearchParams(location.search).get('id');
  const [request, setRequest] = useState(null);
  const [status, setStatus] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [aiRecommendation, setAiRecommendation] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatOutput, setChatOutput] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [adminOnly, setAdminOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const API = process.env.REACT_APP_MAIN_API;

  const sanitizeInput = (input) => input.replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] || c));

  const fetchRequest = useCallback(async () => {
    if (!requestId) {
      toast.error("No request ID provided.");
      navigate(-1);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/requests/${requestId}`, { withCredentials: true });
      setRequest(res.data);
      setStatus(res.data.status);
      setReviewMessage(res.data.reviewMessage || '');
    } catch (error) {
      if (error.response?.status === 403) setAdminOnly(true);
      else {
        toast.error('Failed to load request details.');
        navigate(-1);
      }
    } finally {
      setLoading(false);
    }
  }, [requestId, API, navigate]);

  useEffect(() => { fetchRequest(); }, [fetchRequest]);
  useEffect(() => { if (request) generateAISummary(); }, [request]);

  const generateAISummary = async () => {
    try {
      const res = await axios.post(`${API}/admin/analyze`, { request }, { withCredentials: true });
      setAiSummary(res.data.summary);
      setAiRecommendation(res.data.recommendation);
    } catch {
      toast.error("AI summary failed");
    }
  };

  const generateAIReview = async () => {
    setAiGenerating(true);
    try {
      const res = await axios.post(`${API}/admin/generate`, { request }, { withCredentials: true });
      setReviewMessage(res.data.rephrased || res.data.suggestion || '');
      toast.success("AI review message generated.");
    } catch {
      toast.error("Failed to generate AI message.");
    } finally {
      setAiGenerating(false);
    }
  };

  const modifyTone = async (style) => {
    try {
      const res = await axios.post(`${API}/admin/rephrase`, { message: reviewMessage, style }, { withCredentials: true });
      setReviewMessage(res.data.rephrased);
      toast.success('Message updated.');
    } catch {
      toast.error('Tone change failed.');
    }
  };

  const handleAIChat = async () => {
    if (!chatInput.trim()) return;
    setChatOutput("Thinking...");
    try {
      const res = await axios.post(`${API}/admin/chat`, { prompt: chatInput, request }, { withCredentials: true });
      setChatOutput(res.data.response || 'No response.');
    } catch {
      setChatOutput("AI failed to respond.");
    }
  };

  const handleUpdateAndSendEmail = async () => {
    const sanitizedReviewMessage = reviewMessage;
    const updatePromise = axios.patch(`${API}/admin/${requestId}`, 
        { status, reviewMessage: sanitizedReviewMessage }, 
        { withCredentials: true }
    );

    toast.promise(updatePromise, {
        loading: 'Updating request...',
        success: (res) => {
            sendEmail(res.data.username);
            return res.data.message || 'Request updated successfully!';
        },
        error: (err) => err.response?.data?.message || 'Error updating request.',
    });
  };

  const sendEmail = async (username) => {
      const emailPromise = axios.post(`${API}/admin/send/email`, {
          requestId,
          reviewMessage,
          status,
          username: username || request.username,
      }, { withCredentials: true });

      toast.promise(emailPromise, {
          loading: 'Sending notification email...',
          success: 'Email notification sent!',
          error: 'Failed to send email.',
      });
  }

  const rawUser = localStorage.getItem("user");
  const forReq = rawUser ? JSON.parse(rawUser) : null;
  const staffName = forReq?.displayName || "Staff";

  const handleCopy = () => {
    navigator.clipboard.writeText(`Your Application has been approved and we have invited ${request?.inGameName || request?.username} to the Sentralia Guild :)\n\nReviewer,\n${staffName}, Leader\nSentralia Guild.`).then(() => toast.success("Copied!"));
  };

  const handleBlockCopy = () => {
    navigator.clipboard.writeText(`We strongly advise against submitting fraudulent applications, as doing so may result in the suspension of your account from our services due to misuse of our request system.\n\nNotReal003, Leader,\nSentralia Guild.`).then(() => toast.success("Copied!"));
  };

  const handleDelete = async () => {
    setShowDeleteModal(false);
    toast.promise(axios.delete(`${API}/admin/${requestId}`, { withCredentials: true }), {
      loading: 'Deleting...',
      success: () => {
        navigate('/admin');
        return 'Deleted.';
      },
      error: 'Delete failed.'
    });
  };

  if (loading) return <LoadingSpinner />;
  if (adminOnly) return <AdminOnly />;
  if (!request) return <div className="text-red-500 flex justify-center items-center min-h-[60vh]"><FaExclamationTriangle className="mr-2" /> Could not load.</div>;

  const getRequestFields = () => {
    switch (request.type) {
      case 'report': return <RequestInfoField icon={<MdLink />} label="Evidence/Message Link" value={request.messageLink} />;
      case 'support': return <RequestInfoField icon={<MdQuestionAnswer />} label="Support Query" value={request.messageLink} />;
      case 'guild-application': return <>
        <RequestInfoField icon={<MdPerson />} label="In-Game Name" value={request.inGameName} />
        <RequestInfoField icon={<MdQuestionAnswer />} label="Reason for Joining" value={request.messageLink} />
      </>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen text-gray-200 p-4 sm:p-6 lg:p-8">
      <Toaster />
      <ConfirmationModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDelete} title="Confirm Deletion">
        Are you sure you want to delete this request?
      </ConfirmationModal>

      <div className="container mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-white">Request Details</h1>
          <p className="text-gray-400">ID: <span className="text-purple-400">{request._id}</span></p>
        </div>

        <div className="bg-[#1a1a1a]/50 p-6 rounded-xl border border-gray-800 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white">🧠 AI Summary</h2>
            <p className="text-purple-300">{aiSummary}</p>
            <p className="text-blue-400">Suggestion: <b>{aiRecommendation}</b></p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full p-3 rounded bg-[#2a2a2a] border border-gray-700 text-white">
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="DENIED">Denied</option>
              <option value="ESCALATED">Escalated</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-400">Review Message</label>
            <textarea value={reviewMessage} onChange={e => setReviewMessage(e.target.value)} className="w-full p-3 bg-[#2a2a2a] text-white rounded border border-gray-700 min-h-[120px]" />
            <div className="flex gap-2 mt-2">
              <button onClick={() => modifyTone('formal')} className="bg-gray-700 text-white text-sm px-3 py-1 rounded">Formal</button>
              <button onClick={() => modifyTone('friendly')} className="bg-gray-700 text-white text-sm px-3 py-1 rounded">Friendly</button>
              <button onClick={() => modifyTone('short')} className="bg-gray-700 text-white text-sm px-3 py-1 rounded">Short</button>
              <button onClick={generateAIReview} disabled={aiGenerating} className="bg-indigo-600 text-white text-sm px-3 py-1 rounded">
                {aiGenerating ? "Generating..." : "Generate with AI"}
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <button onClick={handleUpdateAndSendEmail} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded">Update & Send Email</button>
            <button onClick={handleCopy} className="bg-gray-700 text-white font-bold py-2 rounded">Copy Accepted Msg</button>
            <button onClick={handleBlockCopy} className="bg-gray-700 text-white font-bold py-2 rounded">Copy Warning Msg</button>
            <button onClick={() => setShowDeleteModal(true)} className="text-red-500 font-semibold">Delete Request</button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#1a1a1a]/50 p-6 rounded-xl border border-gray-800 space-y-4">
            <h2 className="text-xl text-white font-bold">Request Info</h2>
            <RequestInfoField icon={<MdPerson />} label="Submitted By" value={`${request.username} (${request.id})`} />
            {getRequestFields()}
            <RequestInfoField icon={<MdInfoOutline />} label="Additional Info" value={request.additionalInfo} />
          </div>

          <div className="bg-[#1a1a1a]/50 p-6 rounded-xl border border-gray-800 space-y-4">
            <h2 className="text-xl text-white font-bold">AI Assistant</h2>
            <textarea value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask AI..." className="w-full p-2 rounded bg-[#2a2a2a] text-white resize-none h-24" />
            <button onClick={handleAIChat} className="bg-blue-600 text-white font-bold py-2 px-4 rounded w-full">Ask</button>
            <div className="mt-2 text-sm text-gray-300 whitespace-pre-line">{chatOutput}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDetail;
