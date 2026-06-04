import { useState, useEffect } from 'react';
import axiosClient from '../../utils/axiosClient';
import { NavLink } from 'react-router';
import { Users, Shield, User, Loader2, CheckCircle2, Search, Trash2 } from 'lucide-react';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await axiosClient.get('/user/all');
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage({ type: 'error', text: 'Failed to load users.' });
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    setUpdatingId(userId);
    setMessage({ type: '', text: '' });

    try {
      const { data } = await axiosClient.put(`/user/role/${userId}`, { role: newRole });
      
      // Update local state
      setUsers(users.map(u => u._id === userId ? { ...u, role: data.role } : u));
      
      setMessage({ 
        type: 'success', 
        text: `User ${data.firstName} is now ${data.role === 'admin' ? 'an Admin' : 'a standard User'}.` 
      });
      
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    } catch (error) {
      console.error('Error updating role:', error);
      setMessage({ type: 'error', text: 'Failed to update user role.' });
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteUser = async (userId, firstName) => {
    if (!window.confirm(`Are you absolutely sure you want to delete ${firstName}? This action cannot be undone.`)) return;
    
    setDeletingId(userId);
    setMessage({ type: '', text: '' });

    try {
      await axiosClient.delete(`/user/${userId}`);
      
      // Remove from local state
      setUsers(users.filter(u => u._id !== userId));
      
      setMessage({ type: 'success', text: `User ${firstName} has been deleted successfully.` });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    } catch (error) {
      console.error('Error deleting user:', error);
      setMessage({ type: 'error', text: error.response?.data || 'Failed to delete user.' });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.emailId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 border-b border-white/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <NavLink 
                to="/admin"
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </NavLink>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Users className="w-8 h-8 text-cyan-400" />
                Manage Users
              </h1>
            </div>
            <p className="text-gray-400 ml-14">
              View registered users and promote them to administrators.
            </p>
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 bg-[#151515] border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>

        {/* Message Banner */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 border ${
            message.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        {/* Users Table Card */}
        <div className="bg-[#151515] border border-white/5 rounded-3xl shadow-2xl overflow-hidden relative">
          
          {loading ? (
            <div className="p-12 flex justify-center items-center">
              <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="px-6 py-4 text-sm font-semibold text-gray-300">User</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-300">Email</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-300">Role</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-300 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                        No users found matching "{searchQuery}"
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                              {user.firstName?.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-white">{user.firstName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-400">
                          {user.emailId}
                        </td>
                        <td className="px-6 py-4">
                          {user.role === 'admin' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20">
                              <Shield className="w-3.5 h-3.5" />
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-white/5 text-gray-400 border border-white/10">
                              <User className="w-3.5 h-3.5" />
                              User
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => toggleRole(user._id, user.role)}
                              disabled={updatingId === user._id || deletingId === user._id}
                              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                user.role === 'admin'
                                  ? 'text-gray-400 hover:text-white hover:bg-white/10'
                                  : 'text-cyan-400 hover:text-white bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 hover:border-cyan-500/40'
                              }`}
                            >
                              {updatingId === user._id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : user.role === 'admin' ? (
                                'Demote'
                              ) : (
                                'Promote to Admin'
                              )}
                            </button>
                            <button
                              onClick={() => deleteUser(user._id, user.firstName)}
                              disabled={deletingId === user._id || updatingId === user._id}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                              title="Delete User"
                            >
                              {deletingId === user._id ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <Trash2 className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
