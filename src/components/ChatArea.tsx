import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { Conversation, Message, AIModel } from '../types';
import { Menu, ChevronDown } from 'lucide-react';

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

  // No conversation selected
  if (!conversation) {
    return (
      <div className="chat-area flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="text-center max-w-2xl mx-auto space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="text-6xl sm:text-7xl">✨</div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)]">
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

  // Conversation is selected
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
            // Empty state
            <div className="h-full flex flex-col items-center justify-center">
              {/* Desktop Empty State */}
              <div className="hidden lg:flex items-center justify-center h-full">
                <div className="text-center p-4 max-w-md mx-auto">
                  <div className="flex flex-col items-center gap-6">
                    <div className="text-6xl">✨</div>
                    <h2 className="text-3xl font-medium text-[var(--color-text-primary)]">
                      {(() => {
                        const hour = new Date().getHours();
                        if (hour < 12) return 'Good Morning';
                        if (hour < 17) return 'Good Afternoon';
                        return 'Good Evening';
                      })()}
                    </h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      Ready to learn?
                    </p>
                  </div>
                </div>
              </div>

              {/* Mobile Empty State */}
              <div className="lg:hidden flex flex-col items-center justify-center w-full">
                <div className="text-center">
                  <div className="text-5xl mb-4">✨</div>
                  <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-2">
                    {(() => {
                      const hour = new Date().getHours();
                      if (hour < 12) return 'Good Morning';
                      if (hour < 17) return 'Good Afternoon';
                      return 'Good Evening';
                    })()}
                  </h2>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Start by asking a question
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
          currentModel={currentModel}
          onModelChange={onModelChange}
        />
      </div>
    </div>
  );
}
