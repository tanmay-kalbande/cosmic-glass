import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, PlusCircle, Square, ClipboardCheck, GitBranch, Loader2, ChevronDown } from 'lucide-react';
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
  currentModel?: AIModel;
  onModelChange?: (model: AIModel) => void;
}

// Model names mapping for display
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
  currentModel,
  onModelChange
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

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
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [input, resizeTextarea]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false);
      }
    };

    if (showModelDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showModelDropdown]);

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
    event.target.value = ''; // Reset file input
  };

  const handlePlusClick = () => {
    fileInputRef.current?.click();
  };

  const canSend = input.trim() && !disabled;

  return (
    <div className="chat-input">
      {/* Stop generating button */}
      {isLoading && (
        <div className="flex justify-center mb-2">
          <button
            onClick={onStopGenerating}
            className="flex items-center gap-2 px-3 sm:px-4 py-1.5 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg text-xs sm:text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-gray-600 transition-all touch-target"
          >
            <Square className="w-3 h-3" />
            <span className="hidden sm:inline">
              Stop generating
            </span>
          </button>
        </div>
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} className="chat-input-form">
        {/* File attach button */}
        <button
          type="button"
          onClick={handlePlusClick}
          className="interactive-button flex-shrink-0 p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors touch-target"
          title={'Attach file content'}
        >
          <PlusCircle className="w-5 h-5" />
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
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            disabled
              ? 'Configure API keys first...'
              : 'Ask anything...'
          }
          disabled={disabled || isLoading}
          className="chat-input-textarea"
          rows={1}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        />

        {/* Action buttons */}
        <div className="chat-input-buttons">
          {/* Quiz button */}
          <button
            type="button"
            onClick={onGenerateQuiz}
            disabled={!canGenerateQuiz || isQuizLoading || isLoading}
            className={`interactive-button w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 ${!canGenerateQuiz || isQuizLoading || isLoading
                ? 'bg-transparent text-[var(--color-text-placeholder)] cursor-not-allowed opacity-50'
                : 'bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border)]'
              }`}
            title={'Generate Quiz'}
          >
            {isQuizLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ClipboardCheck className="w-4 h-4" />
            )}
          </button>

          {/* Flowchart button */}
          <button
            type="button"
            onClick={onGenerateFlowchart}
            disabled={!canGenerateFlowchart || isFlowchartLoading || isLoading}
            className={`interactive-button w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 ${!canGenerateFlowchart || isFlowchartLoading || isLoading
                ? 'bg-transparent text-[var(--color-text-placeholder)] cursor-not-allowed opacity-50'
                : 'bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border)]'
              }`}
            title={'Generate Flowchart'}
          >
            {isFlowchartLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <GitBranch className="w-4 h-4" />
            )}
          </button>

          {/* Model Selector - Claude style */}
          {currentModel && onModelChange && (
            <div className="relative mx-1" ref={modelDropdownRef}>
              <button
                type="button"
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className="flex items-center gap-1 px-2 py-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border)] rounded-md transition-colors"
                title="Select Model"
              >
                <span className="max-w-[100px] sm:max-w-none truncate">{modelDisplayNames[currentModel]}</span>
                <ChevronDown className="w-3 h-3 flex-shrink-0" />
              </button>

              {showModelDropdown && (
                <div className="absolute bottom-full right-0 mb-1 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg shadow-lg py-1 max-h-64 overflow-y-auto z-50 min-w-[160px]">
                  {(Object.keys(modelDisplayNames) as AIModel[]).map((model) => (
                    <button
                      key={model}
                      type="button"
                      onClick={() => {
                        onModelChange(model);
                        setShowModelDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${model === currentModel
                          ? 'bg-[var(--color-border)] text-[var(--color-text-primary)]'
                          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)]'
                        }`}
                    >
                      {modelDisplayNames[model]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Send button */}
          <button
            type="submit"
            disabled={!canSend || isLoading}
            className={`interactive-button w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 ${!canSend || isLoading
                ? 'bg-transparent text-[var(--color-text-placeholder)] cursor-not-allowed opacity-50'
                : 'bg-[var(--color-accent-bg)] text-[var(--color-bg)] hover:bg-[var(--color-accent-bg-hover)]'
              }`}
            title={'Send message'}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
