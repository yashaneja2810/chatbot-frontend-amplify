import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, LayoutGrid, Sparkles, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-black/80 backdrop-blur-2xl border-b border-blue-900/20 sticky top-0 z-50 shadow-lg shadow-blue-500/5">
      <div className="max-w-[1600px] mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-white font-bold text-2xl tracking-tight">
                  PrayogAI
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/dashboard')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  location.pathname === '/dashboard'
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-blue-900/20 backdrop-blur-sm'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={() => navigate('/create-bot')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  location.pathname === '/create-bot'
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-blue-900/20 backdrop-blur-sm'
                }`}
              >
                <Plus className="w-4 h-4" />
                Create Bot
              </button>
              <button
                onClick={() => navigate('/bots')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  location.pathname === '/bots'
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-blue-900/20 backdrop-blur-sm'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                My Bots
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-900/20 border border-blue-800/30 rounded-xl shadow-md backdrop-blur-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-lg shadow-blue-500/50"></div>
              <span className="text-blue-400 text-xs font-bold">Active</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 text-gray-400 hover:text-white hover:bg-blue-900/20 backdrop-blur-sm hover:shadow-md"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
