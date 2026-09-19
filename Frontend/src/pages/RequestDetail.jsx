import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiClient, { API } from '../utils/api';
import { IoMdArrowRoundBack } from 'react-icons/io';
import {
    FaSpinner,
    FaExclamationTriangle,
    FaCheckCircle,
    FaTimesCircle,
    FaHourglassHalf,
    FaBan,
    FaShieldAlt
} from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';
import {
    MdCancel,
    MdInfoOutline,
    MdLink,
    MdDelete,
    MdTextFields
} from 'react-icons/md';

const ACCOUNT_DELETION_TYPE = 4;

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
    if (!isOpen) return null;

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
                        className="px-5 py-2.5 bg-[#1a1a1a] text-gray-300 rounded-lg hover:bg-[#252525] transition-colors border border-gray-800"
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
    const icon = field?.name?.toLowerCase().includes('link')
        ? MdLink
        : MdTextFields;

    const Icon = icon;

    return (
        <div>
            <label className="flex items-center text-sm font-medium text-gray-400 mb-2">
                <Icon className="mr-2 text-gray-500" />
                {field.label}
            </label>

            {field.description && (
                <p className="text-xs text-gray-500 mb-2">
                    {field.description}
                </p>
            )}

            <div className="p-3 bg-[#0a0a0a] rounded-lg border border-gray-800 text-gray-300 whitespace-pre-wrap break-words min-h-[44px]">
                {value !== undefined &&
                value !== null &&
                String(value).length > 0 ? (
                    value
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

function RequestDetail() {
    const location = useLocation();
    const requestId = new URLSearchParams(location.search).get('id');

    const [request, setRequest] = useState(null);
    const [requestType, setRequestType] = useState(null);

    const [loading, setLoading] = useState(true);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [permissionError, setPermissionError] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
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

                if (!requestData?.requestType) {
                    throw new Error(
                        'This request does not contain a valid request type.'
                    );
                }

                const typeResponse = await apiClient.get(
                    `${API}/requests/${requestData.requestType}`
                );

                setRequest(requestData);
                setRequestType(typeResponse.data);
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

        fetchRequest();
    }, [requestId]);

    const handleCancelRequest = async () => {
        setIsCancelling(true);

        const cancelPromise = apiClient.patch(
            `${API}/requests/${requestId}/cancel`
        );

        toast.promise(cancelPromise, {
            loading: 'Cancelling request...',
            success: 'Request cancelled successfully.',
            error: (err) =>
                err.response?.data?.message ||
                'Failed to cancel request.'
        });

        try {
            await cancelPromise;

            const response = await apiClient.get(
                `${API}/requests/${requestId}`
            );

            setRequest(response.data);
        } catch (error) {
            // toast.promise already handles the error
        } finally {
            setIsCancelling(false);
            setShowCancelModal(false);
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

    const submittedFields = request.fields || {};

    const fields = requestType.fields || [];

    const isAccountDeletion =
        Number(request.requestType) === ACCOUNT_DELETION_TYPE;

    const canCancel =
        (request.status === 'PENDING' &&
            request.reviewed === false &&
            !isAccountDeletion) ||
        (request.status === 'ESCALATED' &&
            isAccountDeletion);

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
                                {request._id}
                            </span>
                        </p>
                    </div>

                    <button
                        onClick={() => navigate(-1)}
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
                                    'Request'}
                            </h2>

                            <StatusIndicator
                                status={request.status}
                            />
                        </div>

                        {request.reviewed === true && (
                            <div className="mb-6 bg-blue-950/30 p-5 rounded-lg border border-blue-900/40">
                                <h3 className="text-base font-semibold text-blue-400 mb-3 flex items-center">
                                    <MdInfoOutline className="mr-2" />
                                    Staff Response
                                </h3>

                                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                                    {request.reviewMessage ||
                                        `Your request was ${request.status.toLowerCase()}.`}
                                </p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <h3 className="text-base font-semibold text-gray-300 mb-4">
                                Submitted Information
                            </h3>

                            {fields.length > 0 ? (
                                fields.map((field) => (
                                    <InfoField
                                        key={field.name}
                                        field={field}
                                        value={
                                            submittedFields[
                                                field.name
                                            ]
                                        }
                                    />
                                ))
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
}

export default RequestDetail;
