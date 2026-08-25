import { useEffect, useState, useMemo } from 'react';
import { NavLink } from 'react-router'; // Fixed import
import { useDispatch, useSelector } from 'react-redux';
import { Video, ChevronDown, Filter, Tag, Activity, Search, Crown, Zap, Trophy, User, LogOut, Shield } from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import { logoutUser } from '../authSlice';

function Homepage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [problems, setProblems] = useState([]);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    difficulty: 'all',
    tag: 'all',
    status: 'all' 
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };



  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const { data } = await axiosClient.get('/problem/getAllProblem');
        setProblems(data);
      } catch (error) {
        console.error('Error fetching problems:', error);
      }
    };

    const fetchSolvedProblems = async () => {
      try {
        const { data } = await axiosClient.get('/problem/problemSolvedByUser');
        setSolvedProblems(data);
      } catch (error) {
        console.error('Error fetching solved problems:', error);
      }
    };

    fetchProblems();
    if (user) fetchSolvedProblems();
  }, [user]);

  const handleLogout = () => {
    dispatch(logoutUser());
    setSolvedProblems([]); // Clear solved problems on logout
  };

  const filteredProblemsBase = problems.filter(problem => {
    const difficultyMatch = filters.difficulty === 'all' || problem.difficulty === filters.difficulty;
    const tagMatch = filters.tag === 'all' || 
      (Array.isArray(problem.tags) ? problem.tags.includes(filters.tag) : problem.tags === filters.tag);
    
    let statusMatch = true;
    if (filters.status === 'solved') {
        statusMatch = solvedProblems.some(sp => sp._id === problem._id);
    } else if (filters.status === 'unsolved') {
        statusMatch = !solvedProblems.some(sp => sp._id === problem._id);
    }

    const searchMatch = problem.title.toLowerCase().includes(searchQuery.toLowerCase());

    return difficultyMatch && tagMatch && statusMatch && searchMatch;
  });

  const arrangedProblems = useMemo(() => {
    // Deterministic shuffle to ensure order appears random but is stable across refreshes
    const getHash = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
      }
      return hash;
    };
    const shuffle = (arr) => [...arr].sort((a, b) => getHash(a._id) - getHash(b._id));

    let videoPool = [];
    let premiumPool = [];
    let regularPool = [];

    filteredProblemsBase.forEach(p => {
      const hasVideo = Array.isArray(p.tags) ? p.tags.includes('video') : p.tags === 'video';
      const hasPremium = Array.isArray(p.tags) ? p.tags.includes('premium') : p.tags === 'premium';
      
      if (hasVideo) {
        videoPool.push(p);
      } else if (hasPremium) {
        premiumPool.push(p);
      } else {
        regularPool.push(p);
      }
    });

    videoPool = shuffle(videoPool);
    premiumPool = shuffle(premiumPool);
    regularPool = shuffle(regularPool);

    const arranged = [];

    // First 5 questions: 1 video, 1 regular, 2 premium, 1 regular
    if (videoPool.length > 0) arranged.push(videoPool.shift());
    if (regularPool.length > 0) arranged.push(regularPool.shift());
    if (premiumPool.length > 0) arranged.push(premiumPool.shift());
    if (premiumPool.length > 0) arranged.push(premiumPool.shift());
    if (regularPool.length > 0) arranged.push(regularPool.shift());

    // The rest of the problems
    const rest = [...videoPool, ...premiumPool, ...regularPool];
    arranged.push(...shuffle(rest));

    return arranged;
  }, [filteredProblemsBase]);

  return (
    <div className="min-h-screen bg-base-300">
      {/* Navigation Bar */}
      <nav className="navbar bg-base-100 shadow-lg px-4">
        <div className="flex-1">
<div className="flex flex-col gap-1">
  {/* Brand row */}
  <div className="flex items-center gap-3">
    <div className="bg-primary/20 text-primary px-2.5 py-1.5 rounded-lg text-base font-mono font-bold">
      &lt;/&gt;
    </div>

    <NavLink
      to="/"
      className="text-3xl font-extrabold tracking-wide"
    >
      <span className="text-white">Byte</span>
      <span className="text-primary">Code</span>
    </NavLink>
  </div>


</div>
        </div>
      
      
<div className="flex-none flex items-center gap-3">
  <NavLink to="/status" className="btn btn-sm bg-[#e2725b]/15 hover:bg-[#e2725b]/30 text-[#e2725b] border-none font-bold">
    <Zap className="w-5 h-5" /> Submissions
  </NavLink>
  <NavLink to="/leaderboard" className="btn btn-sm bg-amber-500/15 hover:bg-amber-500/30 text-amber-500 border-none font-bold flex items-center gap-1.5">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M2 22V12h6V4h8v11h6v7" />
      <path d="M8 22V12" />
      <path d="M16 22V15" />
      <path d="M0 22h24" />
    </svg>
    Leaderboard
  </NavLink>
  <div className="dropdown dropdown-end">
    {/* Trigger */}
    <div
      tabIndex={0}
      className="flex items-center gap-3 px-4 py-2 rounded-xl cursor-pointer
                 hover:bg-base-300 transition-all duration-200"
    >
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-primary/30 text-primary
                      flex items-center justify-center
                      font-extrabold text-base">
        {user?.firstName?.[0]?.toUpperCase()}
      </div>

      {/* Username */}
      <span className="text-base font-semibold tracking-wide text-white">
        {user?.firstName}
      </span>
    </div>

    {/* Dropdown */}
    <ul
      tabIndex={0}
      className="dropdown-content mt-3 p-2 w-44
                 bg-base-100 rounded-xl shadow-xl
                 transition-all duration-200"
    >
<li>
  <NavLink
    to="/profile"
    className="flex justify-between items-center w-full px-3 py-2 rounded-lg text-sm font-medium hover:bg-base-300 transition-colors mb-1"
  >
    Profile
    <User className="w-4 h-4 text-slate-500" />
  </NavLink>
</li>
<li>
  <button
    onClick={handleLogout}
    className="flex justify-between items-center w-full px-3 py-2 rounded-lg text-sm font-medium cursor-pointer hover:bg-base-300 transition-colors"
  >
    Logout
    <LogOut className="w-4 h-4 text-error" />
  </button>
</li>


      {user?.role === 'admin' && (
        <li>
          <NavLink
            to="/admin"
            className="flex justify-between items-center w-full px-3 py-2 rounded-lg text-sm font-medium hover:bg-base-300 transition-colors"
          >
            Admin
            <Shield className="w-4 h-4 text-indigo-400" />
          </NavLink>
        </li>
      )}
    </ul>
  </div>
</div>



      </nav>

      {/* Main Content */}
      <div className="container mx-auto p-4">
        {/* Filters and Search Row */}
        <div className="flex flex-wrap gap-4 mb-6 items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center flex-1">
          {/* Status Filter */}
          <div className="dropdown dropdown-hover">
            <div tabIndex={0} role="button" className="btn btn-outline border-base-300 bg-base-100 shadow-sm flex items-center gap-2 font-medium">
              <Activity className="w-4 h-4 text-primary" />
              {filters.status === 'all' ? 'All Problems' : filters.status === 'solved' ? 'Solved Problems' : 'Unsolved Problems'}
              <ChevronDown className="w-4 h-4 opacity-50" />
            </div>
            <ul tabIndex={0} className="dropdown-content z-10 menu p-2 shadow-xl bg-base-100 rounded-box w-52 border border-base-200 mt-1">
              <li><button onClick={() => handleFilterChange('status', 'all')} className={filters.status === 'all' ? 'active' : ''}>All Problems</button></li>
              <li><button onClick={() => handleFilterChange('status', 'solved')} className={filters.status === 'solved' ? 'active' : ''}>Solved Problems</button></li>
              <li><button onClick={() => handleFilterChange('status', 'unsolved')} className={filters.status === 'unsolved' ? 'active' : ''}>Unsolved Problems</button></li>
            </ul>
          </div>

          {/* Difficulty Filter */}
          <div className="dropdown dropdown-hover">
            <div tabIndex={0} role="button" className="btn btn-outline border-base-300 bg-base-100 shadow-sm flex items-center gap-2 font-medium">
              <Filter className="w-4 h-4 text-secondary" />
              {filters.difficulty === 'all' ? 'All Difficulties' : filters.difficulty.charAt(0).toUpperCase() + filters.difficulty.slice(1)}
              <ChevronDown className="w-4 h-4 opacity-50" />
            </div>
            <ul tabIndex={0} className="dropdown-content z-10 menu p-2 shadow-xl bg-base-100 rounded-box w-52 border border-base-200 mt-1">
              <li><button onClick={() => handleFilterChange('difficulty', 'all')} className={filters.difficulty === 'all' ? 'active' : ''}>All Difficulties</button></li>
              <li><button onClick={() => handleFilterChange('difficulty', 'easy')} className={`text-success font-semibold ${filters.difficulty === 'easy' ? 'active' : ''}`}>Easy</button></li>
              <li><button onClick={() => handleFilterChange('difficulty', 'medium')} className={`text-warning font-semibold ${filters.difficulty === 'medium' ? 'active' : ''}`}>Medium</button></li>
              <li><button onClick={() => handleFilterChange('difficulty', 'hard')} className={`text-error font-semibold ${filters.difficulty === 'hard' ? 'active' : ''}`}>Hard</button></li>
            </ul>
          </div>

          {/* Tags Filter */}
          <div className="dropdown dropdown-hover">
            <div tabIndex={0} role="button" className="btn btn-outline border-base-300 bg-base-100 shadow-sm flex items-center gap-2 font-medium">
              <Tag className="w-4 h-4 text-accent" />
              {filters.tag === 'all' ? 'All Tags' : filters.tag === 'video' ? 'Video Available' : filters.tag.charAt(0).toUpperCase() + filters.tag.slice(1)}
              <ChevronDown className="w-4 h-4 opacity-50" />
            </div>
            <ul tabIndex={0} className="dropdown-content z-10 p-4 shadow-xl bg-base-100 rounded-box w-96 border border-base-200 mt-1 max-h-80 overflow-y-auto overflow-x-hidden thin-scroll">
              <div className="grid grid-cols-2 gap-x-6 relative">
                {/* Vertical Divider */}
                <div className="absolute inset-y-1 left-1/2 w-px bg-base-content/10 -translate-x-1/2"></div>
                
                {/* Left Column */}
                <div className="flex flex-col gap-1 menu p-0">
                  <li><button onClick={() => handleFilterChange('tag', 'all')} className={filters.tag === 'all' ? 'active' : ''}>All Tags</button></li>
                  <li><button onClick={() => handleFilterChange('tag', 'premium')} className={`bg-yellow-500/15 hover:bg-yellow-500/30 text-yellow-500 font-bold flex justify-between items-center ${filters.tag === 'premium' ? 'border border-yellow-500' : ''}`}>Premium <Crown className="w-4 h-4 inline"/></button></li>
                  <li><button onClick={() => handleFilterChange('tag', 'video')} className={`bg-blue-500/15 hover:bg-blue-500/30 text-blue-500 font-bold mb-2 flex justify-between items-center ${filters.tag === 'video' ? 'border border-blue-500' : ''}`}>Video Available <Video className="w-4 h-4 inline"/></button></li>
                  {['array', 'backtracking', 'binarySearch', 'bitManipulation', 'dp', 'graph'].map(tag => (
                    <li key={tag}>
                      <button onClick={() => handleFilterChange('tag', tag)} className={filters.tag === tag ? 'active' : ''}>
                        {tag.charAt(0).toUpperCase() + tag.slice(1)}
                      </button>
                    </li>
                  ))}
                </div>

                {/* Right Column */}
                <div className="flex flex-col gap-1 menu p-0">
                  {['greedy', 'heap', 'linkedList', 'math', 'queue', 'stack', 'string', 'tree', 'twoPointers'].map(tag => (
                    <li key={tag}>
                      <button onClick={() => handleFilterChange('tag', tag)} className={filters.tag === tag ? 'active' : ''}>
                        {tag.charAt(0).toUpperCase() + tag.slice(1)}
                      </button>
                    </li>
                  ))}
                </div>
              </div>
            </ul>
          </div>
          </div>

          {/* Right Side Group */}
          <div className="flex gap-4 items-center ml-auto flex-nowrap">
            {/* Search Bar */}
            <div className="form-control min-w-[200px] max-w-xs">
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <Search className="w-5 h-5 text-slate-400" />
                </div>
                <input 
                  type="text" 
                  placeholder="Search questions" 
                  className="input w-full pl-10 rounded-xl bg-base-100 shadow-sm border border-base-300 focus:border-primary focus:bg-base-100 focus:ring-1 focus:ring-primary h-10 text-base-content placeholder-base-content/60"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

          {/* Solved Stats */}
          <div className="flex items-center gap-3 px-4 py-2 bg-base-100 rounded-xl shadow-sm border border-base-300 whitespace-nowrap">
            <div 
              className="radial-progress text-success border-4 border-base-300" 
              style={{
                "--value": problems.length > 0 ? Math.round((solvedProblems.length / problems.length) * 100) : 0, 
                "--size": "1.75rem", 
                "--thickness": "4px"
              }} 
              role="progressbar"
            ></div>
            <span className="text-sm font-semibold text-slate-400">
              <span className="text-slate-200">{solvedProblems.length}</span> / {problems.length} Solved
            </span>
          </div>
          </div>
        </div>

        {/* Problems List */}
        <div className="grid gap-4">
          {arrangedProblems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(problem => (
            <div key={problem._id} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <h2 className="card-title flex items-center gap-2">
                    <NavLink to={`/problem/${problem._id}`} className="hover:text-primary">
                      {problem.title}
                    </NavLink>
                    {(Array.isArray(problem.tags) ? problem.tags.includes("premium") : problem.tags === "premium") && (
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500/15 text-yellow-500" title="Premium Problem">
                        <Crown className="w-3.5 h-3.5" />
                      </div>
                    )}
                    {(Array.isArray(problem.tags) ? problem.tags.includes("video") : problem.tags === "video") && (
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/15 text-blue-500" title="Video Solution Available">
                        <Video className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </h2>
                  {solvedProblems.some(sp => sp._id === problem._id) && (
                    <div className="badge badge-success gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Solved
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap mt-2 items-center w-full">
                  <div className={`badge ${getDifficultyBadgeColor(problem.difficulty)}`}>
                    {problem.difficulty}
                  </div>
                  {Array.isArray(problem.tags) ? problem.tags.filter(t => t !== 'premium' && t !== 'video').map(tag => (
                    <div key={tag} className="badge badge-info">{tag}</div>
                  )) : (
                    problem.tags !== 'premium' && problem.tags !== 'video' && <div className="badge badge-info">{problem.tags}</div>
                  )}

                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {arrangedProblems.length > 0 && (
          <div className="flex justify-center mt-8">
            <div className="join shadow-md">
              <button 
                className="join-item btn btn-outline border-base-300" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                « Previous
              </button>
              <div className="join-item btn bg-base-100 border-base-300 pointer-events-none">
                Page {currentPage} of {Math.ceil(arrangedProblems.length / itemsPerPage)}
              </div>
              <button 
                className="join-item btn btn-outline border-base-300" 
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(arrangedProblems.length / itemsPerPage), p + 1))}
                disabled={currentPage === Math.ceil(arrangedProblems.length / itemsPerPage)}
              >
                Next »
              </button>
            </div>
          </div>
        )}
        
        {arrangedProblems.length === 0 && (
          <div className="text-center py-12 text-base-content/50">
            <h3 className="text-xl font-semibold">No problems found</h3>
            <p>Try adjusting your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const getDifficultyBadgeColor = (difficulty) => {
  switch (difficulty.toLowerCase()) {
    case 'easy': return 'badge-success';
    case 'medium': return 'badge-warning';
    case 'hard': return 'badge-error';
    default: return 'badge-neutral';
  }
};

export default Homepage;