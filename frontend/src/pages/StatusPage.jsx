import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import axiosClient from '../utils/axiosClient';
import { logoutUser } from '../authSlice';

function StatusPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      try {
        const { data } = await axiosClient.get(`/submission/all?page=${page}&limit=20`);
        setSubmissions(data.submissions || []);
        setTotalPages(data.totalPages || 1);
      } catch (error) {
        console.error('Error fetching submissions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
    
    // Auto-refresh every 10 seconds to act like a real-time status page
    const interval = setInterval(fetchSubmissions, 10000);
    return () => clearInterval(interval);
  }, [page]);

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${month}/${day}/${year}\n${hours}:${minutes}`;
  };

  const getVerdictStyle = (status) => {
    switch (status) {
      case 'accepted': return 'text-green-500 font-bold';
      case 'wrong': return 'text-red-500 font-bold';
      case 'pending': return 'text-gray-400 italic';
      case 'error': return 'text-yellow-500 font-bold';
      default: return 'text-gray-300';
    }
  };

  const formatVerdict = (sub) => {
    if (sub.status === 'accepted') return 'Accepted';
    if (sub.status === 'pending') return 'In queue / Under process';
    if (sub.status === 'wrong') return `Failed (Wrong answer on test ${sub.testCasesPassed + 1})`;
    if (sub.status === 'error') return 'Failed (Compilation error)';
    return sub.status;
  };

  return (
    <div className="min-h-screen bg-[#111111] text-gray-300 font-sans">
      {/* Codeforces style Header / Navbar */}
      <nav className="bg-[#222222] border-b border-gray-700 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center h-full gap-8">
          <NavLink to="/" className="flex items-center gap-3">
            <div className="bg-primary/20 text-primary px-2.5 py-1.5 rounded-lg text-base font-mono font-bold">
              &lt;/&gt;
            </div>
            <span className="text-2xl font-extrabold tracking-wide leading-none mt-1">
              <span className="text-white">Byte</span>
              <span className="text-primary">Code</span>
            </span>
          </NavLink>
          <div className="flex h-full gap-6 text-sm font-semibold uppercase tracking-wider">
            <NavLink to="/" className="flex items-center h-full text-gray-400 hover:text-white transition-colors">Problems</NavLink>
            <NavLink to="/leaderboard" className="flex items-center h-full text-gray-400 hover:text-white transition-colors">Leaderboard</NavLink>
            <NavLink to="/status" className="relative flex items-center h-full text-primary after:absolute after:bottom-0 after:left-0 after:w-full after:h-[3px] after:rounded-t-full after:bg-primary">Submissions</NavLink>
          </div>
        </div>
        <div className="text-sm font-semibold">
          {user ? (
            <div className="dropdown dropdown-end">
              <div tabIndex={0} className="flex items-center gap-3 px-4 py-2 rounded-xl cursor-pointer hover:bg-white/5 transition-all duration-200">
                <div className="w-9 h-9 rounded-full bg-primary/30 text-primary flex items-center justify-center font-extrabold text-base">
                  {user.firstName?.[0]?.toUpperCase()}
                </div>
                <span className="text-base font-semibold tracking-wide text-white">
                  {user.firstName}
                </span>
              </div>
              <ul tabIndex={0} className="dropdown-content mt-3 p-2 w-44 bg-[#2a2a2a] border border-gray-700 rounded-xl shadow-xl transition-all duration-200 z-50">
                <li><NavLink to="/profile" className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10 text-gray-200 transition-colors">Profile</NavLink></li>
                <li><button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-white/10 text-gray-200 transition-colors">Logout</button></li>
                {user.role === 'admin' && (
                  <li><NavLink to="/admin" className="flex items-center gap-2 text-sm font-medium hover:bg-white/10 text-gray-200 rounded-lg px-3 py-2 transition">Admin</NavLink></li>
                )}
              </ul>
            </div>
          ) : (
            <NavLink to="/login" className="hover:text-white">Enter</NavLink>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="bg-[#1e1e1e] border border-gray-700 rounded-md shadow-lg overflow-hidden">
          <div className="bg-[#2a2a2a] px-4 py-3 border-b border-gray-700 font-bold text-gray-100 flex justify-between items-center">
            <span>Submissions</span>
            {loading && <span className="loading loading-spinner loading-xs text-primary"></span>}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-center border-collapse">
              <thead>
                <tr className="bg-[#222222] text-gray-400 border-b border-gray-700">
                  <th className="py-2 px-2 border-r border-gray-700 w-20">#</th>
                  <th className="py-2 px-2 border-r border-gray-700 w-32">When</th>
                  <th className="py-2 px-2 border-r border-gray-700 w-32">Who</th>
                  <th className="py-2 px-2 border-r border-gray-700 w-64">Problem</th>
                  <th className="py-2 px-2 border-r border-gray-700 w-24">Lang</th>
                  <th className="py-2 px-2 border-r border-gray-700 w-48">Verdict</th>
                  <th className="py-2 px-2 border-r border-gray-700 w-24">Time</th>
                  <th className="py-2 px-2 w-24">Memory</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub, index) => {
                  const problemDisplay = sub.problemId ? `${sub.problemId._id.slice(-4).toUpperCase()} - ${sub.problemId.title}` : 'Unknown Problem';
                  const rowClass = index % 2 === 0 ? 'bg-[#1e1e1e]' : 'bg-[#222222]';
                  return (
                    <tr key={sub._id} className={`${rowClass} hover:bg-[#2a2a2a] transition-colors border-b border-gray-800`}>
                      <td className="py-2 px-2 border-r border-gray-700">
                        <span className="text-blue-400 hover:underline cursor-pointer">{sub._id.slice(-8)}</span>
                      </td>
                      <td className="py-2 px-2 border-r border-gray-700 text-xs whitespace-pre-wrap">
                        {formatDate(sub.createdAt)}
                      </td>
                      <td className="py-2 px-2 border-r border-gray-700 font-semibold">
                        {sub.userId ? (
                          <span className={sub.userId.role === 'admin' ? 'text-red-500' : 'text-green-500'}>
                            {sub.userId.firstName}
                          </span>
                        ) : 'Ghost'}
                      </td>
                      <td className="py-2 px-2 border-r border-gray-700 text-left">
                        {sub.problemId ? (
                          <NavLink to={`/problem/${sub.problemId._id}`} className="text-blue-400 hover:underline">
                            {problemDisplay}
                          </NavLink>
                        ) : problemDisplay}
                      </td>
                      <td className="py-2 px-2 border-r border-gray-700">
                        {sub.language === 'c++' ? 'C++' : sub.language === 'javascript' ? 'Node.js' : 'Java'}
                      </td>
                      <td className={`py-2 px-2 border-r border-gray-700 ${getVerdictStyle(sub.status)}`}>
                        {formatVerdict(sub)}
                      </td>
                      <td className="py-2 px-2 border-r border-gray-700">
                        {sub.status === 'pending' ? '--' : `${sub.runtime || 0} ms`}
                      </td>
                      <td className="py-2 px-2">
                        {sub.status === 'pending' ? '--' : `${Math.round((sub.memory || 0) / 1024)} KB`}
                      </td>
                    </tr>
                  );
                })}
                {submissions.length === 0 && !loading && (
                  <tr>
                    <td colSpan="8" className="py-8 text-gray-500">No submissions found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-[#222222] p-3 flex justify-center border-t border-gray-700">
              <div className="join">
                <button 
                  className="join-item btn btn-sm bg-[#1e1e1e] hover:bg-gray-700 border-gray-600 text-white" 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  «
                </button>
                <button className="join-item btn btn-sm bg-[#2a2a2a] border-gray-600 text-white">
                  Page {page} of {totalPages}
                </button>
                <button 
                  className="join-item btn btn-sm bg-[#1e1e1e] hover:bg-gray-700 border-gray-600 text-white" 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  »
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StatusPage;
