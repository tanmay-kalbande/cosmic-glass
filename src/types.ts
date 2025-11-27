export type TutorMode = 
  | 'standard' 
  | 'mentor' 
  | 'cosmic' 
  | 'ayanokoji'
  | 'innovator'      
  | 'strategist'     
  | 'devil'          
  | 'brainstorm'     
  | 'coach'          
  | 'scientist'      
  | 'storyteller'    
  | 'drill';         

// Expanded Model IDs
export type AIModel =
  // Google
  | 'gemini-2.5-pro'
  | 'gemini-2.5-flash'
  | 'gemma-3-27b-it'
  // Mistral
  | 'mistral-large-latest'
  | 'mistral-medium-latest'
  | 'mistral-small-latest'
  | 'codestral-latest'
  // Zhipu
  | 'glm-4.5-flash'
  // Groq
  | 'llama-3.3-70b-versatile'
  | 'openai/gpt-oss-20b' // Specific Groq ID
  // Cerebras
  | 'gpt-oss-120b'
  | 'qwen-3-235b-a22b-instruct-2507'
  | 'zai-glm-4.6';

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  isPinned?: boolean;
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  model?: AIModel;
  isEditing?: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  sourceConversationId?: string;
}

export interface APISettings {
  googleApiKey: string;
  zhipuApiKey: string;
  mistralApiKey: string;
  groqApiKey: string; 
  cerebrasApiKey: string; 
  selectedModel: AIModel;
  selectedTutorMode: TutorMode;
}

export interface StudySession {
  id: string;
  conversationId: string;
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  score: number;
  totalQuestions: number;
  isCompleted: boolean;
  createdAt: Date;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  userAnswer?: number;
  isCorrect?: boolean;
}

// Flowchart types
export type NodeType = 'start' | 'process' | 'decision' | 'end' | 'topic' | 'concept';

export interface FlowchartNode {
  id: string;
  type: NodeType;
  label: string;
  description?: string;
  position: { x: number; y: number };
  style?: {
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
  };
}

export interface FlowchartEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  style?: {
    strokeColor?: string;
    strokeWidth?: number;
    animated?: boolean;
  };
}

export interface Flowchart {
  id: string;
  title: string;
  description?: string;
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
  createdAt: Date;
  updatedAt: Date;
  sourceConversationId?: string;
  thumbnail?: string;
}

export interface FlowchartViewport {
  x: number;
  y: number;
  zoom: number;
}
