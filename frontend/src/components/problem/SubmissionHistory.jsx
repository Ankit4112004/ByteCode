import { useState, useEffect } from 'react';
import axiosClient from '../../utils/axiosClient';
import Editor from '@monaco-editor/react';

const SubmissionHistory = ({ problemId }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(`/problem/submittedProblem/${problemId}`);
        if (Array.isArray(response.data)) {
          setSubmissions(response.data);
        } else {
          setSubmissions([]);
        }
        setError(null);
      } catch (err) {
        setError('Failed to fetch submission history');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [problemId]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'badge-success';
      case 'wrong': return 'badge-error';
      case 'error': return 'badge-warning';
      case 'pending': return 'badge-info';
      default: return 'badge-neutral';
    }
  };

  const formatMemory = (memory) => {
    if (memory < 1024) return `${memory} kB`;
    return `${(memory / 1024).toFixed(2)} MB`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
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
    <div className="w-full">
      {submissions.length === 0 ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400/90 shadow-sm mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium tracking-wide text-sm">No submissions yet</span>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="table table-sm table-zebra w-full">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Language</th>
                  <th>Status</th>
                  <th>Runtime</th>
                  <th>Memory</th>
                  <th>Test Cases</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...submissions].reverse().map((sub, index) => (
                  <tr key={sub._id}>
                    <td>{index + 1}</td>
                    <td className="font-mono">{sub.language}</td>
                    <td>
                      <span className={`badge ${getStatusColor(sub.status)}`}>
                        {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                      </span>
                    </td>
                    
                    <td className="font-mono">{sub.runtime}sec</td>
                    <td className="font-mono">{formatMemory(sub.memory)}</td>
                    <td className="font-mono">{sub.testCasesPassed}/{sub.testCasesTotal}</td>
                    <td>{formatDate(sub.createdAt)}</td>
                    <td>
                      <button 
                        className="px-3 py-1.5 text-xs font-semibold rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors"
                        onClick={() => setSelectedSubmission(sub)}
                      >
                        Code
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-sm text-gray-500">
            Showing {submissions.length} submissions
          </p>
        </>
      )}

      {/* Code View Modal */}
      {selectedSubmission && (
        <div className="modal modal-open bg-base-300/80 backdrop-blur-sm" onClick={() => setSelectedSubmission(null)}>
          <div className="modal-box w-11/12 max-w-5xl p-0 overflow-hidden border border-base-content/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 bg-base-200/50 border-b border-base-content/10 relative">
              <button 
                className="btn btn-sm btn-error text-white absolute right-4 top-4 shadow-sm"
                onClick={() => setSelectedSubmission(null)}
              >
                Close
              </button>
              <h3 className="font-bold text-lg mb-4 pr-20 flex items-center gap-3">
                <span>Submission Details</span>
                <span className="text-sm font-normal px-3 py-1 bg-base-300/80 border border-base-content/10 rounded-md font-mono">{selectedSubmission.language}</span>
              </h3>
              
              <div className="flex flex-wrap gap-2">
                <span className={`badge ${getStatusColor(selectedSubmission.status)}`}>
                  {selectedSubmission.status}
                </span>
                <span className="badge badge-outline">
                  Runtime: {selectedSubmission.runtime}s
                </span>
                <span className="badge badge-outline">
                  Memory: {formatMemory(selectedSubmission.memory)}
                </span>
                <span className="badge badge-outline">
                  Passed: {selectedSubmission.testCasesPassed}/{selectedSubmission.testCasesTotal}
                </span>
              </div>
              
              {selectedSubmission.errorMessage && (
                <div className="alert alert-error mt-4 shadow-sm">
                  <div>
                    <span>{selectedSubmission.errorMessage}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ height: '500px' }} className="w-full bg-[#1e1e1e] [&_*]:!cursor-default [&_.monaco-editor_.cursor]:!hidden">
              <Editor
                height="100%"
                language={selectedSubmission.language?.toLowerCase() === 'c++' ? 'cpp' : selectedSubmission.language?.toLowerCase()}
                value={selectedSubmission.code}
                theme="vs-dark"
                options={{
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontLigatures: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  readOnly: true,
                  readOnlyMessage: { value: "" },
                  wordWrap: 'on',
                  padding: { top: 16, bottom: 16 },
                  domReadOnly: true,
                  automaticLayout: true,
                  scrollbar: { alwaysConsumeMouseWheel: false },
                  renderLineHighlight: "none",
                  cursorBlinking: "none",
                  selectionHighlight: false,
                  occurrencesHighlight: false
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionHistory;