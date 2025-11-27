import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Square, ClipboardCheck, GitBranch, Loader2, Paperclip, ArrowUp, MoreHorizontal, X } from 'lucide-react';
import type { AIModel } from '../types';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  isQuizLoading: boolean;
  isFlowchartLoading: boolean;
  disabled?: boolean;
  onStopGenerating: () => void;
  onGenerateQuiz: () => void;
  onGenerateFlowchart: () => void;
  canGenerateQuiz: boolean;
  canGenerateFlowchart: boolean;
}

export function ChatInput({
  onSendMessage,
  isLoading,
  isQuizLoading,
  isFlowchartLoading,
  disabled = false,
  onStopGenerating,
  onGenerateQuiz,
  onGenerateFlowchart,
  canGenerateQuiz,
  canGenerateFlowchart,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [showMobileActions, setShowMobileActions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle mobile keyboard visibility - Keep input above keyboard
  useEffect(() => {
    let isKeyboardOpen = false;

    const handleFocus = () => {
      if (window.innerWidth <= 768 && containerRef.current) {
        isKeyboardOpen = true;
        // Force input to scroll into view
        setTimeout(() => {
          containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 300);
      }
    };

    const handleBlur = () => {
      isKeyboardOpen = false;
    };

    const handleResize = () => {
      if (isKeyboardOpen && containerRef.current && window.innerWidth <= 768) {
        containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    };

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('focus', handleFocus);
      textarea.addEventListener('blur', handleBlur);
    }

    window.addEventListener('resize', handleResize);

    return () => {
      if (textarea) {
        textarea.removeEventListener('focus', handleFocus);
        textarea.removeEventListener('blur', handleBlur);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && !disabled) {
      onSendMessage(input.trim());
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [input, isLoading, disabled, onSendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setInput(prev => `${prev}${prev ? '\n' : ''}${text}`);
      setTimeout(() => textareaRef.current?.focus(), 0);
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handlePlusClick = () => {
    fileInputRef.current?.click();
  };

  const handleQuizClick = () => {
    onGenerateQuiz();
    setShowMobileActions(false);
  };

  const handleFlowchartClick = () => {
    onGenerateFlowchart();
    setShowMobileActions(false);
  };

  const canSend = input.trim() && !disabled;

  return (
    <div ref={containerRef} className="w-full max-w-3xl mx-auto px-4 pb-2 sm:pb-2">
      {/* Stop generating button */}
      {isLoading && (
        <div className="flex justify-center mb-3">
          <button
            onClick={onStopGenerating}
            className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-card)] border border-[var(--color-border)] rounded-full text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-gray-600 transition-all touch-target shadow-sm"
          >
            <Square className="w-3 h-3 fill-current" />
            <span>Stop</span>
          </button>
        </div>
      )}

      {/* Mobile Actions Menu with closing animation */}
      {showMobileActions && (
        <div 
          className="lg:hidden mb-3 p-3 bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-lg"
          style={{
            animation: 'slideUpFadeIn 0.3s ease-out forwards'
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">Actions</span>
            <button
              onClick={() => setShowMobileActions(false)}
              className="p-1 rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors"
            >
              <X className="w-4 h-4 text-[var(--color-text-secondary)]" />
            </button>
          </div>
          <div className="space-y-2">
            <button
              onClick={handleQuizClick}
              disabled={!canGenerateQuiz || isQuizLoading || isLoading}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                !canGenerateQuiz
                  ? 'opacity-30 cursor-not-allowed bg-[var(--color-bg-secondary)]'
                  : 'bg-[var(--color-bg-secondary)] hover:bg-[var(--color-border)] active:scale-95'
              }`}
            >
              {isQuizLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ClipboardCheck className="w-5 h-5" />
              )}
              <div className="flex-1 text-left">
                <div className="text-sm font-semibold text-[var(--color-text-primary)]">Generate Quiz</div>
                <div className="text-xs text-[var(--color-text-secondary)]">Test your knowledge</div>
              </div>
            </button>

            <button
              onClick={handleFlowchartClick}
              disabled={!canGenerateFlowchart || isFlowchartLoading || isLoading}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                !canGenerateFlowchart
                  ? 'opacity-30 cursor-not-allowed bg-[var(--color-bg-secondary)]'
                  : 'bg-[var(--color-bg-secondary)] hover:bg-[var(--color-border)] active:scale-95'
              }`}
            >
              {isFlowchartLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <GitBranch className="w-5 h-5" />
              )}
              <div className="flex-1 text-left">
                <div className="text-sm font-semibold text-[var(--color-text-primary)]">Generate Flowchart</div>
                <div className="text-xs text-[var(--color-text-secondary)]">Visualize concepts</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Input form */}
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center gap-2 p-3 bg-[var(--color-card)] border border-[var(--color-border)] rounded-2xl shadow-lg focus-within:ring-1 focus-within:ring-[var(--color-border)] transition-all"
      >
        {/* Left attachment button */}
        <button
          type="button"
          onClick={handlePlusClick}
          className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] rounded-lg transition-colors flex-shrink-0"
          title="Attach file"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".txt,.md,.js,.ts,.jsx,.tsx,.py,.html,.css,.json"
          className="hidden"
        />

        {/* Text area */}
        <div className="flex-1 min-w-0 py-1">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message AI Tutor..."
            disabled={disabled || isLoading}
            className="w-full max-h-[100px] bg-transparent border-none outline-none text-[var(--color-text-primary)] placeholder-[var(--color-text-placeholder)] resize-none text-sm leading-relaxed"
            rows={1}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          />
        </div>

        {/* Right actions - Desktop only */}
        <div className="hidden lg:flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={onGenerateQuiz}
            disabled={!canGenerateQuiz || isQuizLoading || isLoading}
            className={`p-1.5 rounded-lg transition-colors ${!canGenerateQuiz ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
            title="Generate Quiz"
          >
            {isQuizLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onGenerateFlowchart}
            disabled={!canGenerateFlowchart || isFlowchartLoading || isLoading}
            className={`p-1.5 rounded-lg transition-colors ${!canGenerateFlowchart ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
            title="Generate Flowchart"
          >
            {isFlowchartLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitBranch className="w-4 h-4" />}
          </button>
        </div>

        {/* Mobile Actions Button */}
        <button
          type="button"
          onClick={() => setShowMobileActions(!showMobileActions)}
          className="lg:hidden p-2 rounded-lg transition-colors bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex-shrink-0"
          title="More actions"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {/* Send button */}
        <button
          type="submit"
          disabled={!canSend || isLoading}
          className={`p-2 rounded-lg transition-all duration-200 flex-shrink-0 ${!canSend || isLoading
            ? 'bg-[var(--color-bg-secondary)] text-[var(--color-text-placeholder)] cursor-not-allowed'
            : 'bg-[#D4704F] hover:bg-[#E08050] text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
            }`}
          title="Send message (Shift+Enter for new line)"
        >
          <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </form>
    </div>
  );
}
