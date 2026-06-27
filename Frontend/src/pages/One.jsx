import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaDiscord, FaArrowRight, FaSpinner } from 'react-icons/fa';
import { MdSupportAgent, MdDelete } from 'react-icons/md';
import { IoMdArrowRoundBack } from "react-icons/io";
import { formatDistanceToNow } from 'date-fns';
import { FaPeopleGroup } from "react-icons/fa6";

const RequestStatus = ({ status }) => {
  const statusStyles = {
    DENIED: 'bg-red-600 text-white',
    APPROVED: 'bg-green-600 text-white',
    ESCALATED: 'bg-purple-600 text-white',
    PENDING: 'bg-yellow-600 text-white',
    CANCELLED: 'bg-orange-600 text-white',
    RESOLVED: 'bg-green-600 text-white',
  };

  const statusTooltips = {
    DENIED: 'Your request was denied.',
    APPROVED: 'Your request was approved.',
    ESCALATED: 'Request is escalated',
    PENDING: 'Your request is pending review.',
    CANCELLED: 'Your request was cancelled.',
    RESOLVED: 'Your request was resolved.',
  };

  return (
    <span
      className={`rounded-lg px-1 py-1 text-xs font-bold ${statusStyles[status]}`}
      title={statusTooltips[status]}
    >
      {status}
    </span>
  );
};

const RequestIcon = ({ type }) => {
  if (type === 'report') {
    return <FaDiscord className="text-4xl mr-4" title="Discord Report" />;
  } else if (type === 'guild-application') {
    return <FaPeopleGroup className="text-4xl mr-4" title="Application" />;
  } else if (type === 'account_deletion') {
    return <MdDelete className="text-4xl mr-4" title="Account Deletion" />;
  } else if (type === 'support') {
    return <MdSupportAgent className="text-4xl mr-4" title="Support Request" />;
  }
  return null;
};

const One = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('jwtToken');
  const navigate = useNavigate();
  const API = process.env.REACT_APP_API;

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await axios.get(`${API}/requests`, {
          withCredentials: true,
        });
        if (response.status === 403) {
          window.location.reload();
          return;
        }

        const filteredRequests = response.data.filter((request) =>
          ['report', 'support', 'account_deletion', 'guild-application'].includes(request.type)
        );

        const sortedRequests = filteredRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRequests(sortedRequests);
      } catch (error) {
        console.error(error);
        const errorMessage = error.response?.data?.message || 'Error While Checking Requests...';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [token, API]);

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

  return (
    <div className="flex flex-col items-center justify-center max-w-md md:max-w-lg mx-auto min-h-screen p-4 shadow-lg">
      <div className="rounded-lg shadow-sm p-2">
        <h1 className="text-2xl font-bold mb-4">Your Requests</h1>
      </div>

      <div className="w-full max-w-3xl">
        <div className="space-y-4">
          {loading ? (
  <div className="space-y-4">
    {[...Array(1000)].map((_, idx) => (
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
  <p className="text-center text-red-600 font-bold">{error}</p>
) : requests.length > 0 ? (
            requests.map((request) => (
              <div
                key={request._id}
                className={`flex justify-between items-center p-4 bg rounded-lg shadow-lg max-w-md md:max-w-lg mx-auto text-white shadow-lg ${getGradientClass(request.status)} cursor-pointer`}
                onClick={() => handleRequestClick(request._id)}
              >
                <div className="flex items-center">
                  <RequestIcon type={request.type} />
                  <div>
                    <h2 className="text-md font-bold">
                      {request.type === 'report' ? `Discord Report` : request.type === 'guild-application' ? 'Application' : request.type === "account_deletion" ? "Account Deletion" : 'Support Request'} <RequestStatus status={request.status} />
                    </h2>
                    <p className="text-sm">
                      {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <FaArrowRight className="ml-2 text-white" />
                </div>
              </div>
            ))
          ) : (
            <p className="min-h-screen text-center text-gray-800">Hold on! You have not submitted any request yet...</p>
          )}
        </div>

        <div className="sticky bottom-0 left-0 right-0 w-full bg-base-100 border-1 border-t-slate-100 flex justify-start items-center rounded-md p-2">
          <button className="btn text-white bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-purple-300 dark:focus:ring-purple-800 font-medium rounded-lg no-animation" onClick={() => navigate('/')}>
            <IoMdArrowRoundBack className="mr-2" />Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default One;
