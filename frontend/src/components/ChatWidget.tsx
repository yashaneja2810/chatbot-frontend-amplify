import React, { useState, useRef, useEffect } from 'react';
import { Send, Minimize2, X } from 'lucide-react';
import { sendChatMessage } from '../lib/botApi';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatWidgetProps {
  botId: string;
  botName?: string;
  companyName?: string;
  isPreview?: boolean;
  onToggleMinimize?: () => void;
  onClose?: () => void;
  className?: string;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  botId,
  botName = 'AI Assistant',
  companyName = 'Chatbot',
  isPreview = false,
  onToggleMinimize,
  onClose,
  className
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hello! I'm your AI assistant. How can I help you today?`,
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      if (isPreview) {
        setTimeout(() => {
          const previewResponse: Message = {
            id: (Date.now() + 1).toString(),
            text: 'This is a preview response. In production, this bot will answer based on your uploaded documents.',
            sender: 'bot',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, previewResponse]);
          setIsTyping(false);
        }, 1000);
      } else {
        const response = await sendChatMessage(botId, userMessage.text);
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response.response,
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`bg-[#2a2a2a] border border-gray-700/30 rounded-lg shadow-2xl overflow-hidden flex flex-col ${className || 'h-[600px]'}`}>
      <div className="flex items-center justify-between p-4 bg-[#1a1a1a] border-b border-gray-700/30 relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
          <div>
            <div className="text-white text-sm font-semibold">{botName}</div>
            <div className="text-gray-400 text-xs">{companyName}</div>
          </div>
        </div>
        <div className="flex items-center gap-1 relative z-30">
          {onToggleMinimize && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleMinimize();
              }}
              className="p-1.5 hover:bg-gray-700/50 rounded transition-colors cursor-pointer"
              type="button"
            >
              <Minimize2 className="w-4 h-4 text-gray-400" />
            </button>
          )}
          {onClose && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1.5 hover:bg-gray-700/50 rounded transition-colors cursor-pointer"
              type="button"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#1a1a1a]">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2.5 ${
                message.sender === 'user'
                  ? 'bg-white text-black'
                  : 'bg-[#2a2a2a] border border-gray-700/30 text-gray-100'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.text}</p>
              <span className={`text-xs mt-1.5 block ${message.sender === 'user' ? 'text-gray-600' : 'text-gray-500'}`}>
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-[#2a2a2a] border border-gray-700/30 rounded-lg px-4 py-2.5">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-[#1a1a1a] border-t border-gray-700/30 relative z-10">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 bg-[#2a2a2a] border border-gray-700/30 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500/50 relative z-10"
            autoComplete="off"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            className="px-4 py-2.5 bg-white hover:bg-gray-100 disabled:bg-gray-700 disabled:text-gray-500 text-black rounded-lg transition-colors font-medium relative z-10"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};