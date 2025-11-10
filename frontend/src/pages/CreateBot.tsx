import React, { useState, useCallback } from "react";
import { Upload, FileText, Loader2, CheckCircle2, XCircle, AlertCircle, Trash2, Sparkles, Bot } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ChatWidget } from "../components/ChatWidget";
import { createBot } from "../lib/botApi";
import { useAuth } from "../context/AuthContext";
import { motion } from 'framer-motion';

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
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    }
  }
};

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: "uploading" | "processing" | "completed" | "error";
  progress: number;
  file: File;
}

export const CreateBot: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [companyName, setCompanyName] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [botCreated, setBotCreated] = useState(false);
  const [createdBotId, setCreatedBotId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const handleFiles = useCallback((selectedFiles: File[]) => {
    const pdfFiles = selectedFiles.filter((file) => file.type === "application/pdf");

    pdfFiles.forEach((file) => {
      const fileId = Date.now().toString() + Math.random();
      const newFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        status: "completed",
        progress: 100,
        file,
      };
      setFiles((prev) => [...prev, newFile]);
    });
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files) {
      const selectedFiles = Array.from(e.dataTransfer.files);
      handleFiles(selectedFiles);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  };

  const removeFile = (fileId: string) => {
    setFiles((files) => files.filter((file) => file.id !== fileId));
  };

  const handleCreateBot = async () => {
    if (!companyName) {
      setError("Please enter a company name");
      return;
    }

    if (files.length === 0) {
      setError("Please upload at least one PDF file");
      return;
    }

    setError(null);
    setIsCreating(true);

    try {
      console.log('Creating bot with:', companyName, files.length, 'files');

      const formData = new FormData();
      formData.append("company_name", companyName);
      files.forEach((file) => {
        console.log('Adding file:', file.name, file.size);
        formData.append("files", file.file);
      });

      console.log('Calling createBot API...');
      const response = await createBot(formData);
      console.log('Bot created successfully:', response);

      setCreatedBotId(response.bot_id);
      setBotCreated(true);
    } catch (err: any) {
      console.error('Error creating bot:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError(err.response?.data?.error || err.message || "Failed to create bot. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a]" style={{
      backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
      backgroundSize: '50px 50px',
      backgroundPosition: '-1px -1px'
    }}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          <motion.div
            variants={itemVariants}
            className="text-center"
          >
            <h1 className="text-4xl font-bold text-white mb-3">
              Create a New AI Bot
            </h1>
            <p className="text-gray-400 text-base">
              Upload your documents to create a custom AI bot
            </p>
          </motion.div>

          {/* Main content - centered when not created, split when created */}
          <motion.div
            variants={itemVariants}
            className={`transition-all duration-500 ${
              botCreated 
                ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' 
                : 'flex justify-center'
            }`}
          >
            {/* Left side - Bot creation form or success message */}
            <div className={`glass-card p-8 ${!botCreated ? 'max-w-2xl w-full' : ''}`}>
              {!botCreated ? (
                <>
                  <div className="mb-6">
                    <label htmlFor="companyName" className="block text-sm font-semibold text-gray-200 mb-2">
                      Bot Name
                    </label>
                    <input
                      type="text"
                      id="companyName"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Enter a name for your bot"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${isDragging
                        ? "border-white/50 bg-[#2a2a2a] scale-[1.02]"
                        : "border-gray-700/50 hover:border-gray-600/50 hover:bg-[#2a2a2a]/50"
                        }`}
                    >
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={handleFileSelect}
                        multiple
                        accept=".pdf"
                      />

                      <div className="space-y-4">
                        <div className="w-16 h-16 rounded-xl bg-white mx-auto flex items-center justify-center shadow-lg">
                          <Upload className="w-8 h-8 text-black" />
                        </div>

                        <div>
                          <label
                            htmlFor="file-upload"
                            className="inline-flex text-sm text-white hover:text-gray-200 font-semibold cursor-pointer transition-colors"
                          >
                            <span>Upload PDF files</span>
                          </label>
                          <p className="text-sm text-gray-400 mt-2">or drag and drop</p>
                          <p className="text-xs text-gray-500 mt-2">Maximum file size: 10MB</p>
                        </div>
                      </div>
                    </div>

                    {files.length > 0 && (
                      <div className="space-y-3 mt-6">
                        {files.map((file) => (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            whileHover={{ scale: 1.01 }}
                            key={file.id}
                            className="flex items-center justify-between p-4 bg-[#2a2a2a]/60 backdrop-blur-sm rounded-xl border border-gray-700/30 hover:border-gray-600/40 transition-all duration-300"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-md">
                                <FileText className="w-5 h-5 text-black" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-white">{file.name}</p>
                                <p className="text-xs text-gray-400">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {file.status === "uploading" && (
                                <div className="w-24 h-1.5 rounded-full bg-gray-700 overflow-hidden">
                                  <div
                                    className="h-full bg-white transition-all duration-300"
                                    style={{ width: `${file.progress}%` }}
                                  />
                                </div>
                              )}

                              {file.status === "completed" && (
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                              )}

                              {file.status === "error" && (
                                <XCircle className="w-5 h-5 text-red-500" />
                              )}

                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => removeFile(file.id)}
                                className="w-8 h-8 rounded-lg border border-gray-700/30 flex items-center justify-center hover:bg-red-900/30 hover:border-red-500/30 transition-colors"
                              >
                                <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                              </motion.button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 text-red-300 bg-red-900/30 backdrop-blur-sm px-4 py-3 rounded-xl mt-6 border border-red-500/30"
                      >
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm font-medium">{error}</p>
                      </motion.div>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleCreateBot}
                      disabled={isCreating}
                      className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Creating Bot...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Create Bot
                        </>
                      )}
                    </motion.button>
                  </div>
                </>
              ) : (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center space-y-4 py-8"
                >
                  <div className="w-16 h-16 rounded-2xl bg-green-500 mx-auto flex items-center justify-center shadow-xl">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Bot Created!</h2>
                  <p className="text-gray-400 text-sm">Test your bot in the chat window →</p>
                </motion.div>
              )}
            </div>

            {/* Right side - Chat widget (only shown when bot is created) */}
            {botCreated && createdBotId && (
              <div className="glass-card overflow-hidden">
                <div className="p-4 border-b border-gray-700/30">
                  <h3 className="text-lg font-semibold text-white mb-1">Test Your Bot</h3>
                  <p className="text-sm text-gray-400">{companyName}</p>
                </div>
                <ChatWidget
                  botId={createdBotId}
                  botName={companyName}
                  companyName={companyName}
                  className="h-[500px] border-none rounded-none"
                />
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateBot;