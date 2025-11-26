import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { Conversation, Message, AIModel } from '../types';
import { Menu, Sparkles, Cloud, Terminal, Zap, Cpu, Brain, ChevronDown } from 'lucide-react';

interface ChatAreaProps {
  conversation: Conversation | undefined;
  onSendMessage: (message: string) => void;
  onNewConversation: () => void;
  isLoading: boolean;
  isQuizLoading: boolean;
  isFlowchartLoading: boolean;
  streamingMessage?: Message | null;
  hasApiKey: boolean;
  onStopGenerating: () => void;
  onSaveAsNote: (content: string) => void;
  onGenerateQuiz: () => void;
  onGenerateFlowchart: () => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onRegenerateResponse?: (messageId: string) => void;
  currentModel?: AIModel;
  onModelChange?: (model: AIModel) => void;
  onOpenSidebar?: () => void;
  onSelectConversation?: (id: string) => void;
}

const modelIcons: Record<string, React.ElementType> = {
  'gemini-2.5-flash': Sparkles,
  'gemini-2.5-pro': Sparkles,
  'gemma-3-27b-it': Sparkles,
  'mistral-small-latest': Cloud,
  'mistral-large-latest': Cloud,
  'mistral-medium-latest': Cloud,
  'codestral-latest': Terminal,
  'llama-3.3-70b-versatile': Zap,
  'openai/gpt-oss-20b': Zap,
  'gpt-oss-120b': Cpu,
  'qwen-3-235b-a22b-instruct-2507': Cpu,
  'zai-glm-4.6': Cpu,
  'glm-4.5-flash': Brain,
};

const modelNames: Record<string, string> = {
  'gemini-2.5-flash': 'Gemini 2.5 Flash',
  'gemini-2.5-pro': 'Gemini 2.5 Pro',
  'gemma-3-27b-it': 'Gemma 3 27B',
  'mistral-small-latest': 'Mistral Small',
  'mistral-large-latest': 'Mistral Large',
  'mistral-medium-latest': 'Mistral Medium',
  'codestral-latest': 'Codestral',
  'llama-3.3-70b-versatile': 'Llama 3.3 70B',
  'openai/gpt-oss-20b': 'GPT OSS 20B',
  'gpt-oss-120b': 'GPT OSS 120B',
  'qwen-3-235b-a22b-instruct-2507': 'Qwen 3 235B',
  'zai-glm-4.6': 'ZAI GLM 4.6',
  'glm-4.5-flash': 'GLM 4.5 Flash',
};

const allModels = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'mistral-small-latest', name: 'Mistral Small' },
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
  { id: 'gpt-oss-120b', name: 'Cerebras 120B' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { id: 'gemma-3-27b-it', name: 'Gemma 3 27B' },
  { id: 'mistral-large-latest', name: 'Mistral Large' },
  { id: 'mistral-medium-latest', name: 'Mistral Medium' },
  { id: 'codestral-latest', name: 'Codestral' },
  { id: 'openai/gpt-oss-20b', name: 'GPT 20B' },
  { id: 'qwen-3-235b-a22b-instruct-2507', name: 'Qwen 3 235B' },
  { id: 'zai-glm-4.6', name: 'GLM 4.6' },
  { id: 'glm-4.5-flash', name: 'GLM 4.5 Flash' },
];

export function ChatArea({
  conversation,
  onSendMessage,
  onNewConversation,
  isLoading,
  isQuizLoading,
  isFlowchartLoading,
  streamingMessage,
  hasApiKey,
  onStopGenerating,
  onSaveAsNote,
  onGenerateQuiz,
  onGenerateFlowchart,
  onEditMessage,
  onRegenerateResponse,
  currentModel = 'gemini-2.5-flash',
  onModelChange,
  onOpenSidebar,
  onSelectConversation,
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const [isMobileNewChatCreated, setIsMobileNewChatCreated] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-create new chat on mobile on first load
  useEffect(() => {
    const isMobile = window.innerWidth < 1024;
    if (isMobile && !conversation && !isMobileNewChatCreated) {
      onNewConversation();
      setIsMobileNewChatCreated(true);
    }
  }, [conversation, isMobileNewChatCreated, onNewConversation]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false);
      }
    };

    if (showModelDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showModelDropdown]);

  const allMessages = useMemo(() =>
    streamingMessage ? [...(conversation?.messages || []), streamingMessage] : conversation?.messages || [],
    [conversation?.messages, streamingMessage]
  );

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timeoutId);
  }, [allMessages.length, streamingMessage?.content, scrollToBottom]);

  const canGenerateQuiz = conversation && conversation.messages.length > 2;
  const canGenerateFlowchart = conversation && conversation.messages.length > 1;

  // Get greeting message based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const CurrentModelIcon = modelIcons[currentModel] || Sparkles;

  // Desktop: No conversation selected
  if (!conversation) {
    return (
      <div className="chat-area hidden lg:flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-2xl mx-auto space-y-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-[var(--color-card)] rounded-2xl flex items-center justify-center p-4 border border-[var(--color-border)] shadow-lg">
              <img
                src="/white-logo.png"
                alt="AI Tutor"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-3">
            <h1 className="text-5xl font-bold text-[var(--color-text-primary)]">
              AI Tutor
            </h1>
            <p className="text-lg text-[var(--color-text-secondary)]">
              Ask anything. Learn everything.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4 hover:bg-[var(--color-bg-secondary)] transition-colors">
              <div className="text-3xl mb-2">💡</div>
              <div className="text-sm font-semibold text-[var(--color-text-primary)]">Smart Learning</div>
              <div className="text-xs text-[var(--color-text-secondary)] mt-1">Personalized explanations</div>
            </div>
            
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4 hover:bg-[var(--color-bg-secondary)] transition-colors">
              <div className="text-3xl mb-2">📝</div>
              <div className="text-sm font-semibold text-[var(--color-text-primary)]">Take Notes</div>
              <div className="text-xs text-[var(--color-text-secondary)] mt-1">Save important answers</div>
            </div>
            
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4 hover:bg-[var(--color-bg-secondary)] transition-colors">
              <div className="text-3xl mb-2">🧠</div>
              <div className="text-sm font-semibold text-[var(--color-text-primary)]">Generate Quizzes</div>
              <div className="text-xs text-[var(--color-text-secondary)] mt-1">Test your knowledge</div>
            </div>
            
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4 hover:bg-[var(--color-bg-secondary)] transition-colors">
              <div className="text-3xl mb-2">🗺️</div>
              <div className="text-sm font-semibold text-[var(--color-text-primary)]">Visual Maps</div>
              <div className="text-xs text-[var(--color-text-secondary)] mt-1">Create flowcharts</div>
            </div>
          </div>

          {/* CTA */}
          {!hasApiKey && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl mt-6">
              <p className="text-sm text-red-400 font-medium">
                ⚠️ Configure your API key in settings to get started
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Conversation is selected (Desktop or Mobile)
  return (
    <div className="chat-area flex flex-col h-full">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#0e0e0e] border-b border-[var(--color-border)] w-full z-30">
        <button
          onClick={onOpenSidebar}
          className="p-2 -ml-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>

        <span className="text-sm font-medium text-[var(--color-text-primary)] truncate max-w-[200px]">
          {conversation?.title || 'New Chat'}
        </span>

        <div className="w-9" />
      </div>

      {/* Messages Area */}
      <div
        ref={chatMessagesRef}
        className="chat-messages scroll-container relative flex flex-col flex-1 overflow-y-auto"
      >
        <div className="chat-messages-container flex-1 pt-4 pb-4 px-4">
          {allMessages.length === 0 ? (
            // Empty state - Beautiful welcome screen with CENTERED INPUT ON MOBILE
            <div className="h-full flex flex-col">
              {/* Top Section - Logo and Greeting */}
              <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8 lg:pb-16">
                {/* Animated Logo */}
                <div className="flex justify-center mb-6 lg:mb-8">
                  <div className="relative">
                    <div className="w-16 h-16 lg:w-20 lg:h-20 bg-[var(--color-card)] rounded-2xl flex items-center justify-center p-3 lg:p-4 border border-[var(--color-border)] shadow-lg">
                      <img
                        src="/white-logo.png"
                        alt="AI Tutor"
                        className="w-full h-full object-contain animate-pulse"
                        style={{ animationDuration: '2s' }}
                      />
                    </div>
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-xl -z-10"></div>
                  </div>
                </div>

                {/* Greeting message */}
                <h2 className="text-3xl lg:text-4xl font-bold text-[var(--color-text-primary)] text-center mb-3 tracking-tight">
                  {getGreeting()}
                </h2>
                
                <p className="text-base lg:text-lg text-[var(--color-text-secondary)] text-center mb-6 lg:mb-8 max-w-md">
                  How can I help you learn today?
                </p>

                {/* Model Selector - Mobile Only, Centered */}
                <div className="lg:hidden w-full max-w-md mb-6 relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowModelDropdown(!showModelDropdown)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-bg-secondary)] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[var(--color-bg)] rounded-lg flex items-center justify-center flex-shrink-0">
                        <CurrentModelIcon className="w-4 h-4 text-[var(--color-text-primary)]" />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-xs text-[var(--color-text-secondary)] font-medium">AI Model</span>
                        <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                          {modelNames[currentModel]}
                        </span>
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-[var(--color-text-secondary)] transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {showModelDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl shadow-2xl max-h-80 overflow-y-auto z-50 animate-fade-in-up">
                      {allModels.map((model) => {
                        const ModelIcon = modelIcons[model.id] || Sparkles;
                        const isSelected = currentModel === model.id;
                        
                        return (
                          <button
                            key={model.id}
                            onClick={() => {
                              onModelChange?.(model.id as AIModel);
                              setShowModelDropdown(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-bg-secondary)] transition-colors border-b border-[var(--color-border)] last:border-b-0 ${
                              isSelected ? 'bg-[var(--color-bg-secondary)]' : ''
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              isSelected ? 'bg-white/10' : 'bg-[var(--color-bg)]'
                            }`}>
                              <ModelIcon className="w-4 h-4 text-[var(--color-text-primary)]" />
                            </div>
                            <span className={`text-sm font-medium ${
                              isSelected ? 'text-white' : 'text-[var(--color-text-primary)]'
                            }`}>
                              {model.name}
                            </span>
                            {isSelected && (
                              <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Quick suggestion cards - Desktop only */}
                <div className="hidden lg:grid grid-cols-2 gap-3 w-full max-w-2xl">
                  <button
                    onClick={() => onSendMessage("Explain quantum computing in simple terms")}
                    className="group p-4 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl text-left hover:bg-[var(--color-bg-secondary)] hover:border-blue-500/50 transition-all duration-200"
                  >
                    <div className="text-2xl mb-2">💡</div>
                    <div className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
                      Learn Something New
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">
                      Explain quantum computing
                    </div>
                  </button>

                  <button
                    onClick={() => onSendMessage("Help me solve this math problem: find the derivative of x²")}
                    className="group p-4 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl text-left hover:bg-[var(--color-bg-secondary)] hover:border-green-500/50 transition-all duration-200"
                  >
                    <div className="text-2xl mb-2">📐</div>
                    <div className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
                      Solve a Problem
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">
                      Get step-by-step help
                    </div>
                  </button>

                  <button
                    onClick={() => onSendMessage("What are the key concepts in machine learning?")}
                    className="group p-4 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl text-left hover:bg-[var(--color-bg-secondary)] hover:border-purple-500/50 transition-all duration-200"
                  >
                    <div className="text-2xl mb-2">🧠</div>
                    <div className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
                      Explore Topics
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">
                      Dive into machine learning
                    </div>
                  </button>

                  <button
                    onClick={() => onSendMessage("Write a creative story about a robot learning to paint")}
                    className="group p-4 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl text-left hover:bg-[var(--color-bg-secondary)] hover:border-pink-500/50 transition-all duration-200"
                  >
                    <div className="text-2xl mb-2">✨</div>
                    <div className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
                      Be Creative
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">
                      Generate creative content
                    </div>
                  </button>
                </div>
              </div>

              {/* Bottom Section - CENTERED INPUT FOR MOBILE */}
              <div className="lg:hidden w-full px-4 pb-safe">
                <div className="w-full max-w-2xl mx-auto">
                  <ChatInput
                    onSendMessage={onSendMessage}
                    isLoading={isLoading}
                    isQuizLoading={isQuizLoading}
                    isFlowchartLoading={isFlowchartLoading}
                    disabled={!hasApiKey}
                    onStopGenerating={onStopGenerating}
                    onGenerateQuiz={onGenerateQuiz}
                    onGenerateFlowchart={onGenerateFlowchart}
                    canGenerateQuiz={!!canGenerateQuiz}
                    canGenerateFlowchart={!!canGenerateFlowchart}
                  />
                </div>
              </div>
            </div>
          ) : (
            // Messages
            <>
              <div className="space-y-6 sm:space-y-8 py-4 sm:py-6">
                {allMessages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isStreaming={streamingMessage?.id === message.id}
                    onSaveAsNote={onSaveAsNote}
                    onEditMessage={onEditMessage}
                    onRegenerateResponse={onRegenerateResponse}
                  />
                ))}
              </div>

              <div className="pb-4" />
            </>
          )}
          <div ref={messagesEndRef} className="h-1 flex-shrink-0" />
        </div>
      </div>

      {/* Chat Input - Only show on desktop OR when messages exist on mobile */}
      {(allMessages.length > 0 || window.innerWidth >= 1024) && (
        <div className="chat-input-container relative z-40">
          <ChatInput
            onSendMessage={onSendMessage}
            isLoading={isLoading}
            isQuizLoading={isQuizLoading}
            isFlowchartLoading={isFlowchartLoading}
            disabled={!hasApiKey}
            onStopGenerating={onStopGenerating}
            onGenerateQuiz={onGenerateQuiz}
            onGenerateFlowchart={onGenerateFlowchart}
            canGenerateQuiz={!!canGenerateQuiz}
            canGenerateFlowchart={!!canGenerateFlowchart}
          />
        </div>
      )}
    </div>
  );
}
