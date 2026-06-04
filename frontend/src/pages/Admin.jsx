import React from 'react';
import { Plus, Edit, Trash2, Home, RefreshCw, Zap, Video, UserPlus, Users } from 'lucide-react';
import { NavLink } from 'react-router';

function Admin() {
  // const [selectedOption, setSelectedOption] = useState(null);

  const adminOptions = [
    {
      id: 'create',
      title: 'Create Problem',
      description: 'Add a new coding problem to the platform',
      icon: Plus,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      btnClass: 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20',
      route: '/admin/create'
    },
    {
      id: 'update',
      title: 'Update Problem',
      description: 'Edit existing problems and their details',
      icon: Edit,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      btnClass: 'bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-white border border-amber-500/20 hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/20',
      route: '/admin/update'
    },
    {
      id: 'delete',
      title: 'Delete Problem',
      description: 'Remove problems from the platform',
      icon: Trash2,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      btnClass: 'bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 hover:border-rose-500 hover:shadow-lg hover:shadow-rose-500/20',
      route: '/admin/delete'
    },
    {
      id: 'video',
      title: 'Video Solutions',
      description: 'Upload and manage video explanations',
      icon: Video,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      btnClass: 'bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20',
      route: '/admin/video'
    },
    {
      id: 'create-admin',
      title: 'Create Admin',
      description: 'Register a new user with full administrative privileges',
      icon: UserPlus,
      color: 'text-fuchsia-400',
      bgColor: 'bg-fuchsia-500/10',
      btnClass: 'bg-fuchsia-500/10 hover:bg-fuchsia-500 text-fuchsia-400 hover:text-white border border-fuchsia-500/20 hover:border-fuchsia-500 hover:shadow-lg hover:shadow-fuchsia-500/20',
      route: '/admin/create-admin'
    },
    {
      id: 'manage-users',
      title: 'Manage Users',
      description: 'View all users and promote them to administrators',
      icon: Users,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      btnClass: 'bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-white border border-cyan-500/20 hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/20',
      route: '/admin/users'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight flex items-center justify-center gap-4">
            <Zap className="w-10 h-10 text-indigo-500" />
            Admin Dashboard
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Manage coding problems, video solutions, and platform configuration from your centralized command center.
          </p>
        </div>

        {/* Admin Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {adminOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <NavLink 
                to={option.route}
                key={option.id}
                className="group flex flex-col bg-[#151515] border border-white/5 rounded-3xl p-8 hover:bg-[#1a1a1a] hover:border-white/10 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-2 relative overflow-hidden"
              >
                {/* Icon */}
                <div className={`${option.bgColor} ${option.color} w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  <IconComponent size={32} strokeWidth={1.5} />
                </div>
                
                {/* Text Content */}
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-200 mb-3 group-hover:text-white transition-colors">
                    {option.title}
                  </h2>
                  <p className="text-gray-500 text-sm leading-relaxed mb-8">
                    {option.description}
                  </p>
                </div>
                
                {/* Action Button */}
                <div className={`w-full py-3 rounded-xl text-sm font-bold text-center transition-all duration-300 ${option.btnClass}`}>
                  {option.title}
                </div>
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Admin;