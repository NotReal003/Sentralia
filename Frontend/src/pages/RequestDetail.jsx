import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { IoMdArrowRoundBack } from 'react-icons/io';
import {
    FaSpinner, FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaBan, FaShieldAlt
} from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';
import { MdCancel, MdInfoOutline, MdQuestionAnswer, MdPerson, MdLink, MdDelete } from 'react-icons/md';

const PermissionError = ({ message }) => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 text-center">
        <div className="bg-[#0a0a0a] p-10 rounded-xl shadow-2xl border border-red-900/30">
            <FaShieldAlt className="text-6xl text-red-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-3 text-white">Access Denied</h1>
            <p className="text-gray-400 max-w-sm">{message || "You do not have permission to view this request."}</p>
        </div>
    </div>
);

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children, isActionInProgress }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/80 z-50 backdrop-blur-sm">
            <div className="bg-[#0a0a0a] p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-800">
                <h2 className="text-2xl font-bold mb-4 text-white">{title}</h2>
                <div className="text-gray-400 mb-6">{children}</div>
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
                        {isActionInProgress ? <FaSpinner className="animate-spin mr-2" /> : <MdCancel className="mr-2" />}
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

const StatusIndicator = ({ status }) => {
    const statusStyles = {
        PENDING: { icon: FaHourglassHalf, text: 'Pending Review', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
        APPROVED: { icon: FaCheckCircle, text: 'Approved', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
        RESOLVED: { icon: FaCheckCircle, text: 'Resolved', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
        DENIED: { icon: FaTimesCircle, text: 'Denied', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
        CANCELLED: { icon: FaBan, text: 'Cancelled', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
        ESCALATED: { icon: FaExclamationTriangle, text: 'Escalated', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
    };
    const currentStatus = statusStyles[status] || { icon: FaExclamationTriangle, text: 'Unknown', color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30' };
    const Icon = currentStatus.icon;
    return (
        <div className={`flex items-center text-sm font-semibold ${currentStatus.color} ${currentStatus.bg} px-4 py-2 rounded-lg border ${currentStatus.border}`}>
            <Icon className="mr-2" />
            <span>{currentStatus.text}</span>
        </div>
    );
};

const InfoField = ({ label, value, icon }) => {
    const Icon = icon;
    return (
        <div>
            <label className="flex items-center text-sm font-medium text-gray-400 mb-2">
                <Icon className="mr-2 text-gray-500" />
                {label}
            </label>
            <div className="p-3 bg-[#0a0a0a] rounded-lg border border-gray-800 text-gray-300 whitespace-pre-wrap break-words min-h-[44px]">
                {value || <span className="text-gray-600">Not provided</span>}
            </div>
        </div>
    );
};

const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center min-h-screen text-gray-400">
        <FaSpinner className="animate-spin text-5xl mb-4 text-gray-500" />
        <p className="text-lg">Loading request details...</p>
    </div>
);

function RequestDetail() {
    const location = useLocation();
    const requestId = new URLSearchParams(location.search).get('id');
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [permissionError, setPermissionError] = useState(null);
    const navigate = useNavigate();
    const API = process.env.REACT_APP_API;

    useEffect(() => {
        const fetchRequest = async () => {
            if (!requestId) {
                setPermissionError("No request ID was found in the URL.");
                setLoading(false);
                return;
            }
            try {
                const response = await axios.get(`${API}/requests/${requestId}`, { withCredentials: true });
                setRequest(response.data);
            } catch (error) {
                setPermissionError(error.response?.data?.message || 'You do not have permission to view this request.');
            } finally {
                setLoading(false);
            }
        };
        fetchRequest();
    }, [requestId, API]);

    const handleCancelRequest = async () => {
        setIsCancelling(true);
        const cancelPromise = axios.patch(`${API}/requests/${requestId}/cancel`,
            { status: 'CANCELLED', reviewMessage: 'Self-canceled by the user.' },
            { withCredentials: true }
        );

        toast.promise(cancelPromise, {
            loading: 'Cancelling request...',
            success: 'Request cancelled successfully.',
            error: (err) => err.response?.data?.message || 'Failed to cancel request.',
        });

        try {
            await cancelPromise;
            const response = await axios.get(`${API}/requests/${requestId}`, { withCredentials: true });
            setRequest(response.data);
        } catch (error) {
        } finally {
            setIsCancelling(false);
            setShowCancelModal(false);
        }
    };

    if (loading) return <LoadingSpinner />;
    if (permissionError) return <PermissionError message={permissionError} />;
    if (!request) return <PermissionError message="Could not find the specified request." />;

    const getRequestFields = () => {
        switch (request.type) {
            case 'report': return <InfoField icon={MdLink} label="Evidence/Message Link" value={request.messageLink} />;
            case 'support': return <InfoField icon={MdQuestionAnswer} label="Your Support Query" value={request.messageLink} />;
            case 'account_deletion': return <InfoField icon={MdDelete} label="Why do you want to delete your account? *" value={request.messageLink} />;
            case 'guild-application': return <>
                <InfoField icon={MdPerson} label="In-Game Name" value={request.inGameName} />
                <InfoField icon={MdQuestionAnswer} label="Reason for Joining" value={request.messageLink} />
            </>;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen w-full text-gray-200 font-sans">
            <Toaster position="top-center" toastOptions={{ className: 'bg-[#0a0a0a] text-white border border-gray-800' }} />
            
            <ConfirmationModal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={handleCancelRequest}
                title="Confirm Cancellation"
                isActionInProgress={isCancelling}
            >
                Are you sure you want to cancel this request? This action cannot be reversed.
            </ConfirmationModal>

            <div className="p-4 sm:p-6 lg:p-10">
                
                <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-6 border-b border-gray-800">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                            Request Details
                        </h1>
                        <p className="text-sm text-gray-500">
                            ID: <span className="font-mono text-gray-400">{request._id}</span>
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
                            <h2 className="text-xl font-semibold text-white mb-3 sm:mb-0">{request.typeName}</h2>
                            <StatusIndicator status={request.status} />
                        </div>

                        {request.reviewed === 'true' && (
                            <div className="mb-6 bg-blue-950/30 p-5 rounded-lg border border-blue-900/40">
                                <h3 className="text-base font-semibold text-blue-400 mb-3 flex items-center">
                                    <MdInfoOutline className="mr-2" />
                                    Staff Response
                                </h3>
                                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                                    {request.reviewMessage || `Your request was ${request.status.toLowerCase()}.`}
                                </p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <h3 className="text-base font-semibold text-gray-300 mb-4">Submitted Information</h3>
                            {getRequestFields()}
                            <InfoField icon={MdInfoOutline} label="Additional Information" value={request.additionalInfo} />
                        </div>

                        {request.status === 'PENDING' && request.reviewed === 'false' && request.type !== "account_deletion" && (
                            <div className="text-center pt-6 mt-6 border-t border-gray-800">
                                <p className="text-sm text-gray-500 mb-4">
                                    Need to make changes? You can cancel this request.
                                </p>
                                <button
                                    onClick={() => setShowCancelModal(true)}
                                    className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-lg"
                                >
                                    Cancel Request
                                </button>
                            </div>
                        )}
                        {request.status === 'ESCALATED' && request.type === "account_deletion" && (
                            <div className="text-center pt-6 mt-6 border-t border-gray-800">
                                <p className="text-sm text-gray-500 mb-4">
                                    Need to make changes? You can cancel this request.
                                </p>
                                <button
                                    onClick={() => setShowCancelModal(true)}
                                    className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-lg"
                                >
                                    Cancel Account Deletion
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
