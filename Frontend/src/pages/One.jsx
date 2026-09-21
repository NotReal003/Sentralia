import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// IMPORTANT: Re-enable your actual imports in your real project. 
// I am leaving them here as you provided them, but noting that local relative imports might not work in isolated sandboxes.
import apiClient, { API } from '../utils/api'; 
import { FaDiscord, FaArrowRight, FaSpinner } from 'react-icons/fa';
import { MdSupportAgent, MdDelete, MdCancel, MdInfoOutline, MdLink, MdTextFields } from 'react-icons/md';
import { FaPeopleGroup } from 'react-icons/fa6';
import { IoMdArrowRoundBack } from 'react-icons/io';
import {
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaBan,
  FaShieldAlt
} from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';

const ACCOUNT_DELETION_TYPE = 4;

// Centralized status styling for a consistent, professional look
const STATUS_CONFIG = {
  PENDING: {
    label: 'Pending Review',
    icon: FaHourglassHalf,
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    borderClass: 'border-l-amber-500',
  },
  APPROVED: {
    label: 'Approved',
    icon: FaCheckCircle,
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    borderClass: 'border-l-emerald-500',
  },
  RESOLVED: {
    label: 'Resolved',
    icon: FaCheckCircle,
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    borderClass: 'border-l-blue-500',
  },
  DENIED: {
    label: 'Denied',
    icon: FaTimesCircle,
    badgeClass: 'bg-red-500/10 text-red-400 border-red-500/20',
    borderClass: 'border-l-red-500',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: FaBan,
    badgeClass: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    borderClass: 'border-l-zinc-500',
  },
  ESCALATED: {
    label: 'Escalated',
    icon: FaExclamationTriangle,
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    borderClass: 'border-l-purple-500',
  },
  RESUBMIT_REQUIRED: {
    label: 'Action Required',
    icon: FaExclamationTriangle,
    badgeClass: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    borderClass: 'border-l-orange-500',
  },
  DEFAULT: {
    label: 'Unknown',
    icon: FaExclamationTriangle,
    badgeClass: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    borderClass: 'border-l-zinc-500',
  }
};

const RequestStatusBadge = ({ status, size = 'sm' }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DEFAULT;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1.5 text-sm';
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${config.badgeClass} ${sizeClasses}`}
      title={`Status: ${config.label}`}
    >
      {size !== 'sm' && <Icon className="text-inherit" />}
      {config.label}
    </span>
  );
};

const RequestIcon = ({ type, className = "" }) => {
  const iconProps = { className: `text-2xl text-zinc-400 ${className}` };
  switch (Number(type)) {
    case 1: return <MdSupportAgent {...iconProps} title="Support Request" />;
    case 2: return <FaDiscord {...iconProps} title="Discord Report" />;
    case 3: return <FaPeopleGroup {...iconProps} title="Application" />;
    case 4: return <MdDelete {...iconProps} title="Account Deletion" />;
    default: return <MdInfoOutline {...iconProps} />;
  }
};

const getRequestTitle = (request) => {
  if (request.typeName) return request.typeName;
  switch (Number(request.requestType)) {
    case 1: return 'Support Request';
    case 2: return 'Discord Report';
    case 3: return 'Application';
    case 4: return 'Account Deletion';
    default: return 'General Request';
  }
};

const LoadingSpinner = ({ text = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-zinc-400">
    <div className="relative w-12 h-12 mb-4">
      <div className="absolute inset-0 border-2 border-zinc-800 rounded-full"></div>
      <div className="absolute inset-0 border-2 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
    </div>
    <p className="text-sm font-medium tracking-wide animate-pulse">{text}</p>
  </div>
);

const PermissionError = ({ message }) => (
  <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
    <div className="bg-zinc-900/50 p-8 rounded-2xl border border-red-900/30 max-w-md w-full backdrop-blur-sm">
      <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <FaShieldAlt className="text-3xl text-red-500" />
      </div>
      <h1 className="text-2xl font-semibold mb-3 text-zinc-100">Access Denied</h1>
      <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
        {message || 'You do not have the required permissions to view this specific request.'}
      </p>
      <button
        onClick={() => window.history.back()}
        className="w-full px-5 py-2.5 bg-zinc-800 text-zinc-200 rounded-xl hover:bg-zinc-700 hover:text-white transition-all font-medium border border-zinc-700/50"
      >
        Go Back
      </button>
    </div>
  </div>
);

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children, isActionInProgress }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 z-50 backdrop-blur-md transition-opacity">
      <div className="bg-zinc-900 p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-md border border-zinc-800 transform transition-all scale-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
             <FaExclamationTriangle className="text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-100">{title}</h2>
        </div>
        
        <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
          {children}
        </p>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isActionInProgress}
            className="w-full sm:w-auto px-5 py-2.5 bg-transparent text-zinc-400 rounded-xl hover:text-zinc-200 hover:bg-zinc-800 transition-colors font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isActionInProgress}
            className="w-full sm:w-auto px-5 py-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isActionInProgress ? (
              <FaSpinner className="animate-spin mr-2" />
            ) : (
              <MdCancel className="mr-2" />
            )}
            Confirm Action
          </button>
        </div>
      </div>
    </div>
  );
};

const InfoField = ({ field }) => {
  const value = field?.value;
  const Icon = field?.name?.toLowerCase().includes('link') ? MdLink : MdTextFields;
  const displayValue = Array.isArray(value) ? value.join(', ') : value;

  return (
    <div className="group">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="text-zinc-500 group-hover:text-zinc-400 transition-colors" />
        <label className="text-sm font-medium text-zinc-300">
          {field.label}
        </label>
      </div>

      {field.description && (
        <p className="text-xs text-zinc-500 mb-2 pl-6">
          {field.description}
        </p>
      )}

      <div className="ml-6 p-3.5 bg-zinc-900/50 rounded-xl border border-zinc-800/80 text-zinc-300 whitespace-pre-wrap break-words min-h-[48px] text-sm leading-relaxed group-hover:border-zinc-700 transition-colors">
        {displayValue !== undefined && displayValue !== null && String(displayValue).length > 0 ? (
          displayValue
        ) : (
          <span className="text-zinc-600 italic">Not provided</span>
        )}
      </div>
    </div>
  );
};

const RequestList = ({ requests, loading, error, onSelect, onBack }) => {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-200 p-4 md:p-8 font-sans selection:bg-indigo-500/30">
      <Toaster 
        position="top-center" 
        toastOptions={{
          className: 'bg-zinc-900 text-zinc-100 border border-zinc-800 shadow-xl rounded-xl text-sm'
        }} 
      />

      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 tracking-tight">
              Support Requests
            </h1>
            <p className="text-sm text-zinc-400 mt-1">Manage and track your submitted inquiries.</p>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all text-sm font-medium flex items-center text-zinc-300 hover:text-white"
          >
            <IoMdArrowRoundBack className="mr-2 text-lg" />
            Return to Dashboard
          </button>
        </header>

        <div className="space-y-3">
          {loading ? (
            // Professional Skeleton Loading
            [...Array(4)].map((_, idx) => (
              <div key={idx} className="animate-pulse flex items-center p-5 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl">
                <div className="w-12 h-12 bg-zinc-800 rounded-full mr-4" />
                <div className="flex-1">
                  <div className="h-4 bg-zinc-800 rounded w-1/3 mb-3" />
                  <div className="h-3 bg-zinc-800 rounded w-1/4" />
                </div>
                <div className="w-20 h-6 bg-zinc-800 rounded-full" />
              </div>
            ))
          ) : error ? (
            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
              <FaExclamationTriangle className="mx-auto text-2xl text-red-500 mb-2" />
              <p className="text-red-400 font-medium">{error}</p>
            </div>
          ) : requests.length > 0 ? (
            requests.map((request) => {
              const config = STATUS_CONFIG[request.status] || STATUS_CONFIG.DEFAULT;
              return (
                <div
                  key={request._id}
                  onClick={() => onSelect(request._id)}
                  className={`group relative flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-zinc-900/30 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl transition-all duration-200 cursor-pointer overflow-hidden gap-4 shadow-sm hover:shadow-md`}
                >
                  {/* Subtle left border status indicator */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.borderClass} opacity-70 group-hover:opacity-100 transition-opacity`} />
                  
                  <div className="flex items-start sm:items-center gap-4 pl-2">
                    <div className="p-3 bg-zinc-800/50 rounded-xl group-hover:bg-zinc-800 transition-colors">
                      <RequestIcon type={request.requestType} />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-zinc-100 mb-1 flex items-center gap-2">
                        {getRequestTitle(request)}
                      </h2>
                      <div className="flex items-center text-xs text-zinc-500 gap-3">
                        <span className="font-mono bg-zinc-800/50 px-1.5 py-0.5 rounded text-zinc-400">
                          #{request._id.slice(-6)}
                        </span>
                        <span>
                          {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pl-2 sm:pl-0">
                    <RequestStatusBadge status={request.status} />
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800/0 group-hover:bg-zinc-800 transition-colors">
                       <FaArrowRight className="text-zinc-500 group-hover:text-zinc-300 transition-colors text-sm" />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
             <div className="text-center py-20 bg-zinc-900/20 border border-zinc-800/50 rounded-2xl border-dashed">
                <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MdSupportAgent className="text-3xl text-zinc-500" />
                </div>
                <h3 className="text-lg font-medium text-zinc-300 mb-1">No requests found</h3>
                <p className="text-sm text-zinc-500">You haven't submitted any support requests yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const RequestDetails = ({ request, loading, permissionError, onBack, onCancel }) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  if (loading) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center"><LoadingSpinner text="Retrieving details..." /></div>;
  if (permissionError) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center"><PermissionError message={permissionError} /></div>;
  if (!request) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center"><PermissionError message="Could not find the specified request." /></div>;

  const isAccountDeletion = Number(request.requestType) === ACCOUNT_DELETION_TYPE;
  const canCancel = (request.status === 'PENDING' && request.reviewed === false && !isAccountDeletion) || 
                    (request.status === 'ESCALATED' && isAccountDeletion);
  const fields = Array.isArray(request.fields) ? request.fields : [];

  const handleConfirmCancel = async () => {
    setIsCancelling(true);
    try {
      await onCancel(request._id);
      setShowCancelModal(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-200 font-sans selection:bg-indigo-500/30 pb-20">
      <Toaster 
        position="top-center" 
        toastOptions={{ className: 'bg-zinc-900 text-zinc-100 border border-zinc-800 shadow-xl rounded-xl text-sm' }} 
      />

      <ConfirmationModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel Request"
        isActionInProgress={isCancelling}
      >
        Are you sure you want to cancel this request? This action will close the ticket and cannot be undone.
      </ConfirmationModal>

      <div className="max-w-3xl mx-auto pt-8 px-4 md:px-8">
        <button
          onClick={onBack}
          className="mb-6 px-4 py-2 bg-transparent hover:bg-zinc-900 border border-transparent hover:border-zinc-800 rounded-xl transition-all text-sm font-medium flex items-center text-zinc-400 hover:text-zinc-200 w-fit"
        >
          <IoMdArrowRoundBack className="mr-2 text-lg" />
          Back to List
        </button>

        <main className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-sm">
          {/* Header Section */}
          <div className="p-6 md:p-8 border-b border-zinc-800/80 bg-zinc-900/50">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex gap-4">
                 <div className="p-4 bg-zinc-800/80 rounded-2xl h-fit border border-zinc-700/50 shadow-inner">
                    <RequestIcon type={request.requestType} className="text-3xl text-zinc-300" />
                 </div>
                 <div>
                    <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">
                      {getRequestTitle(request)}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500">
                      <span>Submitted {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="font-mono bg-zinc-950 px-2 py-0.5 rounded-md border border-zinc-800 text-xs">
                        ID: {request._id}
                      </span>
                    </div>
                 </div>
              </div>
              <div className="flex-shrink-0 pt-2 md:pt-0">
                 <RequestStatusBadge status={request.status} size="lg" />
              </div>
            </div>
          </div>

          {}
          <div className="p-6 md:p-8 space-y-8">
            
            {}
            {request.reviewed === true && (
              <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                <h3 className="text-sm font-semibold text-indigo-400 mb-3 flex items-center uppercase tracking-wider">
                  <MdSupportAgent className="mr-2 text-lg" />
                  Official Response
                </h3>
                <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                  {request.reviewMessage || `Your request has been marked as ${request.status.toLowerCase()} by the moderation team.`}
                </p>
              </div>
            )}

            {}
            <div>
              <h3 className="text-lg font-semibold text-zinc-200 mb-5 pb-2 border-b border-zinc-800">
                Provided Information
              </h3>
              <div className="space-y-6">
                {fields.length > 0 ? (
                  fields.map((field) => (
                    <InfoField key={field.name} field={field} />
                  ))
                ) : (
                  <div className="text-center py-8 bg-zinc-900/30 rounded-xl border border-zinc-800/50 border-dashed">
                     <p className="text-zinc-500 text-sm">No additional fields were provided for this request.</p>
                  </div>
                )}
              </div>
            </div>

            {}
            {canCancel && (
              <div className="pt-8 mt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-900/20 -mx-6 md:-mx-8 -mb-6 md:-mb-8 p-6 md:p-8">
                <div>
                  <h4 className="text-zinc-200 font-medium mb-1">Need to withdraw this?</h4>
                  <p className="text-xs text-zinc-500">Canceling will close this request permanently.</p>
                </div>
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="w-full sm:w-auto px-6 py-2.5 bg-zinc-800/50 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500 hover:text-white transition-all font-medium text-sm shadow-sm"
                >
                  {isAccountDeletion ? 'Cancel Deletion Request' : 'Withdraw Request'}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

const RequestManager = () => {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permissionError, setPermissionError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await apiClient.get(`${API}/requests`);
        const sortedRequests = [...response.data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRequests(sortedRequests);
      } catch (error) {
        console.error(error);
        if (error.response?.status === 403) {
          window.location.reload();
          return;
        }
        setError(error.response?.data?.message || 'Unable to load requests at this time.');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const handleRequestClick = async (requestId) => {
    setSelectedRequestId(requestId);
    setSelectedRequest(null);
    setPermissionError(null);
    setDetailLoading(true);

    try {
      const response = await apiClient.get(`${API}/requests/${requestId}`);
      setSelectedRequest(response.data);
    } catch (error) {
      console.error(error);
      setPermissionError(error.response?.data?.message || 'You do not have permission to view this request.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCancelRequest = async (requestId) => {
    const cancelPromise = apiClient.patch(`${API}/requests/${requestId}/cancel`);

    toast.promise(cancelPromise, {
      loading: 'Processing cancellation...',
      success: 'Request cancelled successfully.',
      error: (error) => error.response?.data?.message || 'Failed to cancel request.'
    });

    try {
      await cancelPromise;
      const response = await apiClient.get(`${API}/requests/${requestId}`);
      
      setSelectedRequest(response.data);
      setRequests((prev) =>
        prev.map((req) =>
          req._id === requestId
            ? { ...req, status: response.data.status, reviewed: response.data.reviewed, reviewMessage: response.data.reviewMessage }
            : req
        )
      );
    } catch (error) {
      throw error;
    }
  };

  const handleBackToList = () => {
    setSelectedRequestId(null);
    setSelectedRequest(null);
    setPermissionError(null);
  };

  if (selectedRequestId !== null) {
    return (
      <RequestDetails
        request={selectedRequest}
        loading={detailLoading}
        permissionError={permissionError}
        onBack={handleBackToList}
        onCancel={handleCancelRequest}
      />
    );
  }

  return (
    <RequestList
      requests={requests}
      loading={loading}
      error={error}
      onSelect={handleRequestClick}
      onBack={() => navigate('/')}
    />
  );
};

export default RequestManager;
