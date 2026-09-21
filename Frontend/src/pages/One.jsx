import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiClient, { API } from '../utils/api';
import { FaDiscord, FaArrowRight, FaSpinner } from 'react-icons/fa';
import {
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaBan,
  FaShieldAlt
} from 'react-icons/fa';
import { MdSupportAgent, MdCancel, MdInfoOutline, MdLink, MdDelete, MdTextFields } from 'react-icons/md';
import { IoMdArrowRoundBack } from 'react-icons/io';
import { FaPeopleGroup } from 'react-icons/fa6';
import { formatDistanceToNow } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';

const REQUEST_TYPES = {
  1: {
    name: 'Discord Report',
    icon: FaDiscord,
    iconTitle: 'Discord Report'
  },
  2: {
    name: 'Support Request',
    icon: MdSupportAgent,
    iconTitle: 'Support Request'
  },
  3: {
    name: 'Application',
    icon: FaPeopleGroup,
    iconTitle: 'Application'
  },
  4: {
    name: 'Account Deletion',
    icon: MdDelete,
    iconTitle: 'Account Deletion'
  }
};

const ACCOUNT_DELETION_TYPE = 4;

const RequestStatus = ({ status }) => {
  const statusStyles = {
    DENIED: 'bg-red-600 text-white',
    APPROVED: 'bg-green-600 text-white',
    ESCALATED: 'bg-purple-600 text-white',
    PENDING: 'bg-yellow-600 text-white',
    CANCELLED: 'bg-orange-600 text-white',
    RESOLVED: 'bg-green-600 text-white'
  };

  const statusTooltips = {
    DENIED: 'Your request was denied.',
    APPROVED: 'Your request was approved.',
    ESCALATED: 'Request is escalated',
    PENDING: 'Your request is pending review.',
    CANCELLED: 'Your request was cancelled.',
    RESOLVED: 'Your request was resolved.'
  };

  return (
    <span
      className={`rounded-lg px-1 py-1 text-xs font-bold ${
        statusStyles[status] || 'bg-gray-600 text-white'
      }`}
      title={statusTooltips[status] || status}
    >
      {status}
    </span>
  );
};

const RequestIcon = ({ type }) => {
  const config = REQUEST_TYPES[Number(type)];

  if (!config) {
    return null;
  }

  const Icon = config.icon;

  return (
    <Icon
      className="text-4xl mr-4"
      title={config.iconTitle}
    />
  );
};

const PermissionError = ({ message }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 text-center">
    <div className="bg-[#0a0a0a] p-10 rounded-xl shadow-2xl border border-red-900/30">
      <FaShieldAlt className="text-6xl text-red-500 mx-auto mb-6" />

      <h1 className="text-3xl font-bold mb-3 text-white">
        Access Denied
      </h1>

      <p className="text-gray-400 max-w-sm">
        {message || 'You do not have permission to view this request.'}
      </p>
    </div>
  </div>
);

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  isActionInProgress
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/80 z-50 backdrop-blur-sm">
      <div className="bg-[#0a0a0a] p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-800">
        <h2 className="text-2xl font-bold mb-4 text-white">
          {title}
        </h2>

        <div className="text-gray-400 mb-6">
          {children}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isActionInProgress}
            className="px-5 py-2.5 bg-[#1a1a1a] text-gray-300 rounded-lg hover:bg-[#252525] transition-colors border border-gray-800 disabled:opacity-50"
          >
            Go Back
          </button>

          <button
            onClick={onConfirm}
            disabled={isActionInProgress}
            className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isActionInProgress ? (
              <FaSpinner className="animate-spin mr-2" />
            ) : (
              <MdCancel className="mr-2" />
            )}

            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

const StatusIndicator = ({ status }) => {
  const statusStyles = {
    PENDING: {
      icon: FaHourglassHalf,
      text: 'Pending Review',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30'
    },
    APPROVED: {
      icon: FaCheckCircle,
      text: 'Approved',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30'
    },
    RESOLVED: {
      icon: FaCheckCircle,
      text: 'Resolved',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30'
    },
    DENIED: {
      icon: FaTimesCircle,
      text: 'Denied',
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30'
    },
    CANCELLED: {
      icon: FaBan,
      text: 'Cancelled',
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30'
    },
    ESCALATED: {
      icon: FaExclamationTriangle,
      text: 'Escalated',
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30'
    }
  };

  const currentStatus =
    statusStyles[status] || {
      icon: FaExclamationTriangle,
      text: 'Unknown',
      color: 'text-gray-400',
      bg: 'bg-gray-500/10',
      border: 'border-gray-500/30'
    };

  const Icon = currentStatus.icon;

  return (
    <div
      className={`flex items-center text-sm font-semibold ${currentStatus.color} ${currentStatus.bg} px-4 py-2 rounded-lg border ${currentStatus.border}`}
    >
      <Icon className="mr-2" />
      <span>{currentStatus.text}</span>
    </div>
  );
};

const InfoField = ({ field, value }) => {
  const Icon = field?.name?.toLowerCase().includes('link')
    ? MdLink
    : MdTextFields;

  const hasValue =
    value !== undefined &&
    value !== null &&
    String(value).trim().length > 0;

  return (
    <div>
      <label className="flex items-center text-sm font-medium text-gray-400 mb-2">
        <Icon className="mr-2 text-gray-500" />
        {field?.label || field?.name || 'Field'}
      </label>

      {field?.description && (
        <p className="text-xs text-gray-500 mb-2">
          {field.description}
        </p>
      )}

      <div className="p-3 bg-[#0a0a0a] rounded-lg border border-gray-800 text-gray-300 whitespace-pre-wrap break-words min-h-[44px]">
        {hasValue ? (
          String(value)
        ) : (
          <span className="text-gray-600">
            Not provided
          </span>
        )}
      </div>
    </div>
  );
};

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center min-h-screen text-gray-400">
    <FaSpinner className="animate-spin text-5xl mb-4 text-gray-500" />

    <p className="text-lg">
      Loading request details...
    </p>
  </div>
);

const RequestDetail = ({ requestId, onBack }) => {
  const [request, setRequest] = useState(null);
  const [requestType, setRequestType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [permissionError, setPermissionError] = useState(null);

  const fetchRequest = async () => {
    if (!requestId) {
      setPermissionError(
        'No request ID was found in the URL.'
      );
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.get(
        `${API}/requests/${requestId}`
      );

      const requestData = response.data;

      if (
        !requestData ||
        requestData.requestType === undefined ||
        requestData.requestType === null
      ) {
        throw new Error(
          'This request does not contain a valid request type.'
        );
      }

      const typeResponse = await apiClient.get(
        `${API}/requests/submissions/${requestData.requestType}`
      );

      setRequest(requestData);
      setRequestType(typeResponse.data);
      setPermissionError(null);
    } catch (error) {
      console.error(error);

      setPermissionError(
        error.response?.data?.message ||
        error.message ||
        'You do not have permission to view this request.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [requestId]);

  const handleCancelRequest = async () => {
    setIsCancelling(true);

    try {
      await toast.promise(
        apiClient.patch(
          `${API}/requests/${requestId}/cancel`
        ),
        {
          loading: 'Cancelling request...',
          success: 'Request cancelled successfully.',
          error: (err) =>
            err.response?.data?.message ||
            'Failed to cancel request.'
        }
      );

      setShowCancelModal(false);
      setLoading(true);

      await fetchRequest();
    } catch (error) {
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (permissionError) {
    return <PermissionError message={permissionError} />;
  }

  if (!request) {
    return (
      <PermissionError message="Could not find the specified request." />
    );
  }

  if (!requestType) {
    return (
      <PermissionError message="Could not load the request type definition." />
    );
  }

  const submittedFields =
    request.fields &&
    typeof request.fields === 'object'
      ? request.fields
      : {};

  const fields = Array.isArray(requestType.fields)
    ? requestType.fields
    : [];

  const isAccountDeletion =
    Number(request.requestType) === ACCOUNT_DELETION_TYPE;

  const canCancel =
    (
      request.status === 'PENDING' &&
      request.reviewed === false &&
      !isAccountDeletion
    ) ||
    (
      request.status === 'ESCALATED' &&
      isAccountDeletion
    );

  return (
    <div className="min-h-screen w-full text-gray-200 font-sans">
      <Toaster
        position="top-center"
        toastOptions={{
          className:
            'bg-[#0a0a0a] text-white border border-gray-800'
        }}
      />

      <ConfirmationModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelRequest}
        title="Confirm Cancellation"
        isActionInProgress={isCancelling}
      >
        Are you sure you want to cancel this request?
        This action cannot be reversed.
      </ConfirmationModal>

      <div className="p-4 sm:p-6 lg:p-10">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-6 border-b border-gray-800">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Request Details
            </h1>

            <p className="text-sm text-gray-500">
              ID:{' '}
              <span className="font-mono text-gray-400">
                {request._id || request.id || 'Unknown'}
              </span>
            </p>
          </div>

          <button
            onClick={onBack}
            className="mt-4 sm:mt-0 px-5 py-2.5 bg-[#1a1a1a] hover:bg-[#252525] transition-colors text-white rounded-lg border border-gray-800 flex items-center"
          >
            <IoMdArrowRoundBack className="mr-2" />
            Go Back
          </button>
        </header>

        <main className="max-w-4xl mx-auto">
          <div className="bg-[#0a0a0a] p-6 sm:p-8 rounded-xl border border-gray-800 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-800 pb-5 mb-6">
              <h2 className="text-xl font-semibold text-white mb-3 sm:mb-0">
                {request.typeName ||
                  requestType.title ||
                  REQUEST_TYPES[Number(request.requestType)]?.name ||
                  'Request'}
              </h2>

              <StatusIndicator status={request.status} />
            </div>

            {request.reviewed === true && (
              <div className="mb-6 bg-blue-950/30 p-5 rounded-lg border border-blue-900/40">
                <h3 className="text-base font-semibold text-blue-400 mb-3 flex items-center">
                  <MdInfoOutline className="mr-2" />
                  Staff Response
                </h3>

                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {request.reviewMessage ||
                    `Your request was ${
                      request.status
                        ? request.status.toLowerCase()
                        : 'processed'
                    }.`}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-base font-semibold text-gray-300 mb-4">
                Submitted Information
              </h3>

              {fields.length > 0 ? (
                fields.map((field, index) => {
                  if (!field || typeof field !== 'object') {
                    return null;
                  }

                  const fieldName =
                    field.name || `field_${index}`;

                  return (
                    <InfoField
                      key={fieldName}
                      field={field}
                      value={submittedFields[fieldName]}
                    />
                  );
                })
              ) : (
                <p className="text-gray-500">
                  No submitted fields.
                </p>
              )}
            </div>

            {canCancel && (
              <div className="text-center pt-6 mt-6 border-t border-gray-800">
                <p className="text-sm text-gray-500 mb-4">
                  Need to make changes? You can cancel this request.
                </p>

                <button
                  onClick={() =>
                    setShowCancelModal(true)
                  }
                  className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-lg"
                >
                  {isAccountDeletion
                    ? 'Cancel Account Deletion'
                    : 'Cancel Request'}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

const One = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const requestId = new URLSearchParams(
    location.search
  ).get('id');

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (requestId) {
      return;
    }

    const fetchRequests = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiClient.get(
          `${API}/requests`
        );

        const requestData = Array.isArray(response.data)
          ? response.data
          : [];

        const filteredRequests = requestData.filter(
          (request) =>
            request &&
            REQUEST_TYPES[
              Number(request.requestType)
            ]
        );

        const sortedRequests =
          filteredRequests.sort(
            (a, b) =>
              new Date(b.createdAt) -
              new Date(a.createdAt)
          );

        setRequests(sortedRequests);
      } catch (error) {
        console.error(error);

        setError(
          error.response?.data?.message ||
          'Error While Checking Requests...'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [requestId]);

  const handleRequestClick = (id) => {
    navigate(`/requestdetail?id=${id}`);
  };

  const getGradientClass = (status) => {
    switch (status) {
      case 'DENIED':
        return 'bg-gradient-to-r from-red-600 to-red-700';

      case 'CANCELLED':
        return 'bg-gradient-to-r from-orange-600 to-orange-700';

      case 'APPROVED':
        return 'bg-gradient-to-r from-green-600 to-green-700';

      case 'RESUBMIT_REQUIRED':
        return 'bg-gradient-to-r from-orange-600 to-orange-700';

      case 'RESOLVED':
        return 'bg-gradient-to-r from-green-600 to-green-700';

      case 'ESCALATED':
        return 'bg-gradient-to-r from-purple-500 to-purple-600';

      default:
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
    }
  };

  if (requestId) {
    return (
      <RequestDetail
        requestId={requestId}
        onBack={() => navigate('/requestdetail')}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center max-w-md md:max-w-lg mx-auto min-h-screen p-4 shadow-lg">
      <div className="rounded-lg shadow-sm p-2">
        <h1 className="text-2xl font-bold mb-4">
          Your Requests
        </h1>
      </div>

      <div className="w-full max-w-3xl">
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, idx) => (
                <div
                  key={idx}
                  className="animate-pulse flex justify-between items-center p-4 bg-base-300 rounded-lg shadow-lg max-w-md md:max-w-lg mx-auto"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-400 rounded-full"></div>

                    <div>
                      <div className="h-4 bg-gray-400 rounded w-40 mb-2"></div>
                      <div className="h-3 bg-gray-400 rounded w-24"></div>
                    </div>
                  </div>

                  <div className="w-4 h-4 bg-gray-400 rounded"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <p className="text-center text-red-600 font-bold">
              {error}
            </p>
          ) : requests.length > 0 ? (
            requests.map((request) => {
              const config =
                REQUEST_TYPES[
                  Number(request.requestType)
                ];

              return (
                <div
                  key={request._id || request.id}
                  className={`flex justify-between items-center p-4 rounded-lg max-w-md md:max-w-lg mx-auto text-white shadow-lg ${getGradientClass(request.status)} cursor-pointer`}
                  onClick={() =>
                    handleRequestClick(
                      request._id || request.id
                    )
                  }
                >
                  <div className="flex items-center">
                    <RequestIcon
                      type={request.requestType}
                    />

                    <div>
                      <h2 className="text-md font-bold">
                        {config?.name || 'Request'}{' '}
                        <RequestStatus
                          status={request.status}
                        />
                      </h2>

                      <p className="text-sm">
                        {request.createdAt
                          ? formatDistanceToNow(
                              new Date(
                                request.createdAt
                              ),
                              { addSuffix: true }
                            )
                          : 'Unknown date'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <FaArrowRight className="ml-2 text-white" />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="min-h-screen text-center text-gray-800">
              Hold on! You have not submitted any request yet...
            </p>
          )}
        </div>

        <div className="sticky bottom-0 left-0 right-0 w-full bg-base-100 border border-t-slate-100 flex justify-start items-center rounded-md p-2">
          <button
            className="btn text-white bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-purple-300 dark:focus:ring-purple-800 font-medium rounded-lg no-animation"
            onClick={() => navigate('/')}
          >
            <IoMdArrowRoundBack className="mr-2" />
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default One;