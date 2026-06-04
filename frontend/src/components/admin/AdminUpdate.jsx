import { useEffect, useState } from 'react';
import axiosClient from '../../utils/axiosClient'
import { NavLink } from 'react-router';

const AdminUpdate = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const { data } = await axiosClient.get('/problem/getAllProblem');
      setProblems(data);
    } catch (err) {
      setError('Failed to fetch problems');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error shadow-lg my-4">
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-8 max-w-7xl">
      <div className="mb-8 border-b border-white/10 pb-4">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          Update Problems
        </h1>
        <p className="text-gray-400 mt-2 text-sm">Select a problem to edit its title, description, templates, or test cases.</p>
      </div>

      <div className="bg-[#151515] border border-white/5 shadow-2xl rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-xs uppercase bg-black/40 text-gray-400 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">#</th>
                <th className="px-6 py-4 font-bold tracking-wider">Title</th>
                <th className="px-6 py-4 font-bold tracking-wider">Difficulty</th>
                <th className="px-6 py-4 font-bold tracking-wider">Tags</th>
                <th className="px-6 py-4 font-bold tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {problems.map((problem, index) => (
                <tr key={problem._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4 font-semibold text-gray-200">{problem.title}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      problem.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                      problem.difficulty === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 
                      'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {problem.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(problem.tags) ? problem.tags : [problem.tags]).map(tag => (
                        tag && <span key={tag} className="px-2.5 py-1 rounded bg-[#2a2a2a] text-xs font-medium text-gray-300 border border-white/5">{tag}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <NavLink 
                      to={`/admin/edit/${problem._id}`}
                      className="bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-white px-4 py-2 rounded-lg font-bold text-xs transition-all border border-amber-500/20 hover:shadow-lg hover:shadow-amber-500/20 flex items-center justify-center gap-2 ml-auto w-fit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      Edit Problem
                    </NavLink>
                  </td>
                </tr>
              ))}
              {problems.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No problems found in the database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUpdate;
