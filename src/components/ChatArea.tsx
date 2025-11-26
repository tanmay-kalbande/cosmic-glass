// src/components/ChatArea.tsx

import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { Conversation, Message, AIModel } from '../types';
import { Settings, Clock, Plus, ArrowUp, ChevronDown, Menu, Share, MoreHorizontal, Sparkles } from 'lucide-react';

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
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const [mobileInput, setMobileInput] = useState('');
  const [showMobileModelDropdown, setShowMobileModelDropdown] = useState(false);

  // Model names mapping for display (duplicated from ChatInput for now to keep self-contained)
  const modelDisplayNames: Record<AIModel, string> = {
    'gemini-2.5-pro': 'Gemini 2.5 Pro',
    'gemini-2.5-flash': 'Gemini 2.5 Flash',
    'gemma-3-27b-it': 'Gemma 3',
    'mistral-large-latest': 'Mistral Large',
    'mistral-medium-latest': 'Mistral Medium',
    'mistral-small-latest': 'Mistral Small',
    'codestral-latest': 'Codestral',
    'glm-4.5-flash': 'GLM 4.5',
    'llama-3.3-70b-versatile': 'Llama 3.3',
    'openai/gpt-oss-20b': 'GPT OSS 20B',
    'gpt-oss-120b': 'GPT OSS 120B',
    'qwen-3-235b-a22b-instruct-2507': 'Qwen 3',
    'zai-glm-4.6': 'ZAI GLM 4.6',
  };

  const handleMobileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobileInput.trim() && !isLoading) {
      onSendMessage(mobileInput.trim());
      setMobileInput('');
    }
  };

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

  // State 1: No conversation is selected at all. Show the main welcome screen.
  if (!conversation) {
    return (
      <div className="chat-area">
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-center max-w-2xl mx-auto space-y-8">

            {/* Floating Astronaut */}
            <div className="flex justify-center">
              <div className="text-8xl animate-bounce-slow filter drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                👨‍🚀
              </div>
            </div>

            {/* Heading */}
            <div className="space-y-3">
              <h1 className="text-4xl font-bold text-[var(--color-text-primary)]">
                Welcome to AI Tutor
              </h1>
              <p className="text-sm text-[var(--color-text-secondary)] max-w-md mx-auto">
                Ready to explore the universe of knowledge?
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
              <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-4 text-center hover:border-[var(--color-text-secondary)] transition-colors">
                <div className="text-2xl mb-2">🎓</div>
                <div className="text-xs font-medium text-[var(--color-text-primary)]">Expert Tutor</div>
              </div>

              <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-4 text-center hover:border-[var(--color-text-secondary)] transition-colors">
                <div className="text-2xl mb-2">💡</div>
                <div className="text-xs font-medium text-[var(--color-text-primary)]">Smart Quizzes</div>
              </div>

              <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-4 text-center hover:border-[var(--color-text-secondary)] transition-colors">
                <div className="text-2xl mb-2">📊</div>
                <div className="text-xs font-medium text-[var(--color-text-primary)]">Flowcharts</div>
              </div>

              <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-4 text-center hover:border-[var(--color-text-secondary)] transition-colors">
                <div className="text-2xl mb-2">📝</div>
                <div className="text-xs font-medium text-[var(--color-text-primary)]">Smart Notes</div>
              </div>
            </div>

            {/* Good to Know - Minimalistic */}
            <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-5 text-left">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
                Good to Know
              </h3>
              <div className="space-y-2 text-xs text-[var(--color-text-secondary)]">
                <div className="flex items-start gap-2">
                  <span className="text-[var(--color-text-primary)] mt-0.5">•</span>
                  <p><strong className="text-[var(--color-text-primary)]">4 Tutor Modes:</strong> Standard, Exam Coach, Mentor, Creative</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[var(--color-text-primary)] mt-0.5">•</span>
                  <p><strong className="text-[var(--color-text-primary)]">Multiple AI Models:</strong> Gemma, ZhipuAI, Mistral, Codestral</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[var(--color-text-primary)] mt-0.5">•</span>
                  <p><strong className="text-[var(--color-text-primary)]">Offline Support:</strong> Install as PWA for offline access</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[var(--color-text-primary)] mt-0.5">•</span>
                  <p><strong className="text-[var(--color-text-primary)]">Privacy First:</strong> All data stays on your device</p>
                </div>
              </div>
            </div>

            {/* Start Tip */}
            <p className="text-xs text-[var(--color-text-secondary)]">
              Click <strong className="text-[var(--color-text-primary)]">"New chat"</strong> in the sidebar to begin
            </p>

            {/* API Key Warning */}
            {!hasApiKey && (
              <div className="p-3 bg-[var(--color-card)] border border-red-500/30 rounded-lg">
                <p className="text-xs text-red-400">
                  ⚠️ Configure your API key in settings first
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // State 2: A conversation is selected (either new and empty, or with messages).
  return (
    <div className="chat-area">
      <div
        ref={chatMessagesRef}
        className="chat-messages scroll-container relative flex flex-col"
      >
        {/* Mobile Header - Claude Style */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-[var(--color-bg)]/80 backdrop-blur-md border-b border-[var(--color-border)]">
          <button 
            onClick={onOpenSidebar}
            className="p-2 -ml-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <Menu size={20} />
          </button>
          
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors">
            <span className="font-serif text-lg font-medium text-[var(--color-text-primary)]">
              {conversation?.title || 'New Chat'}
            </span>
            <ChevronDown size={14} className="text-[var(--color-text-secondary)]" />
          </button>

          <button className="p-2 -mr-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors rounded-full border border-[var(--color-border)]">
            <Share size={16} />
          </button>
        </div>

        <div className="chat-messages-container h-full flex-1">
          {allMessages.length === 0 ? (
            // State 2a: The selected conversation is empty.
            // State 2a: The selected conversation is empty.
            <div className="h-full">
              {/* Desktop Empty State */}
              <div className="hidden lg:flex items-center justify-center h-full">
                <div className="text-center p-4 max-w-md mx-auto">
                  <div className="flex flex-col items-center gap-6">
                    <div className="text-7xl filter drop-shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                      👨‍🚀
                    </div>
                    <h2 className="text-4xl font-medium text-[var(--color-text-primary)]">
                      {(() => {
                        const hour = new Date().getHours();
                        if (hour < 12) return 'Good Morning';
                        if (hour < 17) return 'Good Afternoon';
                        return 'Good Evening';
                      })()}
                    </h2>
                  </div>
                </div>
              </div>

              {/* Mobile New Chat UI - Claude Style */}
              <div className="lg:hidden flex flex-col h-full relative justify-center">
                {/* Greeting & Input Card */}
                <div className="flex flex-col items-center justify-center px-4 w-full">
                  {/* Decorative Logo */}
                  <div className="mb-6 text-4xl animate-pulse">✨</div>

                  {/* Greeting */}
                  <h2 className="text-3xl font-serif text-[var(--color-text-primary)] text-center mb-8 leading-tight">
                    {(() => {
                      const hour = new Date().getHours();
                      if (hour < 12) return 'Good Morning,';
                      if (hour < 17) return 'Good Afternoon,';
                      return 'Good Evening,';
                    })()}
                    <br />
                    <span className="opacity-80">Friend</span>
                  </h2>

                  {/* Floating Input Card */}
                  <div className="w-full max-w-sm bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl p-4 shadow-xl">
                    <form onSubmit={handleMobileSubmit}>
                      <textarea
                        value={mobileInput}
                        onChange={(e) => setMobileInput(e.target.value)}
                        placeholder="Ask anything..."
                        className="w-full bg-transparent border-none outline-none text-[var(--color-text-primary)] placeholder-[var(--color-text-placeholder)] resize-none text-lg mb-4 min-h-[60px]"
                        rows={2}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleMobileSubmit(e);
                          }
                        }}
                      />

                      <div className="flex justify-between items-end">
                        {/* Bottom Left Actions */}
                        <div className="flex gap-2">
                          <button type="button" className="p-2 rounded-full hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] transition-colors">
                            <Plus size={20} />
                          </button>
                          <button type="button" className="p-2 rounded-full hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] transition-colors">
                            <Settings size={20} />
                          </button>
                          <button type="button" className="p-2 rounded-full hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] transition-colors">
                            <Clock size={20} />
                          </button>
                        </div>

                        {/* Bottom Right Actions */}
                        <div className="flex items-center gap-3">
                          {/* Model Selector */}
                          {currentModel && onModelChange && (
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setShowMobileModelDropdown(!showMobileModelDropdown)}
                                className="flex items-center gap-1 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                              >
                                {modelDisplayNames[currentModel]}
                                <ChevronDown size={12} />
                              </button>

                              {showMobileModelDropdown && (
                                <div className="absolute bottom-full right-0 mb-2 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl shadow-xl py-1 max-h-48 overflow-y-auto z-50 min-w-[160px]">
                                  {(Object.keys(modelDisplayNames) as AIModel[]).map((model) => (
                                    <button
                                      key={model}
                                      type="button"
                                      onClick={() => {
                                        onModelChange(model);
                                        setShowMobileModelDropdown(false);
                                      }}
                                      className={`w-full text-left px-3 py-2 text-xs transition-colors ${model === currentModel
                                        ? 'bg-[var(--color-border)] text-[var(--color-text-primary)]'
                                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'
                                        }`}
                                    >
                                      {modelDisplayNames[model]}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Send Button */}
                          <button
                            type="submit"
                            disabled={!mobileInput.trim() || isLoading}
                            className={`p-2 rounded-full transition-all ${mobileInput.trim() && !isLoading
                              ? 'bg-[var(--color-accent)] text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                              : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-placeholder)] cursor-not-allowed'
                              }`}
                          >
                            <ArrowUp size={20} strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // State 2b: The conversation has messages.
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
            
            {/* Branding Divider & Disclaimer */}
            <div className="pb-4 space-y-6">
              <div className="flex items-center justify-center gap-4 opacity-50">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-[var(--color-border)]" />
                <Sparkles size={16} className="text-[var(--color-accent)] animate-pulse" />
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-[var(--color-border)]" />
              </div>
              
              <p className="text-center text-xs text-[var(--color-text-placeholder)] font-medium">
                Responses may contain mistakes. Please verify important information.
              </p>
            </div>
          )}
          <div ref={messagesEndRef} className="h-1 flex-shrink-0" />
        </div>
      </div>

      <div className={`chat-input-container mobile-chat-area ${allMessages.length === 0 ? 'hidden lg:block' : ''}`}>
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
          currentModel={currentModel}
          onModelChange={onModelChange}
        />
      </div>
    </div>
  );
}
