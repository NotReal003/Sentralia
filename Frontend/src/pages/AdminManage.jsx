import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import {
  FaUserSlash,
  FaUserCheck,
  FaShieldAlt,
  FaSearch,
  FaTimes
} from 'react-icons/fa';
import { ImSpinner6 } from 'react-icons/im';
import AdminOnly from '../components/AdminOnly';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, description, confirmLabel = 'Confirm' }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-opacity-60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div className="relative w-full max-w-md rounded-xl border border-gray-700 bg-gradient-to-br from-[#1e1e1e] to-[#0c0c0c] shadow-2xl">
        <div className="p-6">
          <h2 id="modal-title" className="mb-2 text-xl font-semibold text-white">
            {title}
          </h2>
          <p id="modal-description" className="mb-6 text-sm text-gray-300">
            {description}
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="rounded-md bg-gray-700 px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-gray-600"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
              type="button"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
        <button
          onClick={onClose}
          className="absolute right-3 top-3 p-1 text-gray-400 hover:text-gray-200"
          aria-label="Close modal"
        >
          <FaTimes />
        </button>
      </div>
    </div>
  );
};

const TableSkeleton = ({ columns, rows = 5 }) => (
  <div className="animate-pulse space-y-2">
    <div className="flex justify-between rounded-t-lg bg-gray-800 p-4">
      {columns.map((_, i) => (
        <div key={i} className="h-4 w-1/4 rounded bg-gray-700" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, rowIdx) => (
      <div key={rowIdx} className="flex items-center justify-between bg-gray-800/50 p-4">
        {columns.map((_, colIdx) => (
          <div key={colIdx} className="h-4 w-1/4 rounded bg-gray-700" />
        ))}
      </div>
    ))}
  </div>
);

const ManageUsersPanel = ({ api, onAction, adminOnly, setAdminOnly }) => {
  const [userId, setUserId] = useState('');
  const [reason, setReason] = useState('');
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userToUnblock, setUserToUnblock] = useState(null);
  const API = process.env.REACT_APP_API;

  const fetchBlockedUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API}/users/blocks`, { withCredentials: true });
      const filtered = res.data.filter((u) => u.blocked === 'YES');
      setBlockedUsers(filtered);
    } catch (err) {
      if (err.response?.status === 403) setAdminOnly(true);
      else setError(err.response?.data?.message || 'Unable to fetch blocked users');
    } finally {
      setLoading(false);
    }
  }, [API, setAdminOnly]);

  useEffect(() => {
    fetchBlockedUsers();
  }, [fetchBlockedUsers]);

  const handleBlockSubmit = async (e) => {
    e.preventDefault();
    onAction(async () => {
      if (!userId.trim() || !reason.trim()) {
        toast.error('Both user ID and reason are required');
        return Promise.reject();
      }
      await axios.post(`${api}/users/block/add`, { myBlockUser: userId, myBlockReason: reason }, { withCredentials: true });
      setUserId('');
      setReason('');
      await fetchBlockedUsers();
    }, {
      loading: 'Blocking user...',
      success: 'User blocked successfully!',
      error: (err) => err.response?.data?.message || 'Error blocking user'
    });
  };

  const handleUnblock = () => {
    if (!userToUnblock) return;
    onAction(async () => {
      await axios.put(`${API}/users/unblock`, { myBlockUser: userToUnblock.user_id }, { withCredentials: true });
      await fetchBlockedUsers();
    }, {
      loading: `Unblocking ${userToUnblock.user_id}...`,
      success: 'User unblocked successfully!',
      error: (err) => err.response?.data?.message || 'Error unblocking user'
    });
    setUserToUnblock(null);
  };

  const filtered = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return blockedUsers.filter((u) =>
      u.user_id.toLowerCase().includes(query) ||
      u.reason.toLowerCase().includes(query)
    );
  }, [blockedUsers, searchQuery]);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      
      <ConfirmationModal
        isOpen={Boolean(userToUnblock)}
        onClose={() => setUserToUnblock(null)}
        onConfirm={handleUnblock}
        title="Confirm Unblock"
        description={userToUnblock ? `Are you sure you want to unblock user ${userToUnblock.user_id}?` : ''}
        confirmLabel="Unblock"
      />

      <section className="rounded-xl border border-gray-800/40 bg-gradient-to-br from-[#1a1a1a] to-[#121212] p-6 lg:col-span-1">
        <h3 className="mb-4 text-2xl font-bold text-white">Block a User</h3>
        <form onSubmit={handleBlockSubmit} className="space-y-4">
          <div>
            <label htmlFor="block-user-id" className="mb-1 block text-sm font-medium text-gray-300">
              User ID
            </label>
            <input
              id="block-user-id"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user ID"
              className="w-full rounded-lg border border-gray-700 bg-[#2a2a2a] p-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label htmlFor="block-user-reason" className="mb-1 block text-sm font-medium text-gray-300">
              Reason
            </label>
            <input
              id="block-user-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for block"
              className="w-full rounded-lg border border-gray-700 bg-[#2a2a2a] p-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            type="submit"
            className="flex w-full items-center justify-center rounded-lg bg-red-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-red-700"
          >
            <FaUserSlash className="mr-2" /> Block User
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-gray-800/40 bg-gradient-to-br from-[#1a1a1a] to-[#121212] p-6 lg:col-span-2">
        <header className="mb-4 flex flex-col items-start justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
          <h3 className="text-2xl font-bold text-white">Blocked Users ({filtered.length})</h3>
          <div className="relative w-full max-w-xs">
            <label htmlFor="search-users" className="sr-only">Search blocked users</label>
            <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              id="search-users"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID or reason…"
              className="w-full rounded-lg border border-gray-700 bg-[#2a2a2a] py-2 pl-10 pr-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </header>
        {loading ? (
          <TableSkeleton columns={['User ID', 'Reason', 'Action']} />
        ) : error ? (
          <p className="text-red-400">{error}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-800/50 text-gray-300">
                <tr>
                  <th className="p-3">User ID</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.user_id} className="border-b border-gray-800/60 hover:bg-[#2a2a2a]/60">
                    <td className="p-3 font-mono text-gray-100">{user.user_id}</td>
                    <td className="p-3 text-gray-300">{user.reason}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setUserToUnblock(user)}
                        className="inline-flex items-center rounded-lg bg-green-600/20 px-3 py-1 text-sm font-semibold text-green-300 transition-colors hover:bg-green-600/40"
                      >
                        <FaUserCheck className="mr-1" /> Unblock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="py-8 text-center text-gray-500">No blocked users found.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

const ManageIpsPanel = ({ api, onAction, adminOnly, setAdminOnly }) => {
  const [ipAddress, setIpAddress] = useState('');
  const [reason, setReason] = useState('');
  const [bannedIps, setBannedIps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ipToUnban, setIpToUnban] = useState(null);
  const API = process.env.REACT_APP_API;

  const fetchBannedIps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API}/ip/banned`, { withCredentials: true });
      setBannedIps(res.data);
    } catch (err) {
      if (err.response?.status === 403) setAdminOnly(true);
      else setError(err.response?.data?.message || 'Unable to fetch banned IPs');
    } finally {
      setLoading(false);
    }
  }, [API, setAdminOnly]);

  useEffect(() => {
    fetchBannedIps();
  }, [fetchBannedIps]);

  const handleBanSubmit = async (e) => {
    e.preventDefault();
    onAction(async () => {
      if (!ipAddress.trim() || !reason.trim()) {
        toast.error('Both IP address and reason are required');
        return Promise.reject();
      }
      await axios.post(`${API}/ip/ban`, { ipAddress, reason }, { withCredentials: true });
      setIpAddress('');
      setReason('');
      await fetchBannedIps();
    }, {
      loading: 'Banning IP…',
      success: 'IP banned successfully',
      error: (err) => err.response?.data?.message || 'Error banning IP'
    });
  };

  const handleUnban = () => {
    if (!ipToUnban) return;
    onAction(async () => {
      await axios.delete(`${api}/ip/unban`, { data: { ipAddress: ipToUnban.ipAddress }, withCredentials: true });
      await fetchBannedIps();
    }, {
      loading: `Unbanning ${ipToUnban.ipAddress}…`,
      success: 'IP unbanned successfully',
      error: (err) => err.response?.data?.message || 'Error unbanning IP'
    });
    setIpToUnban(null);
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      
      <ConfirmationModal
        isOpen={Boolean(ipToUnban)}
        onClose={() => setIpToUnban(null)}
        onConfirm={handleUnban}
        title="Confirm Unban IP"
        description={ipToUnban ? `Are you sure you want to unban the IP address ${ipToUnban.ipAddress}?` : ''}
        confirmLabel="Unban"
      />

      <section className="rounded-xl border border-gray-800/40 bg-gradient-to-br from-[#1a1a1a] to-[#121212] p-6 lg:col-span-1">
        <h3 className="mb-4 text-2xl font-bold text-white">Ban an IP Address</h3>
        <form onSubmit={handleBanSubmit} className="space-y-4">
          <div>
            <label htmlFor="ban-ip-address" className="mb-1 block text-sm font-medium text-gray-300">
              IP Address
            </label>
            <input
              id="ban-ip-address"
              type="text"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              placeholder="Enter IP address"
              className="w-full rounded-lg border border-gray-700 bg-[#2a2a2a] p-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label htmlFor="ban-ip-reason" className="mb-1 block text-sm font-medium text-gray-300">
              Reason
            </label>
            <input
              id="ban-ip-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for ban"
              className="w-full rounded-lg border border-gray-700 bg-[#2a2a2a] p-3 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            type="submit"
            className="flex w-full items-center justify-center rounded-lg bg-red-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-red-700"
          >
            <FaShieldAlt className="mr-2" /> Ban IP
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-gray-800/40 bg-gradient-to-br from-[#1a1a1a] to-[#121212] p-6 lg:col-span-2">
        <h3 className="mb-4 text-2xl font-bold text-white">Banned IPs ({bannedIps.length})</h3>
        {loading ? (
          <TableSkeleton columns={['IP Address', 'Reason', 'Action']} />
        ) : error ? (
          <p className="text-red-400">{error}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-800/50 text-gray-300">
                <tr>
                  <th className="p-3">IP Address</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {bannedIps.map((ip) => (
                  <tr key={ip.ipAddress} className="border-b border-gray-800/60 hover:bg-[#2a2a2a]/60">
                    <td className="p-3 font-mono text-gray-100">{ip.ipAddress}</td>
                    <td className="p-3 text-gray-300">{ip.reason}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setIpToUnban(ip)}
                        className="inline-flex items-center rounded-lg bg-green-600/20 px-3 py-1 text-sm font-semibold text-green-300 transition-colors hover:bg-green-600/40"
                      >
                        Unban
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {bannedIps.length === 0 && (
              <p className="py-8 text-center text-gray-500">No banned IPs found.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

const AdminManagePage = () => {
  const [tab, setTab] = useState('users');
  const [adminOnly, setAdminOnly] = useState(false);
  const API = process.env.REACT_APP_API;

  const handleAction = async (action, messages) => {
    try {
      await toast.promise(action(), messages);
    } catch {
    }
  };

  if (adminOnly) {
    return <AdminOnly />;
  }

  return (
    <div className="relative min-h-screen text-gray-200 font-sans">
      
      <div className="pointer-events-none absolute inset-0 z-0" />
      <Toaster
        position="top-center"
        toastOptions={{ className: 'bg-gray-800 text-white border border-gray-700' }}
      />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="mb-2 text-4xl font-extrabold text-white">Management Panel</h1>
          <p className="text-gray-400">
            Block malicious users and ban IP addresses to protect the platform.
          </p>
        </header>
        
        <nav
          className="mb-8 border-b border-gray-800"
          aria-label="Management sections"
        >
          <ul className="flex space-x-2">
            <li>
              <button
                onClick={() => setTab('users')}
                className={`px-6 py-3 font-semibold transition-colors focus:outline-none ${tab === 'users' ? 'border-b-2 border-purple-500 text-white' : 'text-gray-500 hover:text-white'}`}
                aria-current={tab === 'users' ? 'page' : undefined}
              >
                Manage Users
              </button>
            </li>
            <li>
              <button
                onClick={() => setTab('ips')}
                className={`px-6 py-3 font-semibold transition-colors focus:outline-none ${tab === 'ips' ? 'border-b-2 border-purple-500 text-white' : 'text-gray-500 hover:text-white'}`}
                aria-current={tab === 'ips' ? 'page' : undefined}
              >
                Manage IPs
              </button>
            </li>
          </ul>
        </nav>
        {tab === 'users' ? (
          <ManageUsersPanel api={API} onAction={handleAction} adminOnly={adminOnly} setAdminOnly={setAdminOnly} />
        ) : (
          <ManageIpsPanel api={API} onAction={handleAction} adminOnly={adminOnly} setAdminOnly={setAdminOnly} />
        )}
      </div>
    </div>
  );
};

export default AdminManagePage;
