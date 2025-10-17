import React, { useState, useCallback } from "react";
import { Upload, FileText, Loader2, CheckCircle2, XCircle, AlertCircle, Trash2, Sparkles, Bot, ArrowRight } from "lucide-react";
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
    <div className="min-h-screen bg-white">
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          <motion.div 
            variants={itemVariants}
            className="mb-8 border-b border-gray-200 pb-6"
          >
            <h1 className="text-2xl font-semibold text-gray-900">
              Create a New AI Bot
            </h1>
            <p className="text-gray-600 mt-2">
              Upload your company documents to create a custom AI bot that can answer questions about your business.
            </p>
          </motion.div>

          {/* Main content grid */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start"
          >
            {/* Left side - Bot creation form or success message */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              {!botCreated ? (
                <>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                        Bot Name
                      </label>
                      <input
                        type="text"
                        id="companyName"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Enter a name for your bot"
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-lg p-8 text-center ${
                        isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400"
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
                        <div className="w-12 h-12 rounded-full bg-blue-50 mx-auto flex items-center justify-center">
                          <Upload className="w-6 h-6 text-blue-500" />
                        </div>

                        <div>
                          <label
                            htmlFor="file-upload"
                            className="inline-flex text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                          >
                            <span>Upload PDF files</span>
                          </label>
                          <p className="text-sm text-gray-500 mt-1">or drag and drop</p>
                          <p className="text-xs text-gray-400 mt-2">Maximum file size: 10MB</p>
                        </div>
                      </div>
                    </div>

                    {files.length > 0 && (
                      <div className="space-y-3 mt-4">
                        {files.map((file) => (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={file.id}
                            className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-blue-500" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                <p className="text-xs text-gray-500">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {file.status === "uploading" && (
                                <div className="w-32 h-1 rounded-full bg-gray-200 overflow-hidden">
                                  <div
                                    className="h-full bg-blue-500 transition-all duration-300"
                                    style={{ width: `${file.progress}%` }}
                                  />
                                </div>
                              )}

                              {file.status === "completed" && (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                              )}

                              {file.status === "error" && (
                                <XCircle className="w-5 h-5 text-red-500" />
                              )}

                              <button
                                onClick={() => removeFile(file.id)}
                                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                              >
                                <Trash2 className="w-4 h-4 text-gray-400" />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {error && (
                      <div className="flex items-center gap-2 text-red-500 bg-red-50 px-4 py-2 rounded-lg mt-4">
                        <AlertCircle className="w-5 h-5" />
                        <p className="text-sm">{error}</p>
                      </div>
                    )}

                    <button
                      onClick={handleCreateBot}
                      disabled={isCreating}
                      className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium mt-6 ${
                        isCreating
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-black text-white hover:bg-gray-800"
                      }`}
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
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h2 className="text-2xl font-bold">Bot Created Successfully!</h2>
                  <p className="text-gray-600">Your bot is ready to use.</p>
                </div>
              )}
            </div>

            {/* Right side - Chat widget */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden sticky top-8">
              {createdBotId ? (
                <>
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Test Your Bot - {companyName}</h3>
                    <p className="text-sm text-gray-600">Start a conversation with your bot to test its responses</p>
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
                  <div>
                    <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Your chat widget will appear here after creating the bot</p>
                  </div>
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