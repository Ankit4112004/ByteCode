import { useEffect, useState } from "react";
import { NavLink } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import axiosClient from "../utils/axiosClient";
import { logoutUser } from '../authSlice';

function Leaderboard() {
  const { user } = useSelector((s) => s.auth);
  const [board, setBoard] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [boardRes, meRes] = await Promise.all([
          axiosClient.get("/leaderboard"),
          axiosClient.get("/leaderboard/me"),
        ]);
        setBoard(boardRes.data);
        setMe(meRes.data);
      } catch (err) {
        console.error("Failed to load leaderboard", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#111111] text-gray-300 font-sans">
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
            <NavLink to="/leaderboard" className="relative flex items-center h-full text-primary after:absolute after:bottom-0 after:left-0 after:w-full after:h-[3px] after:rounded-t-full after:bg-primary">Leaderboard</NavLink>
            <NavLink to="/status" className="flex items-center h-full text-gray-400 hover:text-white transition-colors">Submissions</NavLink>
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

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Personal rank card */}
        {me && (
          <div className="bg-[#1e1e1e] border border-gray-700 rounded-md shadow-lg mb-6 p-4 flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-400">Your rank</div>
              <div className="text-2xl font-bold text-white">
                {me.rank ? `#${me.rank}` : "Unranked"}
                <span className="text-sm font-normal text-gray-500"> / {me.total}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Score</div>
              <div className="text-2xl font-bold text-primary">{me.score}</div>
            </div>
            {me.percentile !== null && (
              <div className="text-right">
                <div className="text-sm text-gray-400">Percentile</div>
                <div className="text-2xl font-bold text-white">Beats {me.percentile}%</div>
              </div>
            )}
          </div>
        )}

        {/* Score Rules */}
        <div className="bg-[#1e1e1e] border border-gray-700 rounded-md shadow-sm mb-6 p-3 flex justify-center items-center gap-4 text-sm font-medium">
          <span className="text-gray-400">Score Rules:</span>
          <span className="text-emerald-400">Easy 1</span>
          <span className="text-yellow-400">Medium 3</span>
          <span className="text-red-400">Hard 5</span>
        </div>

        <div className="bg-[#1e1e1e] border border-gray-700 rounded-md shadow-lg overflow-hidden">
          <div className="bg-[#2a2a2a] px-4 py-3 border-b border-gray-700 font-bold text-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-amber-500">
                <path d="M2 22V12h6V4h8v11h6v7" />
                <path d="M8 22V12" />
                <path d="M16 22V15" />
                <path d="M0 22h24" />
              </svg>
              <span>Leaderboard</span>
            </div>
            {loading && <span className="loading loading-spinner loading-xs text-primary"></span>}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-center border-collapse">
              <thead>
                <tr className="bg-[#222222] text-gray-400 border-b border-gray-700">
                  <th className="py-2 px-4 border-r border-gray-700 w-32">Rank</th>
                  <th className="py-2 px-4 border-r border-gray-700 text-left">User</th>
                  <th className="py-2 px-4 w-32">Score</th>
                </tr>
              </thead>
              <tbody>
                {board.map((row, index) => {
                  const isMe = user && row.userId === user._id;
                  const rowClass = index % 2 === 0 ? 'bg-[#1e1e1e]' : 'bg-[#222222]';
                  const activeClass = isMe ? 'bg-primary/20 hover:bg-primary/30' : `${rowClass} hover:bg-[#2a2a2a]`;
                  return (
                    <tr key={row.userId} className={`${activeClass} transition-colors border-b border-gray-800`}>
                      <td className="py-2 px-4 border-r border-gray-700 font-mono text-gray-300">
                        {row.rank === 1 ? "🥇" : row.rank === 2 ? "🥈" : row.rank === 3 ? "🥉" : `#${row.rank}`}
                      </td>
                      <td className="py-2 px-4 border-r border-gray-700 text-left font-semibold">
                        <span className={row.role === 'admin' ? 'text-red-500' : isMe ? 'text-primary' : 'text-green-500'}>
                          {row.firstName}
                        </span>
                      </td>
                      <td className="py-2 px-4 font-bold text-gray-200">
                        {row.score}
                      </td>
                    </tr>
                  );
                })}
                {board.length === 0 && !loading && (
                  <tr>
                    <td colSpan="3" className="py-8 text-gray-500">No ranked users yet. Solve a problem to get on the board!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Leaderboard;
