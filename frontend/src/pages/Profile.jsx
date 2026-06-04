import React, { useEffect, useState } from 'react';
import axiosClient from '../utils/axiosClient';
import { useSelector } from 'react-redux';
import { NavLink } from 'react-router';

// Helper to format date "YYYY-MM-DD"
const formatDate = (date) => {
  const d = new Date(date);
  const month = '' + (d.getMonth() + 1);
  const day = '' + d.getDate();
  const year = d.getFullYear();
  return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
};

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

  const { totalCounts, solvedCounts, solvedByTag, recentSubmissions, activity } = stats;

  const totalProblems = (totalCounts.easy || 0) + (totalCounts.medium || 0) + (totalCounts.hard || 0) || 1;
  const totalSolved = (solvedCounts.easy || 0) + (solvedCounts.medium || 0) + (solvedCounts.hard || 0);
  const solvedPercentage = Math.round((totalSolved / totalProblems) * 100);

  // Generate last 365 days for the heatmap
  const today = new Date();
  const days = [];
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({
      dateStr: formatDate(d),
      dayOfWeek: d.getDay()
    });
  }

  // Create an activity map: { 'YYYY-MM-DD': count }
  const activityMap = {};
  activity.forEach(item => {
    activityMap[item._id] = item.count;
  });

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const monthsData = [];
  let currentMonthStr = "";
  let currentMonthArray = [];

  days.forEach(day => {
    const month = day.dateStr.slice(0, 7); // "YYYY-MM"
    if (month !== currentMonthStr) {
      if (currentMonthArray.length > 0) {
        monthsData.push({ monthStr: currentMonthStr, days: currentMonthArray });
      }
      currentMonthStr = month;
      currentMonthArray = [];
    }
    currentMonthArray.push(day);
  });
  if (currentMonthArray.length > 0) {
    monthsData.push({ monthStr: currentMonthStr, days: currentMonthArray });
  }

  // Compute max streak and active days
  let maxStreak = 0;
  let currentStreak = 0;
  let lastDate = null;
  const sortedActivity = [...activity].sort((a,b) => new Date(a._id) - new Date(b._id));
  sortedActivity.forEach(item => {
    if (!lastDate) {
      currentStreak = 1;
    } else {
      const diff = Math.floor((new Date(item._id) - new Date(lastDate)) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }
    }
    if (currentStreak > maxStreak) maxStreak = currentStreak;
    lastDate = item._id;
  });
  const totalActiveDays = activity.length;
  const totalSubmissions = activity.reduce((acc, curr) => acc + curr.count, 0);

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
            <div className="w-px h-12 bg-white/10"></div>
            <div className="text-center">
              <div className="text-3xl font-black text-white mb-1">{maxStreak}</div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">Max Streak</div>
            </div>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
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

        {/* TOPICS / SKILLS */}
        <div className="bg-[#151515] rounded-xl p-6 border border-white/5 shadow-xl">
          <h2 className="text-lg font-semibold text-white mb-6">Subject Progress</h2>
          <div className="space-y-4">
            {['array', 'linkedList', 'graph', 'dp', 'premium'].map(tag => {
              const count = solvedByTag[tag] || 0;
              return (
                <div key={tag} className="flex justify-between items-center p-3 rounded-lg bg-white/5 hover:bg-white/10 transition border border-white/5">
                  <span className="capitalize text-gray-300">{tag === 'dp' ? 'Dynamic Programming' : tag === 'linkedList' ? 'Linked List' : tag === 'premium' ? 'Premium' : tag}</span>
                  <span className="text-white font-bold bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-sm">x{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* RECENT SUBMISSIONS */}
        <div className="bg-[#151515] rounded-xl p-6 border border-white/5 shadow-xl">
          <h2 className="text-lg font-semibold text-white mb-6">Recent AC</h2>
          {recentSubmissions.filter(sub => sub.status === 'accepted').slice(0, 4).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>No recent submissions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSubmissions.filter(sub => sub.status === 'accepted').slice(0, 4).map(sub => (
                <NavLink to={`/problem/${sub.problemId?._id}`} key={sub._id} className="block p-3 rounded-lg bg-white/5 hover:bg-white/10 transition border border-white/5">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-200 font-medium truncate pr-4">{sub.problemId?.title || 'Unknown Problem'}</span>
                    <span className="text-xs text-gray-500 whitespace-nowrap">{new Date(sub.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-2 flex gap-2 text-xs">
                    <span className={`px-2 py-0.5 rounded ${sub.problemId?.difficulty === 'easy' ? 'text-emerald-400 bg-emerald-400/10' : sub.problemId?.difficulty === 'medium' ? 'text-yellow-400 bg-yellow-400/10' : 'text-red-400 bg-red-400/10'}`}>
                      {sub.problemId?.difficulty || 'N/A'}
                    </span>
                    <span className="text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded capitalize">{sub.language}</span>
                  </div>
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* ACTIVITY CALENDAR */}
        <div className="lg:col-span-3 bg-[#151515] rounded-xl p-6 border border-white/5 shadow-xl overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-2">
            <h2 className="text-lg font-semibold text-white">{totalSubmissions} submissions in the past one year</h2>
            <div className="flex gap-6 text-sm text-gray-400">
              <span>Total active days: <span className="text-white font-medium">{totalActiveDays}</span></span>
              <span>Max streak: <span className="text-white font-medium">{maxStreak}</span></span>
            </div>
          </div>
          
          <div className="overflow-x-auto pb-4">
            <div className="min-w-[800px] w-full flex justify-between gap-2">
              {monthsData.map((monthData, mIdx) => {
                const mName = monthNames[parseInt(monthData.monthStr.split('-')[1], 10) - 1];
                return (
                  <div key={monthData.monthStr} className="flex flex-col gap-2">
                    <div className="grid grid-flow-col grid-rows-7 gap-[3px]">
                      {monthData.days.map((day, idx) => {
                        const count = activityMap[day.dateStr] || 0;
                        let colorClass = "bg-[#2c2c2c]"; // empty
                        if (count > 0 && count <= 2) colorClass = "bg-[#00442a]";
                        else if (count > 2 && count <= 5) colorClass = "bg-[#006d32]";
                        else if (count > 5 && count <= 10) colorClass = "bg-[#2cbb5d]";
                        else if (count > 10) colorClass = "bg-[#39d353]";
                        
                        return (
                          <div 
                            key={day.dateStr} 
                            title={`${count} submissions on ${day.dateStr}`}
                            className={`w-[12px] h-[12px] rounded-sm ${colorClass} hover:ring-1 hover:ring-[#2cbb5d] transition-all`}
                            style={idx === 0 ? { gridRowStart: day.dayOfWeek + 1 } : {}}
                          ></div>
                        );
                      })}
                    </div>
                    <div className="text-xs text-gray-500 text-center">{mName}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end gap-2 text-xs text-gray-400">
            <span>Less</span>
            <div className="w-3 h-3 rounded-sm bg-[#2c2c2c]"></div>
            <div className="w-3 h-3 rounded-sm bg-[#00442a]"></div>
            <div className="w-3 h-3 rounded-sm bg-[#006d32]"></div>
            <div className="w-3 h-3 rounded-sm bg-[#2cbb5d]"></div>
            <div className="w-3 h-3 rounded-sm bg-[#39d353]"></div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
