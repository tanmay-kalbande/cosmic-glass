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
  }, []);

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
          <div className="flex justify-center">
            <div className="text-6xl">✨</div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-[var(--color-text-primary)]">
              AI Tutor
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Ask anything. Learn everything.
            </p>
          </div>

          {/* CTA */}
          {!hasApiKey && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-xs text-red-400">
                ⚠️ Configure your API key in settings first
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
        >
          <Menu size={20} />
        </button>

        <span className="text-sm font-medium text-[var(--color-text-primary)] truncate max-w-[200px]">
          {conversation?.title || 'Chat'}
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
            // Empty state - match Foxtail design
            <div className="h-full flex flex-col items-center justify-center">
              {/* Logo with spinning effect */}
              <div className="flex justify-center mb-8">
                <div className="text-5xl animate-spin" style={{ animationDuration: '3s' }}>
                  ✨
                </div>
              </div>

              {/* Greeting message */}
              <h2 className="text-3xl lg:text-4xl font-light text-[var(--color-text-primary)] text-center mb-8 tracking-wide">
                {getGreeting()}, Friend
              </h2>

              {/* Input card for empty state (Mobile only) */}
              <div className="lg:hidden w-full max-w-sm">
                <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl p-4 space-y-4">
                  <div className="text-center text-sm text-[var(--color-text-secondary)]">
                    How can I help you today?
                  </div>
                  
                  {/* Quick action buttons */}
                  <div className="flex justify-center gap-2">
                    <button className="p-2 rounded-full bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors" title="New">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                    <button className="p-2 rounded-full bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors" title="Settings">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                    <button className="p-2 rounded-full bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors" title="History">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 2m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>
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
