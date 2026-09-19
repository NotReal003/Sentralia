import React, { useState, useEffect } from 'react';
import apiClient, { API } from '../utils/api';
import { useNavigate } from 'react-router-dom';

import { FaDiscord, FaArrowRight } from 'react-icons/fa';
import { MdSupportAgent, MdDelete } from 'react-icons/md';
import { FaPeopleGroup } from 'react-icons/fa6';
import { IoMdArrowRoundBack } from 'react-icons/io';

import { formatDistanceToNow } from 'date-fns';

const REQUEST_TYPES = {
  1: {
    name: 'Support Request',
    icon: MdSupportAgent,
  },

  2: {
    name: 'Discord Report',
    icon: FaDiscord,
  },

  3: {
    name: 'Application',
    icon: FaPeopleGroup,
  },

  4: {
    name: 'Account Deletion',
    icon: MdDelete,
  },
};

const STATUS_CONFIG = {
  DENIED: {
    className: 'bg-red-600 text-white',
    tooltip: 'Your request was denied.',
    gradient: 'bg-gradient-to-r from-red-600 to-red-700',
  },

  APPROVED: {
    className: 'bg-green-600 text-white',
    tooltip: 'Your request was approved.',
    gradient: 'bg-gradient-to-r from-green-600 to-green-700',
  },

  ESCALATED: {
    className: 'bg-purple-600 text-white',
    tooltip: 'Request is escalated.',
    gradient: 'bg-gradient-to-r from-purple-500 to-purple-600',
  },

  PENDING: {
    className: 'bg-yellow-600 text-white',
    tooltip: 'Your request is pending review.',
    gradient: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
  },

  CANCELLED: {
    className: 'bg-orange-600 text-white',
    tooltip: 'Your request was cancelled.',
    gradient: 'bg-gradient-to-r from-orange-600 to-orange-700',
  },

  RESOLVED: {
    className: 'bg-green-600 text-white',
    tooltip: 'Your request was resolved.',
    gradient: 'bg-gradient-to-r from-green-600 to-green-700',
  },

  RESUBMIT_REQUIRED: {
    className: 'bg-orange-600 text-white',
    tooltip: 'Your request needs to be resubmitted.',
    gradient: 'bg-gradient-to-r from-orange-600 to-orange-700',
  },
};


const RequestStatus = ({ status }) => {
  const config = STATUS_CONFIG[status];

  if (!config) {
    return (
      <span className="rounded-lg px-1 py-1 text-xs font-bold bg-gray-600 text-white">
        {status}
      </span>
    );
  }

  return (
    <span
      className={`rounded-lg px-1 py-1 text-xs font-bold ${config.className}`}
      title={config.tooltip}
    >
      {status}
    </span>
  );
};

const RequestIcon = ({ type }) => {
  const config = REQUEST_TYPES[type];

  if (!config) {
    return null;
  }

  const Icon = config.icon;

  return (
    <Icon
      className="text-4xl mr-4"
      title={config.name}
    />
  );
};

const One = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();



  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await apiClient.get(
          `${API}/requests`
        );

        const allowedTypes = [1, 2, 3, 4];

        const filteredRequests =
          response.data.filter((request) =>
            allowedTypes.includes(
              Number(request.requestType)
            )
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

        const errorMessage =
          error.response?.data?.message ||
          'Error While Checking Requests...';

        setError(errorMessage);

      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);


  const handleRequestClick = (id) => {
    navigate(`/requestdetail?id=${id}`);
  };

  return (
    <div className="flex flex-col items-center justify-center max-w-md md:max-w-lg mx-auto min-h-screen p-4 shadow-lg">

      <div className="rounded-lg shadow-sm p-2">
        <h1 className="text-2xl font-bold mb-4">
          Your Requests
        </h1>
      </div>


      <div className="w-full max-w-3xl">

        <div className="space-y-4">

          {}

          {loading ? (

            <div className="space-y-4">

              {[...Array(10)].map((_, index) => (

                <div
                  key={index}
                  className="
                    animate-pulse
                    flex
                    justify-between
                    items-center
                    p-4
                    bg-base-300
                    rounded-lg
                    shadow-lg
                    max-w-md
                    md:max-w-lg
                    mx-auto
                  "
                >

                  <div className="flex items-center space-x-4">

                    <div className="w-10 h-10 bg-gray-400 rounded-full" />

                    <div>

                      <div className="h-4 bg-gray-400 rounded w-40 mb-2" />

                      <div className="h-3 bg-gray-400 rounded w-24" />

                    </div>

                  </div>


                  <div className="w-4 h-4 bg-gray-400 rounded" />

                </div>

              ))}

            </div>


          ) : error ? (

            <p className="text-center text-red-600 font-bold">
              {error}
            </p>


          ) : requests.length > 0 ? (


            requests.map((request) => {

              const requestType =
                REQUEST_TYPES[
                  Number(request.requestType)
                ];

              const status =
                STATUS_CONFIG[request.status];

              const requestName =
                requestType?.name ||
                request.typeName ||
                'Request';

              const gradient =
                status?.gradient ||
                'bg-gradient-to-r from-gray-600 to-gray-700';


              return (

                <div
                  key={request._id}

                  className={`
                    flex
                    justify-between
                    items-center
                    p-4
                    rounded-lg
                    shadow-lg
                    max-w-md
                    md:max-w-lg
                    mx-auto
                    text-white
                    ${gradient}
                    cursor-pointer
                  `}

                  onClick={() =>
                    handleRequestClick(
                      request._id
                    )
                  }
                >

                  <div className="flex items-center">

                    <RequestIcon
                      type={Number(
                        request.requestType
                      )}
                    />


                    <div>

                      <h2 className="text-md font-bold">

                        {requestName}{' '}

                        <RequestStatus
                          status={
                            request.status
                          }
                        />

                      </h2>


                      <p className="text-sm">

                        {formatDistanceToNow(
                          new Date(
                            request.createdAt
                          ),
                          {
                            addSuffix: true,
                          }
                        )}

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


        {}

        <div className="
          sticky
          bottom-0
          left-0
          right-0
          w-full
          bg-base-100
          border-1
          border-t-slate-100
          flex
          justify-start
          items-center
          rounded-md
          p-2
        ">

          <button
            className="
              btn
              text-white
              bg-gradient-to-r
              from-purple-500
              via-purple-600
              to-purple-700
              hover:bg-gradient-to-br
              focus:ring-4
              focus:outline-none
              focus:ring-purple-300
              dark:focus:ring-purple-800
              font-medium
              rounded-lg
              no-animation
            "

            onClick={() =>
              navigate('/')
            }
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
