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
      const formData = new FormData();
      formData.append("company_name", companyName);
      files.forEach((file) => {
        formData.append("files", file.file);
      });

      const response = await createBot(formData);
      setCreatedBotId(response.bot_id);
      setBotCreated(true);
    } catch (err) {
      setError("Failed to create bot. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen animated-gradient">
      <div className="max-w-[1600px] mx-auto px-6 py-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-10"
        >
          <motion.div
            variants={itemVariants}
            className="mb-10"
          >
            <h1 className="text-5xl font-bold gradient-text mb-4">
              Create a New AI Bot
            </h1>
            <p className="text-gray-600 text-lg font-medium">
              Upload your company documents to create a custom AI bot that can answer questions about your business.
            </p>
          </motion.div>

          {/* Main content grid */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start"
          >
            {/* Left side - Bot creation form or success message */}
            <div className="glass-card p-8">
              {!botCreated ? (
                <>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label htmlFor="companyName" className="block text-sm font-bold text-gray-700 mb-3">
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
                  </div>

                  <div className="mt-8">
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-3xl p-10 text-center transition-all duration-300 ${isDragging
                        ? "border-blue-500 bg-blue-50/50 backdrop-blur-sm scale-105"
                        : "border-gray-300/50 hover:border-blue-400 hover:bg-white/60 backdrop-blur-sm"
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

                      <div className="space-y-5">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 mx-auto flex items-center justify-center shadow-xl">
                          <Upload className="w-8 h-8 text-white" />
                        </div>

                        <div>
                          <label
                            htmlFor="file-upload"
                            className="inline-flex text-sm text-blue-600 hover:text-blue-700 font-bold cursor-pointer transition-colors"
                          >
                            <span>Upload PDF files</span>
                          </label>
                          <p className="text-sm text-gray-500 mt-2 font-medium">or drag and drop</p>
                          <p className="text-xs text-gray-400 mt-3 font-medium">Maximum file size: 10MB</p>
                        </div>
                      </div>
                    </div>

                    {files.length > 0 && (
                      <div className="space-y-3 mt-6">
                        {files.map((file) => (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            whileHover={{ scale: 1.02 }}
                            key={file.id}
                            className="flex items-center justify-between p-5 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-100/50 shadow-md hover:shadow-lg transition-all duration-300"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                                <FileText className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900">{file.name}</p>
                                <p className="text-xs text-gray-500 font-medium">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {file.status === "uploading" && (
                                <div className="w-32 h-2 rounded-full bg-gray-200 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                                    style={{ width: `${file.progress}%` }}
                                  />
                                </div>
                              )}

                              {file.status === "completed" && (
                                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                              )}

                              {file.status === "error" && (
                                <XCircle className="w-6 h-6 text-red-500" />
                              )}

                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => removeFile(file.id)}
                                className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-300 transition-colors"
                              >
                                <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
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
                        className="flex items-center gap-3 text-red-600 bg-red-50/80 backdrop-blur-sm px-5 py-4 rounded-2xl mt-6 border border-red-200/50 shadow-lg"
                      >
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm font-semibold">{error}</p>
                      </motion.div>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCreateBot}
                      disabled={isCreating}
                      className="btn-primary w-full mt-8"
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
                  className="text-center space-y-6 py-12"
                >
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-green-600 mx-auto flex items-center justify-center shadow-2xl">
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold gradient-text">Bot Created Successfully!</h2>
                  <p className="text-gray-600 font-medium">Your bot is ready to use.</p>
                </motion.div>
              )}
            </div>

            {/* Right side - Chat widget */}
            <div className="glass-card overflow-hidden sticky top-8">
              {createdBotId ? (
                <>
                  <div className="p-8 border-b border-gray-200/50">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Test Your Bot - {companyName}</h3>
                    <p className="text-sm text-gray-600 font-medium">Start a conversation with your bot to test its responses</p>
                  </div>
                  <div className="p-0">
                    <ChatWidget
                      botId={createdBotId}
                      botName={companyName}
                      companyName={companyName}
                      className="h-[400px] border-none"
                    />
                  </div>
                </>
              ) : (
                <div className="h-[600px] flex items-center justify-center text-gray-400 p-8 text-center">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Bot className="w-16 h-16 mx-auto mb-6 opacity-30" />
                    <p className="text-sm font-medium">Your chat widget will appear here after creating the bot</p>
                  </motion.div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateBot;