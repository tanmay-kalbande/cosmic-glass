import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { Conversation, Message, AIModel } from '../types';
import { Menu } from 'lucide-react';

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
  currentModel,
  onModelChange,
  onOpenSidebar,
  onSelectConversation,
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const [isMobileNewChatCreated, setIsMobileNewChatCreated] = useState(false);

  // Auto-create new chat on mobile on first load
  useEffect(() => {
    const isMobile = window.innerWidth < 1024;
    if (isMobile && !conversation && !isMobileNewChatCreated) {
      onNewConversation();
      setIsMobileNewChatCreated(true);
    }
  }, [conversation, isMobileNewChatCreated, onNewConversation]);

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
            // Empty state - Beautiful welcome screen
            <div className="h-full flex flex-col items-center justify-center px-4">
              {/* Animated Logo */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="w-16 h-16 bg-[var(--color-card)] rounded-2xl flex items-center justify-center p-3 border border-[var(--color-border)] shadow-lg">
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
              
              <p className="text-base lg:text-lg text-[var(--color-text-secondary)] text-center mb-8 max-w-md">
                How can I help you learn today?
              </p>

              {/* Quick suggestion cards - Desktop only */}
              <div className="hidden lg:grid grid-cols-2 gap-3 w-full max-w-2xl mb-8">
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

              {/* Mobile tip */}
              <div className="lg:hidden w-full max-w-md">
                <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4 text-center">
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Type your question below to start learning
                  </p>
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

      {/* Chat Input */}
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
    </div>
  );
}
