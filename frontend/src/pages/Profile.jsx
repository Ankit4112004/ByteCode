import React, { useEffect, useState } from 'react';
import axiosClient from '../utils/axiosClient';
import { useSelector } from 'react-redux';



const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [profileRes, rankRes] = await Promise.all([
          axiosClient.get('/user/profile'),
          axiosClient.get('/leaderboard/me').catch(() => ({ data: { rank: null } }))
        ]);
        setStats({ ...profileRes.data, rankInfo: rankRes.data });
      } catch (error) {
        console.error('Failed to fetch profile stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p>Failed to load profile data.</p>
      </div>
    );
  }

  const { totalCounts, solvedCounts } = stats;

  const totalProblems = (totalCounts.easy || 0) + (totalCounts.medium || 0) + (totalCounts.hard || 0) || 1;
  const totalSolved = (solvedCounts.easy || 0) + (solvedCounts.medium || 0) + (solvedCounts.hard || 0);
  const solvedPercentage = Math.round((totalSolved / totalProblems) * 100);



  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 p-6 md:p-12 font-sans">
      
      {/* HEADER */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 mb-8">
        <div className="flex-1 bg-[#151515] rounded-xl p-8 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-400 text-4xl font-bold border border-indigo-500/30">
              {user?.firstName?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{user?.firstName || 'User'}</h1>
              <p className="text-gray-400">{user?.emailId}</p>
              <div className="mt-4 flex gap-3">
                <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-semibold text-gray-300 border border-white/10">Rank: {stats.rankInfo?.rank ? `#${stats.rankInfo.rank}` : 'N/A'}</span>
                <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-semibold text-gray-300 border border-white/10">{user?.role}</span>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-10 pr-6">
            <div className="text-center">
              <div className="text-3xl font-black text-indigo-400 mb-1">{stats.rankInfo?.score || 0}</div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Score</div>
            </div>
            <div className="w-px h-12 bg-white/10"></div>
            <div className="text-center">
              <div className="text-3xl font-black text-white mb-1">{totalSolved}</div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Solved</div>
            </div>

          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 gap-6">
        
        {/* DSA PROGRESS DONUT */}
        <div className="bg-[#151515] rounded-xl p-6 border border-white/5 shadow-xl flex flex-col items-center">
          <h2 className="text-lg font-semibold text-white self-start w-full mb-6">DSA Progress</h2>
          
          <div className="relative w-48 h-48 mb-6">
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white">{totalSolved}</span>
              <span className="text-sm text-gray-500">/ {totalProblems}</span>
            </div>
            <svg className="w-full h-full transform -rotate-90">
              {/* Background circle */}
              <circle cx="96" cy="96" r="80" stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="none" />
              {/* Easy Arc */}
              <circle cx="96" cy="96" r="80" stroke="#10b981" strokeWidth="12" fill="none" 
                strokeDasharray={`${(solvedCounts.easy || 0) / totalProblems * 502} 502`} 
                strokeLinecap="round" className="transition-all duration-1000 ease-out" />
              {/* Medium Arc (offset by Easy) */}
              <circle cx="96" cy="96" r="80" stroke="#eab308" strokeWidth="12" fill="none" 
                strokeDasharray={`${(solvedCounts.medium || 0) / totalProblems * 502} 502`} 
                strokeDashoffset={-((solvedCounts.easy || 0) / totalProblems * 502)}
                strokeLinecap="round" className="transition-all duration-1000 ease-out" />
              {/* Hard Arc (offset by Easy+Medium) */}
              <circle cx="96" cy="96" r="80" stroke="#ef4444" strokeWidth="12" fill="none" 
                strokeDasharray={`${(solvedCounts.hard || 0) / totalProblems * 502} 502`} 
                strokeDashoffset={-(((solvedCounts.easy || 0) + (solvedCounts.medium || 0)) / totalProblems * 502)}
                strokeLinecap="round" className="transition-all duration-1000 ease-out" />
            </svg>
          </div>

          <div className="w-full space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span>Easy</span>
              <span className="text-white font-medium">{solvedCounts.easy || 0} <span className="text-gray-500">/ {totalCounts.easy || 0}</span></span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500"></span>Medium</span>
              <span className="text-white font-medium">{solvedCounts.medium || 0} <span className="text-gray-500">/ {totalCounts.medium || 0}</span></span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span>Hard</span>
              <span className="text-white font-medium">{solvedCounts.hard || 0} <span className="text-gray-500">/ {totalCounts.hard || 0}</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
