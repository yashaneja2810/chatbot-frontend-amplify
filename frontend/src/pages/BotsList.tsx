import React, { useEffect, useState } from 'react';
import { MessageSquare, Calendar, FileText, Loader2, Search, Eye, Sparkles, Code2, Activity, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ChatWidget } from '../components/ChatWidget';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { deleteBot } from '../lib/botApi';

interface Bot {
  id: string;
  bot_id: string;
  name: string;
  created_at: string;
  status: 'ready' | 'processing' | 'error';
  user_id: string;
}

interface BotDocument {
  id: string;
  bot_id: string;
  filename: string;
  file_size: number;
  created_at: string;
}

export const BotsList: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [bots, setBots] = useState<Bot[]>([]);
  const [documents, setDocuments] = useState<Record<string, BotDocument[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [widgetModalBot, setWidgetModalBot] = useState<Bot | null>(null);
  const [deletingBot, setDeletingBot] = useState<string | null>(null);
  const [botToDelete, setBotToDelete] = useState<Bot | null>(null);

  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setSelectedBot(null);
      setWidgetModalBot(null);
    }
  };

  const handleDeleteBot = async (bot: Bot) => {
    setBotToDelete(bot);
  };

  const confirmDelete = async () => {
    if (!botToDelete) return;

    try {
      setDeletingBot(botToDelete.bot_id);
      await deleteBot(botToDelete.bot_id);
      setBots(bots => bots.filter(b => b.bot_id !== botToDelete.bot_id));
      setBotToDelete(null);
    } catch (err) {
      setError('Failed to delete bot. Please try again.');
    } finally {
      setDeletingBot(null);
    }
  };

  // Handle authentication state changes and user switching
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      // Clear all data when logging out
      setBots([]);
      setDocuments({});
      setSearchQuery('');
      setSelectedBot(null);
      setWidgetModalBot(null);
      setBotToDelete(null);
    } else {
      // Fetch bots whenever auth state or user changes
      fetchBots();
    }

    // Cleanup function to clear state when component unmounts or auth/user changes
    return () => {
      setBots([]);
      setDocuments({});
      setSearchQuery('');
      setSelectedBot(null);
      setWidgetModalBot(null);
      setBotToDelete(null);
    };
  }, [isAuthenticated, user, navigate]);

  const fetchBots = async () => {
    // Defensive: Always clear state before fetching
    setBots([]);
    setDocuments({});
    setSearchQuery('');
    setSelectedBot(null);
    setWidgetModalBot(null);
    setBotToDelete(null);
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<Bot[]>('/api/bots');
      const botsData = response.data;
      if (Array.isArray(botsData)) {
        setBots(botsData);
        setIsLoading(false); // Set loading false immediately after bots are loaded
        
        // Fetch documents in background (non-blocking)
        if (botsData.length > 0) {
          botsData.forEach(bot => {
            fetchBotDocuments(bot.bot_id);
          });
        }
      } else {
        setError('Invalid response format from server');
      }
    } catch (error: any) {
      const errorMessage = error.response?.status === 401 
        ? 'Session expired. Please log in again.'
        : 'Failed to fetch bots. Please try again later.';
      console.error('Error fetching bots:', error);
      setError(errorMessage);
      if (error.response?.status === 401) {
        setBots([]);
        setDocuments({});
      }
      setIsLoading(false);
    }
  };

  // Fetch documents for a specific bot (lazy loading)
  const fetchBotDocuments = async (botId: string) => {
    if (documents[botId]) return; // Already loaded
    
    try {
      const docsResponse = await api.get(`/api/bots/${botId}/documents`);
      setDocuments(prev => ({
        ...prev,
        [botId]: docsResponse.data.documents || []
      }));
    } catch (error) {
      console.error(`Error fetching documents for bot ${botId}:`, error);
      setDocuments(prev => ({
        ...prev,
        [botId]: []
      }));
    }
  };

  const filteredBots = bots.filter(bot =>
    bot.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: Bot['status']) => {
    switch (status) {
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            Ready
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200">
            <Loader2 className="w-3 h-3 animate-spin" />
            Processing
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
            Error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200">
            Unknown
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-16 px-8 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-black" />
          <span className="text-gray-600">Loading bots...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-gradient py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="space-y-10">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-5xl font-bold gradient-text mb-3">My Bots</h1>
              <p className="text-gray-600 text-lg font-medium">
                View and manage your custom AI bots
              </p>
            </div>

            <div className="flex items-center gap-4">
              {error && (
                <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-red-50/80 backdrop-blur-sm border border-red-200/50 text-red-700 shadow-lg">
                  <Activity className="w-5 h-5" />
                  <span className="text-sm font-semibold">{error}</span>
                </div>
              )}

              <div className="relative">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search bots..."
                  className="w-72 pl-12 pr-5 py-3.5 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-400 focus:bg-white text-sm text-gray-900 placeholder-gray-500 shadow-md hover:shadow-lg transition-all duration-300 font-medium"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredBots.map((bot) => (
              <div
                key={bot.bot_id}
                className="glass-card-hover overflow-hidden group"
              >
                <div className="p-8 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  {/* Header with title and status */}
                  <div className="flex items-start justify-between mb-6 relative z-10">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-2xl font-bold text-gray-900 mb-3 truncate">
                        {bot.name}
                      </h2>
                      <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">
                          {formatDate(bot.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      {getStatusBadge(bot.status)}
                    </div>
                  </div>

                  <div className="space-y-4 mb-8 relative z-10">
                    
                    {(() => {
                      const docs = documents[bot.bot_id];
                      
                      // Show loading state if documents haven't been fetched yet
                      if (docs === undefined) {
                        return (
                          <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Loading documents...</span>
                          </div>
                        );
                      }
                      
                      const realDocs = docs.filter(doc => !/^document_\d+\.txt$/.test(doc.filename));
                      
                      if (realDocs.length > 0) {
                        return (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-gray-700 text-sm font-bold">
                              <FileText className="w-4 h-4" />
                              <span>Documents ({realDocs.length})</span>
                            </div>
                            <div className="space-y-2">
                              {realDocs.map((doc) => {
                                // Format file size properly
                                const formatFileSize = (bytes: number) => {
                                  if (bytes === 0) return '';
                                  const kb = bytes / 1024;
                                  const mb = kb / 1024;
                                  if (mb >= 1) {
                                    return `${mb.toFixed(1)} MB`;
                                  } else {
                                    return `${kb.toFixed(0)} KB`;
                                  }
                                };
                                
                                return (
                                  <div
                                    key={doc.id}
                                    className="flex items-center gap-3 px-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-100/50 rounded-xl hover:bg-white hover:shadow-md transition-all duration-300"
                                  >
                                    <FileText className="w-4 h-4 text-gray-600 flex-shrink-0" />
                                    <span className="truncate flex-1 text-sm text-gray-900 font-semibold">
                                      {doc.filename}
                                    </span>
                                    {doc.file_size > 0 && (
                                      <span className="text-xs text-gray-500 font-bold whitespace-nowrap">
                                        {formatFileSize(doc.file_size)}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
                      
                      // No documents
                      return null;
                    })()}
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-3 gap-3 pt-6 border-t border-gray-200/50 relative z-10">
                    <button
                      onClick={() => setSelectedBot(bot)}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-br from-gray-900 to-gray-700 text-white hover:from-gray-800 hover:to-gray-600 rounded-xl text-sm font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Test</span>
                    </button>
                    <button
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-white/60 backdrop-blur-sm border border-gray-200/50 hover:bg-white hover:border-gray-300 rounded-xl text-sm font-bold text-gray-700 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                      onClick={() => setWidgetModalBot(bot)}
                    >
                      <Code2 className="w-4 h-4" />
                      <span>Widget</span>
                    </button>
                    <button
                      onClick={() => handleDeleteBot(bot)}
                      disabled={!!deletingBot}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 shadow-md hover:shadow-lg ${
                        deletingBot === bot.bot_id
                          ? "bg-red-100/80 backdrop-blur-sm border border-red-200/50 text-red-400 cursor-not-allowed"
                          : "bg-white/60 backdrop-blur-sm border border-red-300/50 hover:bg-red-50 hover:border-red-400 text-red-600 hover:scale-105 active:scale-95"
                      }`}
                    >
                      {deletingBot === bot.bot_id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={() => navigate('/create-bot')}
              className="glass-card-hover p-10 flex flex-col items-center justify-center gap-6 min-h-[300px] group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-700 border-2 border-gray-200/50 flex items-center justify-center group-hover:scale-110 transition-all duration-500 shadow-xl relative z-10">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <div className="text-center relative z-10">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Create New Bot</h3>
                <p className="text-sm text-gray-600 font-medium">
                  Upload documents to build a custom AI bot
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {selectedBot && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300" onClick={handleClickOutside}>
          <div className="glass-card w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-gray-200/50 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Test Bot: {selectedBot.name}
                </h3>
                <p className="text-gray-500 text-sm mt-1 font-medium">Chat with your AI assistant</p>
              </div>
              <button
                onClick={() => setSelectedBot(null)}
                className="p-2.5 hover:bg-gray-100 rounded-xl text-gray-600 transition-all duration-300 hover:scale-110 active:scale-95"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatWidget
                botId={selectedBot.bot_id}
                botName={selectedBot.name}
                companyName={selectedBot.name}
              />
            </div>
          </div>
        </div>
      )}
    {/* Delete Confirmation Modal */}
    <Modal
      isOpen={!!botToDelete}
      onClose={() => setBotToDelete(null)}
      title="Delete Bot"
    >
      {botToDelete && (
        <div className="space-y-6">
          <div>
            <p className="text-gray-700">
              Are you sure you want to delete the bot "<span className="font-semibold">{botToDelete.name}</span>"? This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setBotToDelete(null)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={!!deletingBot}
              className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-2
                ${deletingBot ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {deletingBot ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Bot
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </Modal>

    {/* Widget Embed Modal */}
    <Modal
      isOpen={!!widgetModalBot}
      onClose={() => setWidgetModalBot(null)}
      title="Embed Chatbot Widget"
    >
      {widgetModalBot && (
        <div className="space-y-4">
          <div>
            <p className="text-neutral-700 mb-2">Copy and paste this script tag into your website's <code>&lt;body&gt;</code> to embed the chatbot widget for <b>{widgetModalBot.name}</b>:</p>
            <pre className="bg-neutral-100 text-neutral-900 text-sm p-3 rounded border border-neutral-200 overflow-x-auto select-all">
{`<script 
  src="http://localhost:5173/widget/widget.js"
  data-bot-id="${widgetModalBot.bot_id}"
  data-company-name="${widgetModalBot.name}"
  data-color="#2563eb">
</script>`}
            </pre>
          </div>
          <div className="text-xs text-neutral-500 space-y-2">
            <div>
              <b>Customization options:</b>
              <ul className="list-disc list-inside ml-2">
                <li><code>data-company-name</code>: Your company name (appears in widget header)</li>
                <li><code>data-color</code>: Primary color for the widget (any valid CSS color)</li>
              </ul>
            </div>
            <div>
              <b>Features:</b>
              <ul className="list-disc list-inside ml-2">
                <li>Dark/light mode toggle</li>
                <li>Resizable window (3 sizes)</li>
                <li>Draggable chat window</li>
                <li>Structured message formatting</li>
              </ul>
            </div>
            <div>
              <b>Note:</b> This widget works for local development. For production, update the <code>src</code> URL accordingly.
            </div>
          </div>
        </div>
      )}
    </Modal>
    </div>
  );
};

export default BotsList;