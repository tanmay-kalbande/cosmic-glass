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

  // Mobile: No messages yet - show welcome screen
  if (allMessages.length === 0) {
    return (
      <div className="chat-area flex flex-col h-full lg:hidden">
        {/* Mobile Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0e0e0e] border-b border-[var(--color-border)]">
          <button
            onClick={onOpenSidebar}
            className="p-2 -ml-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-medium text-[var(--color-text-primary)]">New Chat</span>
          <div className="w-9" />
        </div>

        {/* Centered Welcome Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-32">
          {/* Logo with spin animation */}
          <div className="mb-6">
            <div className="text-5xl animate-spin" style={{ animationDuration: '3s' }}>
              ✨
            </div>
          </div>

          {/* Greeting */}
          <h2 className="text-3xl font-light text-[var(--color-text-primary)] text-center mb-3 tracking-wide">
            {getGreeting()}, Friend
          </h2>
          
          <p className="text-sm text-[var(--color-text-secondary)] text-center">
            How can I help you today?
          </p>
        </div>

        {/* Chat Input at bottom */}
        <div className="chat-input-container">
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

  // Desktop: Conversation with messages
  return (
    <div className="chat-area hidden lg:flex flex-col h-full">
      {/* Messages Area */}
      <div
        ref={chatMessagesRef}
        className="chat-messages scroll-container relative flex flex-col flex-1 overflow-y-auto"
      >
        <div className="chat-messages-container flex-1 pt-4 pb-4 px-4">
          {/* Messages */}
          <div className="space-y-8 py-6">
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

// Mobile: Conversation with messages
function MobileChatView({
  conversation,
  allMessages,
  streamingMessage,
  onOpenSidebar,
  onSaveAsNote,
  onEditMessage,
  onRegenerateResponse,
  onSendMessage,
  isLoading,
  isQuizLoading,
  isFlowchartLoading,
  hasApiKey,
  onStopGenerating,
  onGenerateQuiz,
  onGenerateFlowchart,
  canGenerateQuiz,
  canGenerateFlowchart,
  messagesEndRef,
  chatMessagesRef
}: any) {
  return (
    <div className="chat-area flex flex-col h-full lg:hidden">
      {/* Mobile Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0e0e0e] border-b border-[var(--color-border)]">
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
          <div className="space-y-6 py-4">
            {allMessages.map((message: Message) => (
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
