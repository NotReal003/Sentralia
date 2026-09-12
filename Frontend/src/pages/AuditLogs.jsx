import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  RefreshCw, 
  AlertCircle, 
  Copy, 
  Check, 
  Clock, 
  Filter,
  ShieldAlert,
  Database,
  ArrowRight
} from 'lucide-react';
import AdminOnly from '../components/AdminOnly';
import apiClient, { API } from '../utils/api';

const formatTimestamp = (dateString) => {
  if (!dateString) return 'Unknown date';
  const date = new Date(dateString);
  const now = new Date();
  
  const isToday = 
    date.getDate() === now.getDate() && 
    date.getMonth() === now.getMonth() && 
    date.getFullYear() === now.getFullYear();
  
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = 
    date.getDate() === yesterday.getDate() && 
    date.getMonth() === yesterday.getMonth() && 
    date.getFullYear() === yesterday.getFullYear();

  const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
  const timeString = date.toLocaleTimeString('en-US', timeOptions);

  if (isToday) return `Today, ${timeString}`;
  if (isYesterday) return `Yesterday, ${timeString}`;
  
  const dateOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  return `${date.toLocaleDateString('en-US', dateOptions)}, ${timeString}`;
};

const truncateId = (id) => {
  if (!id) return 'N/A';
  if (id.length <= 8) return id;
  return `${id.slice(0, 4)}...${id.slice(-4)}`;
};

const getActionStyles = (action) => {
  const lower = (action || '').toLowerCase();
  
  if (lower.includes('delet') || lower.includes('den') || lower.includes('remov') || lower.includes('fail')) {
    return 'bg-red-500/10 text-red-400 border-red-500/20';
  }
  if (lower.includes('approv') || lower.includes('creat') || lower.includes('success')) {
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  }
  if (lower.includes('updat') || lower.includes('chang') || lower.includes('modi')) {
    return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  }
  if (lower.includes('escalat') || lower.includes('warn')) {
    return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  }
  
  return 'bg-slate-500/10 text-slate-300 border-slate-500/20';
};

const CopyableId = ({ id, label }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    if (!id) return;
    
    const textArea = document.createElement("textarea");
    textArea.value = id;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
    document.body.removeChild(textArea);
  };

  if (!id) return <span className="text-slate-500 italic">None</span>;

  return (
    <div 
      className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-sm font-mono text-slate-300 transition-colors cursor-pointer group"
      onClick={handleCopy}
      title={`Click to copy full ${label} ID`}
    >
      {truncateId(id)}
      {copied ? (
        <Check size={14} className="text-emerald-400" />
      ) : (
        <Copy size={14} className="text-slate-400 group-hover:text-slate-200" />
      )}
    </div>
  );
};

const SkeletonRow = () => (
  <div className="flex flex-col sm:flex-row sm:items-center p-4 border-b border-white/5 animate-pulse gap-4">
    <div className="w-full sm:w-1/3 flex items-center gap-3">
      <div className="h-4 w-4 bg-slate-800 rounded-full"></div>
      <div className="h-6 w-32 bg-slate-800 rounded-full"></div>
    </div>
    <div className="w-full sm:w-1/4">
      <div className="h-6 w-24 bg-slate-800 rounded"></div>
    </div>
    <div className="w-full sm:w-1/4">
      <div className="h-6 w-24 bg-slate-800 rounded"></div>
    </div>
    <div className="w-full sm:w-1/6 flex justify-end">
      <div className="h-5 w-28 bg-slate-800 rounded"></div>
    </div>
  </div>
);

export default function App() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');
  const [adminOnly, setAdminOnly] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get(`${API}/admin/audit-logs`);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setAdminOnly(true);
          throw new Error('Authentication failed. Please check your permissions or log in again.');
        }
        throw new Error(`Server returned a ${response.status} error. Please try again later.`);
      }

      const result = await response.json();
      
      let parsedData = [];
      if (Array.isArray(result)) {
        parsedData = result;
      } else if (result && Array.isArray(result.data)) {
        parsedData = result.data;
      } else if (result && Array.isArray(result.logs)) {
        parsedData = result.logs;
      } else if (result && Array.isArray(result.activities)) {
        parsedData = result.activities;
      } else {
        throw new Error('Unexpected data format received from the server.');
      }

      setLogs(parsedData);
    } catch (err) {
      if (err.response?.status === 403) setAdminOnly(true);
      setError(err.message || 'A network error occurred while fetching the audit logs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const uniqueActions = useMemo(() => {
    const actions = new Set(logs.map(log => log.action).filter(Boolean));
    return Array.from(actions).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (filterAction !== 'ALL' && log.action !== filterAction) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const actionMatch = (log.action || '').toLowerCase().includes(query);
        const actorMatch = (log.actor || '').toLowerCase().includes(query);
        const targetMatch = (log.target || '').toLowerCase().includes(query);
        
        if (!actionMatch && !actorMatch && !targetMatch) {
          return false;
        }
      }

      return true;
    });   
  }, [logs, searchQuery, filterAction]);

  if (adminOnly) return <AdminOnly />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-200 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/10">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Audit Log</h1>
            <p className="text-slate-400 text-sm">
              View administrative activity and system changes across the platform.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchLogs}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg shadow-sm transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 border border-transparent"
            >
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl p-4 rounded-xl shadow-xl border border-white/10 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search by action, actor ID, or target ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950/50 border border-white/10 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-slate-900 transition-all"
            />
          </div>
          <div className="relative w-full sm:w-64 shrink-0">
            <Filter size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full pl-10 pr-8 py-2 bg-slate-950/50 border border-white/10 rounded-lg text-sm text-slate-200 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-slate-900 transition-all cursor-pointer"
            >
              <option className="bg-slate-900 text-slate-200" value="ALL">All Actions</option>
              {uniqueActions.map(action => (
                <option className="bg-slate-900 text-slate-200" key={action} value={action}>{action}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 overflow-hidden">
          
          {error && (
            <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mb-2 border border-red-500/20">
                <ShieldAlert size={32} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Unable to load audit logs</h3>
                <p className="text-slate-400 max-w-md mt-1">{error}</p>
              </div>
              <button 
                onClick={fetchLogs}
                className="mt-4 px-6 py-2 bg-white text-slate-900 hover:bg-slate-200 text-sm font-medium rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {isLoading && !error && (
            <div className="w-full">
              {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
            </div>
          )}

          {!isLoading && !error && logs.length === 0 && (
            <div className="p-16 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-16 h-16 bg-slate-800/50 text-slate-500 rounded-full flex items-center justify-center mb-2 border border-white/5">
                <Database size={32} />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">No activity recorded yet</h3>
                <p className="text-slate-400 text-sm mt-1">When administrative actions occur, they will appear here.</p>
              </div>
            </div>
          )}

          {!isLoading && !error && logs.length > 0 && filteredLogs.length === 0 && (
            <div className="p-12 flex flex-col items-center justify-center text-center space-y-2">
              <AlertCircle size={32} className="text-slate-500 mb-2" />
              <h3 className="text-base font-medium text-slate-300">No results found</h3>
              <p className="text-slate-400 text-sm">No activity matches your current search or filter criteria.</p>
              <button 
                onClick={() => { setSearchQuery(''); setFilterAction('ALL'); }}
                className="mt-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}

          {!isLoading && !error && filteredLogs.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-950/30 border-b border-white/10 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="p-4 w-2/5">Activity / Action</th>
                    <th className="p-4 w-1/5">Actor</th>
                    <th className="p-4 w-1/5">Target</th>
                    <th className="p-4 w-1/5 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-800/40 transition-colors group">
                      
                      <td className="p-4 align-top">
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 w-2 h-2 rounded-full ${getActionStyles(log.action).split(' ')[0]} border-none`} />
                          <div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getActionStyles(log.action)}`}>
                              {log.action || 'Unknown action'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 align-top">
                        <div className="flex flex-col items-start gap-1">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">User ID</span>
                          <CopyableId id={log.actor} label="actor" />
                        </div>
                      </td>

                      <td className="p-4 align-top">
                        <div className="flex flex-col items-start gap-1">
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Resource ID</span>
                          {log.target ? (
                            <CopyableId id={log.target} label="target" />
                          ) : (
                            <span className="text-sm text-slate-500 italic">System</span>
                          )}
                        </div>
                      </td>

                      <td className="p-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5 text-sm text-slate-400">
                          <Clock size={14} className="text-slate-500" />
                          <span>{formatTimestamp(log.createdAt)}</span>
                        </div>
                      </td>
                      
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {!isLoading && !error && filteredLogs.length > 0 && (
            <div className="bg-slate-950/30 border-t border-white/10 p-4 text-xs text-slate-400 flex justify-between items-center">
              <span>Showing {filteredLogs.length} {filteredLogs.length === 1 ? 'event' : 'events'}</span>
              <span className="flex items-center gap-1 text-slate-500">
                End of log <ArrowRight size={12} className="opacity-50" />
              </span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
