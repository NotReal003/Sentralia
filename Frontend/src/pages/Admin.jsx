import React, { useState, useEffect, useCallback, useMemo } from 'react';
import apiClient, { API } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { FaDiscord, FaArrowRight, FaSyncAlt, FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaRedo, FaBan, FaShieldAlt } from 'react-icons/fa';
import { MdSupportAgent } from 'react-icons/md';
import { IoMdArrowRoundBack, IoMdClose } from 'react-icons/io';
import { formatDistanceToNow } from 'date-fns';
import { FaPeopleGroup } from 'react-icons/fa6';
import toast, { Toaster } from 'react-hot-toast';
import AdminOnly from '../components/AdminOnly';

const statusInfo = {
    PENDING:   { label: 'Pending',   Icon: FaHourglassHalf,    className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    APPROVED:  { label: 'Approved',  Icon: FaCheckCircle,      className: 'bg-green-500/10 text-green-400 border-green-500/20' },
    RESOLVED:  { label: 'Resolved',  Icon: FaCheckCircle,      className: 'bg-green-500/10 text-green-400 border-green-500/20' },
    DENIED:    { label: 'Denied',    Icon: FaTimesCircle,      className: 'bg-red-500/10 text-red-400 border-red-500/20' },
    CANCELLED: { label: 'Cancelled', Icon: FaBan,              className: 'bg-red-500/10 text-red-400 border-red-500/20' },
    ESCALATED: { label: 'Escalated', Icon: FaExclamationTriangle, className: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
    RESUBMIT_REQUIRED: { label: 'Resubmit', Icon: FaRedo, className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
};

const typeInfo = {
    'report': { label: 'Discord Report', Icon: FaDiscord, color: 'text-indigo-400' },
    'guild-application': { label: 'Application', Icon: FaPeopleGroup, color: 'text-teal-400' },
    'support': { label: 'Support Request', Icon: MdSupportAgent, color: 'text-sky-400' },
};

const RequestStatus = ({ status }) => {
    const info = statusInfo[status] || {};
    return (
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${info.className}`}>
            <info.Icon className="mr-1.5" />
            {info.label}
        </span>
    );
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black bg-opacity-70 z-50 backdrop-blur-sm animate-fade-in">
            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] p-8 rounded-2xl shadow-2xl w-full max-w-md relative border border-gray-700/50">
                <h2 className="text-2xl font-bold mb-4 text-white">{title}</h2>
                <div className="text-gray-400 mb-6">{children}</div>
                <div className="flex justify-end space-x-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-700/50 rounded-lg hover:bg-gray-600/70 transition-colors">Cancel</button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors">Confirm</button>
                </div>
            </div>
        </div>
    );
};

const LoadingSkeleton = ({ count = 5 }) => (
    <div className="space-y-3">
        {[...Array(count)].map((_, i) => (
            <div key={i} className="p-4 bg-[#1a1a1a]/50 rounded-xl border border-gray-800/50 animate-pulse">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-gray-700 rounded-lg mr-4" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-700 rounded w-48" />
                            <div className="h-3 bg-gray-700 rounded w-32" />
                        </div>
                    </div>
                    <div className="h-6 w-24 bg-gray-700 rounded-full" />
                </div>
            </div>
        ))}
    </div>
);

const FilterControls = ({ statusFilter, setStatusFilter, userIdFilter, setUserIdFilter, onToggleApi, apiClosed }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-[#1a1a1a]/50 rounded-xl border border-gray-800/50">
        <select
            className="w-full p-3 rounded-lg bg-[#2a2a2a] border border-gray-700/50 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
        >
            <option value="">All Statuses</option>
            {Object.keys(statusInfo).map(key => <option key={key} value={key}>{statusInfo[key].label}</option>)}
        </select>
        <input
            type="text"
            placeholder="Search by User ID..."
            value={userIdFilter}
            className="w-full p-3 rounded-lg bg-[#2a2a2a] border border-gray-700/50 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
            onChange={(e) => setUserIdFilter(e.target.value)}
        />
        <div className="flex items-center justify-between bg-[#2a2a2a] p-3 rounded-lg border border-gray-700/50">
            <span className="label-text text-md text-white">API Status: <span className={apiClosed ? 'text-red-400' : 'text-green-400'}>{apiClosed ? 'Closed' : 'Open'}</span></span>
            <input
                type="checkbox"
                className="toggle toggle-secondary"
                checked={!apiClosed}
                onChange={onToggleApi}
            />
        </div>
    </div>
);

const Admin = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [userIdFilter, setUserIdFilter] = useState('');
    const [apiClosed, setApiClosed] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [adminOnly, setAdminOnly] = useState(false);
    const [isModalOpen, setModalOpen] = useState(false);
    const requestsPerPage = 10;
    const navigate = useNavigate();

    useEffect(() => {
        const fetchApiStatus = async () => {
             try {
                 const response = await apiClient.get(`${API}/server/api-status`);
                 setApiClosed(response.data.serverClosed === "yesclosed");
             } catch (err) {
                 console.error("Could not fetch API status", err);
                 setApiClosed(false);
             }
        };
        fetchApiStatus();
    }, [API]);
    
    useEffect(() => {
        const fetchRequests = async () => {
            setLoading(true);
            try {
                const response = await apiClient.get(`${API}/admin/requests`);
                const sortedRequests = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setRequests(sortedRequests);
                setError(null);
            } catch (err) {
                if (err.response?.status === 403) {
                    setAdminOnly(true);
                } else {
                    setError(err.response?.data?.message || 'Failed to load requests.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, [API]);

    const handleToggleApiStatus = async () => {
        try {
            await apiClient.patch(`${API}/server/manage-api`, 
                { closeType: apiClosed ? 'noopened' : 'yesclosed' }
            );
            toast.success(`API has been ${apiClosed ? 'opened' : 'closed'} successfully.`);
            setApiClosed(!apiClosed);
        } catch (error) {
            toast.error('Failed to change API status.');
        } finally {
            setModalOpen(false);
        }
    };
    
    const filteredRequests = useMemo(() => {
        return requests
            .filter(req => statusFilter ? req.status === statusFilter : true)
            .filter(req => userIdFilter ? req.id.toLowerCase().includes(userIdFilter.toLowerCase()) : true);
    }, [requests, statusFilter, userIdFilter]);
    
    const totalPages = Math.ceil(filteredRequests.length / requestsPerPage);
    const paginatedRequests = filteredRequests.slice((currentPage - 1) * requestsPerPage, currentPage * requestsPerPage);

    useEffect(() => {
        if(currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        } else if (currentPage === 0 && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [currentPage, totalPages])

    if (adminOnly) {
        return <AdminOnly />;
    }

    return (
        <div className="min-h-screen text-gray-200 p-4 sm:p-6 lg:p-8 font-sans">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-black via-black to-[#1a0c2e] opacity-50 z-0"></div>
            <Toaster position="top-center" toastOptions={{ className: 'bg-gray-800 text-white border border-gray-700' }} />
            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onConfirm={handleToggleApiStatus}
                title="Confirm Action"
            >
                Are you sure you want to {apiClosed ? 'open' : 'close'} the API for submissions?
            </ConfirmationModal>

            <div className="container mx-auto max-w-7xl relative z-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-white">Manage Requests</h1>
                        <p className="text-gray-400 mt-1">
                            {loading ? 'Loading requests...' : `Showing ${filteredRequests.length} of ${requests.length} total requests.`}
                        </p>
                    </div>
                     <button className="px-4 py-2 bg-gray-800/50 rounded-lg hover:bg-gray-700/80 transition-colors flex items-center self-start sm:self-center border border-gray-700/50" onClick={() => navigate('/')}>
                        <IoMdArrowRoundBack className="mr-2" /> Back to Home
                    </button>
                </div>

                <FilterControls 
                    statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                    userIdFilter={userIdFilter} setUserIdFilter={setUserIdFilter}
                    apiClosed={apiClosed} onToggleApi={() => setModalOpen(true)}
                />

                <div className="bg-[#1a1a1a]/30 rounded-xl border border-gray-800/50 p-2 min-h-[400px]">
                    {loading ? (
                        <LoadingSkeleton />
                    ) : error ? (
                        <div className="text-center text-red-400 py-16 bg-red-500/10 rounded-lg">
                            <FaExclamationTriangle className="text-5xl mx-auto mb-4"/>
                            <p className="text-xl font-bold">An Error Occurred</p>
                            <p>{error}</p>
                        </div>
                    ) : paginatedRequests.length > 0 ? (
                        <div className="space-y-3">
                            {paginatedRequests.map((request) => {
                                const TypeIcon = typeInfo[request.type]?.Icon || FaExclamationTriangle;
                                return (
                                    <div
                                        key={request._id}
                                        className="p-4 bg-[#1c1c1c]/50 rounded-lg shadow-md hover:bg-[#2a2a2a] transition-all duration-300 cursor-pointer group border border-transparent hover:border-purple-500/30"
                                        onClick={() => navigate(`/admindetail?id=${request._id}`)}
                                        role="button"
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <TypeIcon className={`text-4xl flex-shrink-0 ${typeInfo[request.type]?.color || 'text-gray-500'}`} />
                                                <div>
                                                    <p className="font-bold text-lg text-white">{typeInfo[request.type]?.label || 'Unknown Request'}</p>
                                                    <p className="text-sm text-gray-400">
                                                        From <span className="font-semibold text-gray-300">{request.username}</span> • {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <RequestStatus status={request.status} />
                                                <FaArrowRight className="text-gray-600 group-hover:text-white transition-colors text-xl"/>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                         <div className="text-center text-gray-500 py-16">
                            <p className="text-xl">No Requests Found</p>
                            <p>There are no requests matching your current filters.</p>
                        </div>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="flex justify-center items-center space-x-2 mt-8">
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-4 py-2 bg-gray-800/50 rounded-lg disabled:opacity-50 hover:bg-gray-700 transition-colors">‹ Prev</button>
                        <span className="text-gray-400">Page {currentPage} of {totalPages}</span>
                        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-4 py-2 bg-gray-800/50 rounded-lg disabled:opacity-50 hover:bg-gray-700 transition-colors">Next ›</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Admin;
