/* global BigInt */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaUserShield, FaUser, FaTrash, FaSpinner, FaSave, FaUsers, FaSearch, FaSyncAlt,
  FaCrown, FaLock, FaInfoCircle, FaSignOutAlt, FaCheckCircle, FaTimesCircle, FaTools,
  FaExclamationTriangle
} from 'react-icons/fa';
import { IoMdArrowRoundBack, IoMdClose } from 'react-icons/io';
import { format, formatDistanceToNow } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';
import { useDebounce } from 'use-debounce';
import AdminOnly from '../components/AdminOnly';

const getAvatarUrl = (id, avatarHash, authType) => {
  if (avatarHash && id && authType === 'discord') {
    return `https://cdn.discordapp.com/avatars/${id}/${avatarHash}.png`;
  }

  if (avatarHash && authType === "google") {
    return avatarHash;
  }
  
  try {
    if (id && typeof id === 'string' && /^\d+$/.test(id)) { // Check if it's a string of digits
      const big = BigInt(id);
      const idx = Number((big >> BigInt(22)) % BigInt(6));
      return `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
    }
  } catch (e) {
  }

  return `https://cdn.discordapp.com/embed/avatars/0.png`;
};

const roleInfo = {
  owner: {
    label: 'Owner',
    Icon: FaCrown,
    className: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
  },
  admin: {
    label: 'Admin',
    Icon: FaUserShield,
    className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
  },
  mod: {
    label: 'Mod',
    Icon: FaUserShield,
    className: 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
  },
  user: {
    label: 'User',
    Icon: FaUser,
    className: 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
  },
};

const matchLevelStyles = {
  High: 'bg-red-500/10 text-red-400 border border-red-500/20',
  Medium: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  Low: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  Default: 'bg-gray-500/10 text-gray-400 border border-gray-500/20',
};

const UserModal = ({ user, onClose, loading, error, onRoleChange, onDelete }) => {
  const [newRole, setNewRole] = useState(user?.role || 'user');
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isClosing, setIsClosing] = useState(false);
  const [alts, setAlts] = useState([]);
  const [altsLoading, setAltsLoading] = useState(false);
  const [altsError, setAltsError] = useState(null);
  const apiUrl = process.env.REACT_APP_API;

  useEffect(() => {
    setNewRole(user?.role || 'user');
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    const fetchAlts = async () => {
      setAlts([]);
      setAltsError(null);
      setAltsLoading(true);
      try {
        const res = await axios.get(`${apiUrl}/users/alts/${user.id}`, { withCredentials: true });
        setAlts(res.data.altAccounts || []);
      } catch (err) {
        setAltsError(err.response?.data?.message || 'Failed to load alt accounts.');
      } finally {
        setAltsLoading(false);
      }
    };
    fetchAlts();
  }, [user, apiUrl]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), 300);
  };

  const handleDelete = async () => {
    toast((t) => (
      <div className="bg-gray-800 text-white p-4 rounded-lg shadow-lg border border-gray-700">
        <p className="font-bold mb-2">Confirm Deletion</p>
        <p className="mb-4">Delete {user.username}'s account permanently? This cannot be undone.</p>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              const promise = axios.delete(`${apiUrl}/admin/user/${user.id}`, {
                withCredentials: true,
                headers: { 'x-gdpr-key': process.env.REACT_APP_DELETE_KEY },
              });
              toast.promise(promise, {
                loading: 'Deleting account...',
                success: 'Account deleted successfully!',
                error: (err) => err.response?.data?.message || 'Failed to delete account.',
              });
              try {
                await promise;
                onDelete(user.id);
                handleClose();
              } catch {}
            }}
            className="flex-1 px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition text-sm font-semibold"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-1 px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-700 transition text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: 60000 });
  };

  const handleRoleUpdate = async () => {
    if (user.role === 'owner') return toast.error("The Owner role cannot be changed.");
    setUpdating(true);
    const promise = onRoleChange(user.id, newRole);
    toast.promise(promise, {
        loading: 'Updating role...',
        success: 'Role updated successfully!',
        error: (e) => `Failed to update role: ${e.message}`,
    });
    try {
        await promise;
    } catch (e) {
    } finally {
        setUpdating(false);
    }
  };

  const joinedDisplay = (() => {
    if (!user?.joinedAt) return 'Unknown';
    try {
      const d = new Date(user.joinedAt);
      return isNaN(d.getTime()) ? 'Unknown' : format(d, "MMMM d, yyyy 'at' hh:mm a");
    } catch (e) {
      return 'Invalid Date';
    }
  })();

  const lastLoginDisplay = (() => {
    if (!user?.lastLogin) return 'Never';
    try {
        const d = new Date(user.lastLogin);
        return isNaN(d.getTime()) ? 'Unknown' : formatDistanceToNow(d, { addSuffix: true });
    } catch (e) {
        return 'Invalid Date';
    }
  })();

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-4 z-50 backdrop-blur-md transition-opacity duration-300 ${
        isClosing ? 'bg-opacity-0 opacity-0' : 'bg-opacity-70 opacity-100'
      }`}
      onClick={handleClose}
    >
      
      <div
        className={`bg-gradient-to-b from-[#161618] to-[#121214] rounded-2xl shadow-2xl w-full max-w-3xl relative border border-gray-700/60 transition-all duration-300 ${
          isClosing ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
        } max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-3xl text-gray-500 hover:text-white transition-all duration-300 hover:rotate-90 z-10"
        >
          <IoMdClose />
        </button>

        <div className="overflow-y-auto p-6 sm:p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <FaSpinner className="animate-spin text-3xl mb-3" />
              <p>Loading user details...</p>
            </div>
          ) : error ? (
            <div className="text-red-400 bg-red-500/10 p-4 rounded-lg text-center py-20">
              <FaExclamationTriangle className="text-3xl mx-auto mb-3" />
              <p className="font-semibold">Failed to load details</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : !user ? (
            <div className="text-gray-400 text-center py-16">No user data available.</div>
          ) : (
            <>
              <div className="flex items-center mb-6 pr-8">
                <img
                  src={getAvatarUrl(user.id, user.avatarHash, user.authType)}
                  alt={user.username}
                  className="w-16 h-16 rounded-full mr-4 flex-shrink-0"
                />
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-white truncate">{user.username}</h2>
                  <p className="text-gray-400 text-sm truncate">{user.email || 'No email provided'}</p>
                  <p className="text-gray-500 text-xs font-mono truncate">{user.id}</p>
                </div>
              </div>

              <div className="flex space-x-2 mb-4 border-b border-gray-700/60">
                <TabButton tabName="overview" label="Overview" Icon={FaInfoCircle} />
                <TabButton tabName="security" label="Security" Icon={FaLock} />
              </div>

              {activeTab === 'overview' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoItem label="Joined" value={joinedDisplay} />
                    <InfoItem label="Last Login" value={lastLoginDisplay} />
                    <InfoItem label="First Location" value={
                        (user.lastLocation?.city || user.lastLocation?.country)
                        ? `${user.lastLocation.city || 'N/A'}, ${user.lastLocation.country || 'N/A'}`
                        : 'Unknown'
                    } />
                    <InfoItem label="Last IP" value={user.lastIP || 'Unknown'} isMono={true} />
                    <InfoItem label="Last Device" value={user.lastDevice || 'Unknown'} isMono={true} />
                    <InfoItem label="Auth Type" value={user.authType || 'Unknown'} />
                  </div>
                  
                  <div className="pt-4 border-t border-gray-700/60">
                    <h4 className="font-bold text-gray-300 mb-3">Actions</h4>
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-black/20 rounded-lg border border-gray-800/50">
                      <div className="flex items-center gap-3">
                          <label htmlFor="role-select" className="text-gray-400 text-sm font-medium">Role:</label>
                          <select
                              id="role-select"
                              value={newRole}
                              onChange={(e) => setNewRole(e.target.value)}
                              disabled={updating || user.role === 'owner'}
                              className="bg-[#1c1c1c] text-white border border-gray-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:opacity-50"
                          >
                              <option value="user">User</option>
                              <option value="mod">Mod</option>
                              <option value="admin">Admin</option>
                              <option value="owner">Owner</option>
                          </select>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                          <button
                              onClick={handleRoleUpdate}
                              disabled={updating || user.role === 'owner' || user.role === newRole}
                              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                              {updating ? <FaSpinner className="animate-spin" /> : <FaSave />}
                              Save Role
                          </button>
                          <button
                              onClick={handleDelete}
                              disabled={user.role === 'owner'}
                              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                              <FaTrash />
                              Delete
                          </button>
                      </div>
                    </div>
                    {user.role === 'owner' && <p className="text-xs text-yellow-400 mt-2 text-center sm:text-right">Owner accounts cannot be modified or deleted.</p>}
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="animate-fade-in">
                  <h4 className="font-bold text-gray-300 mb-2">Associated Accounts</h4>
                  <div className="max-h-64 overflow-y-auto bg-black/20 rounded-lg border border-gray-800/50">
                    {altsLoading ? (
                      <div className="flex items-center justify-center text-gray-400 p-8">
                        <FaSpinner className="animate-spin mr-2" /> Fetching alt accounts...
                      </div>
                    ) : altsError ? (
                      <div className="text-red-400 bg-red-500/10 p-4 rounded-lg text-center m-4">
                          <FaExclamationTriangle className="text-2xl mx-auto mb-2" />
                          <p className="font-semibold">{altsError}</p>
                      </div>
                    ) : alts.length > 0 ? (
                      <ul className="divide-y divide-gray-800/50">
                        {alts.map((alt) => (
                          <li key={alt.id} className="p-3 flex items-center justify-between space-x-3 hover:bg-gray-800/30 transition-colors">
                            <div className="flex items-center space-x-3 min-w-0">
                              <img
                                src={getAvatarUrl(alt.id, alt.avatarHash, alt.authType)}
                                alt={alt.username}
                                className="w-9 h-9 rounded-full flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-white truncate">{alt.username}</p>
                                <p className="text-xs text-gray-500 font-mono truncate" title={alt.lastIP}>
                                  IP: {alt.lastIP || 'N/A'}
                                </p>
                                <p className="text-xs text-gray-500 font-mono truncate" title={alt.lastDevice}>
                                  Device: {alt.lastDevice || 'N/A'}
                                </p>
                                <p className="text-xs text-gray-400 truncate" title={alt.matchReason}>
                                  {alt.matchReason || 'N/A'}
                                </p>
                              </div>
                            </div>
                            <div className="flex-shrink-0 text-right space-y-1">
                              <span
                                className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                                  matchLevelStyles[alt.matchLevel] || matchLevelStyles.Default
                                }`}
                              >
                                {alt.matchLevel}
                              </span>
                              <p className="text-sm text-white font-bold">{alt.matchScore} pts</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-center text-gray-500 p-8">No associated accounts found.</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  function TabButton({ tabName, label, Icon }) {
    return (
      <button
        onClick={() => setActiveTab(tabName)}
        className={`flex items-center space-x-2 px-4 py-3 -mb-px rounded-t-lg text-sm font-medium transition ${
          activeTab === tabName
            ? 'border-b-2 border-purple-500 text-white'
            : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
        }`}
      >
        <Icon />
        <span>{label}</span>
      </button>
    );
  }

  function InfoItem({ label, value, isMono = false }) {
      return (
          <div className="bg-black/20 p-3 rounded-lg border border-gray-800/50">
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className={`text-sm text-white truncate ${isMono ? 'font-mono' : 'font-medium'}`} title={value}>
                  {value}
              </p>
          </div>
      )
  }
};
const Pagination = ({ page, totalPages, setPage }) => {
    if (totalPages <= 1) return null;
    return (
        <div className="flex flex-wrap justify-center items-center gap-2">
            <button disabled={page === 1} onClick={() => setPage(1)} className="px-3 py-2 bg-gray-800/50 rounded-lg disabled:opacity-50 hover:bg-gray-700 transition-all duration-200 ease-in-out text-sm">« First</button>
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-2 bg-gray-800/50 rounded-lg disabled:opacity-50 hover:bg-gray-700 transition-all duration-200 ease-in-out text-sm">‹ Prev</button>
            <span className="text-gray-400 px-2 text-sm">Page {page} of {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-2 bg-gray-800/50 rounded-lg disabled:opacity-50 hover:bg-gray-700 transition-all duration-200 ease-in-out text-sm">Next ›</button>
            <button disabled={page === totalPages} onClick={() => setPage(totalPages)} className="px-3 py-2 bg-gray-800/50 rounded-lg disabled:opacity-50 hover:bg-gray-700 transition-all duration-200 ease-in-out text-sm">Last »</button>
        </div>
    );
};

const UserListSkeleton = ({ count = 10 }) => (
    <div className="space-y-2">
        {[...Array(count)].map((_, i) => (
            <div key={i} className="p-4 bg-[#1c1c1c]/50 rounded-lg animate-pulse">
                <div className="flex items-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-700 rounded-full mr-4" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-700 rounded w-1/3" />
                        <div className="h-3 bg-gray-700 rounded w-1/4" />
                    </div>
                    <div className="h-6 w-16 bg-gray-700 rounded-full" />
                </div>
            </div>
        ))}
    </div>
);

const AdminUsers = () => {
  const apiUrl = process.env.REACT_APP_API;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminOnly, setAdminOnly] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const navigate = useNavigate();

  const mapUserRole = (user) => {
     if (!user) return 'user';
     if (user.owner) return 'owner';
     if (user.admin) return 'admin';
     if (user.staff) return 'mod';
     return 'user';
  }

  const normalizeUser = (raw) => {
    const id = raw.id || raw._id || (raw._id && raw._id.toString && raw._id.toString()) || undefined;
    return {
      ...raw,
      id,
      role: mapUserRole(raw),
    };
  };

  const fetchUsers = useCallback(async (isRefresh = false) => {
    setLoading(true);
    if (isRefresh) {
        toast.loading('Refreshing user list...', { id: 'refresh-toast' });
    }
    try {
      const response = await axios.get(`${apiUrl}/manage/users/all`, { withCredentials: true });

      let list = [];
      if (Array.isArray(response.data.users)) {
        list = response.data.users;
      } else if (response.data.users && typeof response.data.users === 'object') {
        list = Object.values(response.data.users);
      } else {
        list = [];
      }

      const mappedUsers = list.map((u) => normalizeUser(u));
      setUsers(mappedUsers);
      if (isRefresh) {
          toast.success('User list refreshed!', { id: 'refresh-toast' });
      }
    } catch (error) {
      if (isRefresh) {
          toast.error(`Failed to refresh: ${error.response?.data?.message || error.message}`, { id: 'refresh-toast' });
      } else if (error.response?.status === 403) {
          setAdminOnly(true);
      } else {
          toast.error(`Failed to load users: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchUsers(false);
  }, [fetchUsers]);

  const handleRoleChange = useCallback(async (userId, newRole) => {
      try {
        setUsers((prevUsers) => prevUsers.map((user) => (user.id === userId ? { ...user, role: newRole, admin: newRole === 'admin', staff: newRole === 'mod', owner: newRole === 'owner' } : user)));
        setSelectedUser((prev) => prev && { ...prev, role: newRole, admin: newRole === 'admin', staff: newRole === 'mod', owner: newRole === 'owner' });
        
        await axios.patch(`${apiUrl}/admin/staff/manage/${userId}/role`, { role: newRole }, { withCredentials: true });
        
      } catch (error) {
        toast.error('Failed to update role. Reverting changes.');
        fetchUsers(true);
        throw new Error(error.response?.data?.message || 'API Error');
      }
    }, [apiUrl, fetchUsers]
  );
  
  const handleDeleteUser = useCallback((userId) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  }, []);

  const filteredUsers = useMemo(() =>
    users.filter((user) =>
        (user.username || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
        (user.id && user.id.toLowerCase().includes(debouncedSearch.toLowerCase()))
    ), [users, debouncedSearch]
  );

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredUsers.length / pageSize)), [filteredUsers.length, pageSize]);
  const paginatedUsers = useMemo(() => filteredUsers.slice((page - 1) * pageSize, page * pageSize), [filteredUsers, page, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handleUserClick = useCallback(async (user) => {
    setSelectedUser(user);
    setDetailLoading(true);
    setDetailError(null);
    try {
      const response = await axios.get(`${apiUrl}/manage/user/${user.id}`, { withCredentials: true });
      const detailedUser = normalizeUser(response.data.user || response.data);
      setSelectedUser(detailedUser);
    } catch (error) {
      setDetailError(`Failed to fetch details: ${error.response?.data?.message || 'API Error'}`);
    } finally {
      setDetailLoading(false);
    }
  }, [apiUrl]);

  const closeModal = useCallback(() => setSelectedUser(null), []);

  const roleCounts = useMemo(() => {
    return users.reduce((acc, user) => {
        const r = user.role || 'user';
        acc[r] = (acc[r] || 0) + 1;
        return acc;
    }, { owner: 0, admin: 0, mod: 0, user: 0 });
  }, [users]);

  if (adminOnly) return <AdminOnly />;

  return (
  <div className="min-h-screen text-gray-200 px-3 py-4 sm:px-6 md:px-8 font-sans overflow-x-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-[#1a0c2e] opacity-50 z-0"></div>
    <Toaster position="top-center" toastOptions={{ 
        className: 'bg-gray-800 text-white border border-gray-700 shadow-lg',
        success: {
            iconTheme: { primary: '#22c55e', secondary: 'black' }
        },
        error: {
            iconTheme: { primary: '#ef4444', secondary: 'black' }
        },
    }} />

    <div className="container mx-auto max-w-6xl relative z-10 space-y-6 w-full">

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold flex items-center text-white">
            <FaUserShield className="mr-2 text-purple-400 text-xl sm:text-2xl" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
              User Management
            </span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">Manage users and platform roles efficiently.</p>
        </div>
        <button
          onClick={() => fetchUsers(true)}
          className="flex-shrink-0 flex items-center px-3 py-2 bg-gray-800/60 rounded-md hover:bg-gray-700 transition-all text-sm border border-gray-700/40 disabled:opacity-50"
          disabled={loading}
        >
          <FaSyncAlt className={`mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: users.length, color: 'gray' },
          { label: 'Admins', value: roleCounts.admin + roleCounts.owner, color: 'amber' },
          { label: 'Mods', value: roleCounts.mod, color: 'purple' },
          { label: 'Users', value: roleCounts.user, color: 'gray' },
        ].map((stat, i) => (
          <div
            key={i}
            className={`bg-[#141414] border border-${stat.color}-500/20 rounded-lg p-3 sm:p-4 text-center hover:scale-[1.02] transition-transform duration-300`}
          >
            <p className={`text-xs sm:text-sm font-medium text-${stat.color}-400`}>{stat.label}</p>
            <p className="text-lg sm:text-2xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm" />
        <input
          type="text"
          placeholder="Search by username, email, or ID..."
          className="w-full pl-9 pr-9 py-2 rounded-md bg-[#1a1a1a]/60 border border-gray-700/50 text-sm sm:text-base text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
          >
            <IoMdClose size={18} />
          </button>
        )}
      </div>

      <div className="bg-[#151515]/60 rounded-lg border border-gray-800/50 p-2 sm:p-3">
        {loading ? (
          <UserListSkeleton count={pageSize} />
        ) : paginatedUsers.length > 0 ? (
          <ul className="divide-y divide-gray-800">
            {paginatedUsers.map((user) => (
              <li
                key={user.id}
                onClick={() => handleUserClick(user)}
                className="flex items-center justify-between py-2 px-2 sm:px-3 hover:bg-[#222]/60 transition-colors cursor-pointer rounded-md"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={getAvatarUrl(user.id, user.avatarHash, user.authType)}
                    alt={user.username}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm sm:text-base truncate">{user.username}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {user.lastLogin
                        ? `Last seen ${formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true })}`
                        : 'Never logged in'}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 text-[10px] sm:text-xs rounded-full font-bold ${
                    (roleInfo[user.role] || roleInfo.user).className
                  } flex-shrink-0`}
                >
                  {(roleInfo[user.role] || roleInfo.user).label}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-10 text-gray-400">
            <p className="text-sm sm:text-base">No users found.</p>
            {debouncedSearch && <p className="text-xs sm:text-sm">Search: “{debouncedSearch}”</p>}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center px-3 py-2 bg-gray-800/50 rounded-md hover:bg-gray-700 transition-all border border-gray-700/40 text-sm"
        >
          <IoMdArrowRoundBack className="mr-2" /> Back
        </button>
        
        <Pagination page={page} totalPages={totalPages} setPage={setPage} />
      </div>
    </div>

    {selectedUser && (
      <UserModal
        user={selectedUser}
        onClose={closeModal}
        loading={detailLoading}
        error={detailError}
        onRoleChange={handleRoleChange}
        onDelete={handleDeleteUser}
      />
    )}
  </div>
 );
};

export default AdminUsers;
