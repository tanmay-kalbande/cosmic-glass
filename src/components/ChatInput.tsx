import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Square, Paperclip, ArrowUp, Clock, Sliders, Plus } from 'lucide-react';

// ChatInput Component with new mobile design
function ChatInput({
  onSendMessage,
  isLoading,
  disabled = false,
  onStopGenerating,
  currentModel = 'Sonnet 4.5',
}) {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleSubmit = useCallback(() => {
    if (input.trim() && !isLoading && !disabled) {
      onSendMessage(input.trim());
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [input, isLoading, disabled, onSendMessage]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const resizeTextarea = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 100);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [input, resizeTextarea]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      setInput(prev => `${prev}${prev ? '\n' : ''}${text}`);
      setTimeout(() => textareaRef.current?.focus(), 0);
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handlePlusClick = () => {
    fileInputRef.current?.click();
  };

  const canSend = input.trim() && !disabled;

  return (
    <div className="w-full px-4 pb-4">
      {/* Stop generating button */}
      {isLoading && (
        <div className="flex justify-center mb-3">
          <button
            onClick={onStopGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-[#1F1F1F] border border-[#2A2A2A] rounded-full text-sm text-gray-400 hover:text-white transition-all"
          >
            <Square className="w-4 h-4 fill-current" />
            <span>Stop</span>
          </button>
        </div>
      )}

      {/* Input container */}
      <div className="space-y-3">
        {/* Main text input */}
        <div className="relative bg-[#1F1F1F] border border-[#2A2A2A] rounded-2xl p-4">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="How can I help you today?"
            disabled={disabled || isLoading}
            className="w-full bg-transparent border-none outline-none text-white placeholder-gray-500 resize-none text-base leading-relaxed"
            rows={1}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          />
        </div>

        {/* Bottom action bar */}
        <div className="flex items-center justify-between gap-3 px-2">
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".txt,.md,.js,.ts,.jsx,.tsx,.py,.html,.css,.json"
            className="hidden"
          />

          {/* Left action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePlusClick}
              className="p-2.5 text-gray-400 hover:text-white hover:bg-[#1F1F1F] rounded-lg transition-colors"
              title="Attach file"
            >
              <Plus className="w-5 h-5" />
            </button>
            
            <button
              type="button"
              className="p-2.5 text-gray-400 hover:text-white hover:bg-[#1F1F1F] rounded-lg transition-colors"
              title="Options"
            >
              <Sliders className="w-5 h-5" />
            </button>
            
            <button
              type="button"
              className="p-2.5 text-gray-400 hover:text-white hover:bg-[#1F1F1F] rounded-lg transition-colors"
              title="History"
            >
              <Clock className="w-5 h-5" />
            </button>
          </div>

          {/* Right side - Model selector and send button */}
          <div className="flex items-center gap-3">
            {/* Model selector */}
            <button
              type="button"
              className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              {currentModel}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Send button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSend || isLoading}
              className={`p-2.5 rounded-lg transition-all duration-200 ${
                !canSend || isLoading
                  ? 'bg-[#1F1F1F] text-gray-600 cursor-not-allowed'
                  : 'bg-[#D4704F] hover:bg-[#E08050] text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
              }`}
              title="Send message"
            >
              <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Demo App Component
export default function MobileChatDemo() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleSendMessage = (message) => {
    setMessages(prev => [...prev, { id: Date.now(), text: message, role: 'user' }]);
    setIsLoading(true);
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        text: 'This is a demo response. The actual AI integration would go here.', 
        role: 'assistant' 
      }]);
      setIsLoading(false);
    }, 1500);
  };

  const handleStopGenerating = () => {
    setIsLoading(false);
  };

  return (
    <div className="h-screen flex flex-col bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A2A2A]">
        <button className="p-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="text-sm font-medium">AI Tutor</span>
        <button className="p-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            {/* Logo */}
            <div className="mb-8">
              <div className="text-6xl animate-spin" style={{ animationDuration: '3s' }}>
                ✨
              </div>
            </div>

            {/* Greeting */}
            <h1 className="text-4xl font-light text-center mb-4 tracking-wide">
              {getGreeting()}, Friend
            </h1>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-4 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-[#2A2A2A] ml-auto max-w-[85%]'
                    : 'bg-[#1F1F1F] mr-auto max-w-[85%]'
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.text}</p>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-gray-400">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <span className="text-sm">Thinking...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        onStopGenerating={handleStopGenerating}
        currentModel="Sonnet 4.5"
        disabled={false}
      />
    </div>
  );
}
