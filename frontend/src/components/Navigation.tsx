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
    <nav className="bg-white/70 backdrop-blur-2xl border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
      <div className="max-w-[1600px] mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-gray-900 font-bold text-2xl tracking-tight">
                  PrayogAI
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/dashboard')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  location.pathname === '/dashboard'
                    ? 'bg-gradient-to-br from-gray-900 to-gray-700 text-white shadow-lg shadow-gray-900/20'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/60 backdrop-blur-sm'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={() => navigate('/create-bot')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  location.pathname === '/create-bot'
                    ? 'bg-gradient-to-br from-gray-900 to-gray-700 text-white shadow-lg shadow-gray-900/20'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/60 backdrop-blur-sm'
                }`}
              >
                <Plus className="w-4 h-4" />
                Create Bot
              </button>
              <button
                onClick={() => navigate('/bots')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  location.pathname === '/bots'
                    ? 'bg-gradient-to-br from-gray-900 to-gray-700 text-white shadow-lg shadow-gray-900/20'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/60 backdrop-blur-sm'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                My Bots
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/50 rounded-xl shadow-md backdrop-blur-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
              <span className="text-green-700 text-xs font-bold">Active</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 text-gray-600 hover:text-gray-900 hover:bg-white/60 backdrop-blur-sm hover:shadow-md"
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
