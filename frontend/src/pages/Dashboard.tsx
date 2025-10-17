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
    <div className="min-h-screen bg-gray-50 py-8">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-7xl mx-auto px-6"
      >
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600">Monitor and manage your AI bot services</p>
        </motion.div>

        {/* Stats and Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Bots Card */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="card p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-gray-500 text-sm font-medium uppercase tracking-wide mb-3">Your Bots</p>
                <h3 className="text-5xl font-bold text-gray-900 mb-2">{stats.totalBots}</h3>
                <p className="text-gray-600 text-sm">
                  AI-powered chatbots deployed
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Bot className="w-6 h-6 text-gray-900" />
              </div>
            </div>
          </motion.div>

          {/* Platform Info Cards */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="card p-6 bg-gradient-to-br from-gray-50 to-white"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-gray-500 text-sm font-medium uppercase tracking-wide mb-3">AI Technology</p>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Google Gemini
                </h3>
                <p className="text-gray-600 text-sm">
                  Advanced language model for intelligent responses
                </p>
              </div>
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Zap className="w-6 h-6 text-gray-900" />
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="card p-6 bg-gradient-to-br from-gray-50 to-white"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-gray-500 text-sm font-medium uppercase tracking-wide mb-3">Vector Database</p>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Qdrant Cloud
                </h3>
                <p className="text-gray-600 text-sm">
                  High-performance semantic search engine
                </p>
              </div>
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <MessageSquare className="w-6 h-6 text-gray-900" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Platform Features and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <motion.div 
              className="card p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Platform Features
                </h2>
                <p className="text-sm text-gray-600">
                  Build intelligent chatbots powered by your own documents
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">Document Processing</p>
                    <p className="text-xs text-gray-600">Upload PDFs, DOCX, and TXT files to train your bot</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">Semantic Search</p>
                    <p className="text-xs text-gray-600">AI-powered context retrieval for accurate answers</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">Easy Integration</p>
                    <p className="text-xs text-gray-600">Embed chatbot widget with a single script tag</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">Instant Deployment</p>
                    <p className="text-xs text-gray-600">Go live in minutes with no coding required</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div>
            <motion.div 
              className="card p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Quick Actions
              </h2>
              <div className="space-y-2">
                <Link to="/create-bot">
                  <div className="group flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-all duration-200 border border-transparent hover:border-gray-200">
                    <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                      <Box className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">Create New Bot</span>
                  </div>
                </Link>
                <Link to="/bots">
                  <div className="group flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-all duration-200 border border-transparent hover:border-gray-200">
                    <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                      <Settings className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">Manage Bots</span>
                  </div>
                </Link>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs font-medium text-green-700">System Online</span>
                  </div>
                  <Activity className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;