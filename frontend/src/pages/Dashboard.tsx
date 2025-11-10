import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Users, Bot, MessageSquare, Zap, Activity, Box, Settings, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Animation variants for Framer Motion
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      duration: 0.3
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0, scale: 0.95 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      duration: 0.4
    }
  },
  hover: {
    scale: 1.02,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  }
};

const cardVariants = {
  hover: {
    y: -4,
    boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  }
};

interface DashboardStats {
  totalBots: number;
}

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalBots: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const botsResponse = await api.get('/api/bots');
        const bots = botsResponse.data;

        setStats({
          totalBots: bots.length
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="min-h-screen py-16 bg-[#1a1a1a]" style={{
      backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
      backgroundSize: '50px 50px',
      backgroundPosition: '-1px -1px'
    }}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-[1400px] mx-auto px-8"
      >
        {/* Header Section - Centered */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <h1 className="text-6xl font-bold text-white mb-4 tracking-tight">
            Dashboard
          </h1>
          <p className="text-gray-400 text-base font-normal max-w-2xl mx-auto">Monitor and manage your AI bot services with real-time insights</p>
        </motion.div>

        {/* Stats and Info Grid - Wider spacing */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Total Bots Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            whileHover={{ scale: 1.02, y: -8 }}
            className="bg-[#2a2a2a]/60 backdrop-blur-xl border border-gray-700/30 rounded-xl p-6 relative overflow-hidden group shadow-lg hover:shadow-xl transition-all duration-500"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg">
                  <Bot className="w-6 h-6 text-black" />
                </div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Your Bots</p>
              </div>
              <h3 className="text-5xl font-bold text-white mb-2">{stats.totalBots}</h3>
              <p className="text-gray-400 text-xs font-normal">
                AI-powered chatbots deployed
              </p>
            </div>
          </motion.div>

          {/* Platform Info Cards */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            whileHover={{ scale: 1.02, y: -8 }}
            className="bg-[#2a2a2a]/60 backdrop-blur-xl border border-gray-700/30 rounded-xl p-6 relative overflow-hidden group shadow-lg hover:shadow-xl transition-all duration-500"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg">
                  <Zap className="w-6 h-6 text-black" />
                </div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">AI Technology</p>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Google Gemini
              </h3>
              <p className="text-gray-400 text-xs font-normal">
                Advanced language model
              </p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            whileHover={{ scale: 1.02, y: -8 }}
            className="bg-[#2a2a2a]/60 backdrop-blur-xl border border-gray-700/30 rounded-xl p-6 relative overflow-hidden group shadow-lg hover:shadow-xl transition-all duration-500"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg">
                  <MessageSquare className="w-6 h-6 text-black" />
                </div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Vector Database</p>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                AWS DynamoDB
              </h3>
              <p className="text-gray-400 text-xs font-normal">
                Semantic search engine
              </p>
            </div>
          </motion.div>
        </div>

        {/* Platform Features and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <motion.div 
              className="bg-[#2a2a2a]/60 backdrop-blur-xl border border-gray-700/30 rounded-2xl p-8 shadow-lg"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-3">
                  Platform Features
                </h2>
                <p className="text-sm text-gray-400 font-medium">
                  Build intelligent chatbots powered by your own documents
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <motion.div 
                  whileHover={{ scale: 1.03, y: -2 }}
                  className="flex items-start gap-4 p-5 bg-[#1a1a1a]/60 backdrop-blur-sm rounded-2xl border border-gray-700/30 shadow-md hover:shadow-xl transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white mb-2">Document Processing</p>
                    <p className="text-xs text-gray-400 font-medium">Upload PDFs, DOCX, and TXT files to train your bot</p>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.03, y: -2 }}
                  className="flex items-start gap-4 p-5 bg-[#1a1a1a]/60 backdrop-blur-sm rounded-2xl border border-gray-700/30 shadow-md hover:shadow-xl transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white mb-2">Semantic Search</p>
                    <p className="text-xs text-gray-400 font-medium">AI-powered context retrieval for accurate answers</p>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.03, y: -2 }}
                  className="flex items-start gap-4 p-5 bg-[#1a1a1a]/60 backdrop-blur-sm rounded-2xl border border-gray-700/30 shadow-md hover:shadow-xl transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white mb-2">Easy Integration</p>
                    <p className="text-xs text-gray-400 font-medium">Embed chatbot widget with a single script tag</p>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ scale: 1.03, y: -2 }}
                  className="flex items-start gap-4 p-5 bg-[#1a1a1a]/60 backdrop-blur-sm rounded-2xl border border-gray-700/30 shadow-md hover:shadow-xl transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white mb-2">Instant Deployment</p>
                    <p className="text-xs text-gray-400 font-medium">Go live in minutes with no coding required</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>

          <div>
            <motion.div 
              className="bg-[#2a2a2a]/60 backdrop-blur-xl border border-gray-700/30 rounded-2xl p-8 shadow-lg"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h2 className="text-2xl font-bold text-white mb-8">
                Quick Actions
              </h2>
              <div className="space-y-3">
                <Link to="/create-bot">
                  <motion.div 
                    whileHover={{ scale: 1.03, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    className="group flex items-center gap-4 p-4 bg-[#1a1a1a]/60 backdrop-blur-sm hover:bg-[#1a1a1a] rounded-2xl transition-all duration-300 border border-gray-700/30 hover:border-gray-600/40 shadow-md hover:shadow-xl"
                  >
                    <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Box className="w-5 h-5 text-black" />
                    </div>
                    <span className="text-sm font-bold text-white">Create New Bot</span>
                  </motion.div>
                </Link>
                <Link to="/bots">
                  <motion.div 
                    whileHover={{ scale: 1.03, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    className="group flex items-center gap-4 p-4 bg-[#1a1a1a]/60 backdrop-blur-sm hover:bg-[#1a1a1a] rounded-2xl transition-all duration-300 border border-gray-700/30 hover:border-gray-600/40 shadow-md hover:shadow-xl"
                  >
                    <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <Settings className="w-5 h-5 text-black" />
                    </div>
                    <span className="text-sm font-bold text-white">Manage Bots</span>
                  </motion.div>
                </Link>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-700/30">
                <motion.div 
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="flex items-center justify-between p-4 bg-[#1a1a1a]/60 border border-gray-700/30 rounded-2xl shadow-md backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50"></div>
                    <span className="text-sm font-bold text-green-400">System Online</span>
                  </div>
                  <Activity className="w-5 h-5 text-green-500" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;