import { TutorMode } from '../types';

interface ModeDetectionResult {
  suggestedMode: TutorMode;
  confidence: number; // 0-1
  reason: string;
}

// Keywords for each mode
const MODE_KEYWORDS = {
  standard: [
    'learn', 'understand', 'explain', 'how does', 'what is', 'why',
    'teach me', 'tell me about', 'concept', 'theory'
  ],
  mentor: [
    'homework', 'stuck', 'help me', 'confused', 'don\'t understand',
    'struggling', 'hard to', 'difficult', 'explain like', 'eli5',
    'simple terms', 'basics', 'beginner'
  ],
  cosmic: [
    'space', 'universe', 'cosmic', 'alien', 'sci-fi', 'star wars',
    'star trek', 'galaxy', 'astronomical', 'interstellar'
  ],
  ayanokoji: [
    'efficient', 'optimal', 'calculate', 'strategic', 'manipulate',
    'psychology', 'tactical', 'logical', 'rational'
  ],
  
  // NEW MODE KEYWORDS
  innovator: [
    'innovate', 'disrupt', 'breakthrough', 'revolutionary', 'transform',
    'reimagine', 'what if', 'future', 'invent', 'create', 'design',
    '10x', 'moonshot', 'first principles', 'paradigm shift'
  ],
  strategist: [
    'decide', 'choice', 'should i', 'option', 'trade-off', 'risk',
    'probability', 'odds', 'chance', 'decision', 'weigh', 'compare',
    'pros and cons', 'expected value', 'scenario', 'outcome'
  ],
  devil: [
    'challenge', 'debate', 'argue', 'oppose', 'counter', 'critique',
    'weakness', 'flaw', 'assumption', 'prove me wrong', 'disagree',
    'test my idea', 'play devil\'s advocate'
  ],
  brainstorm: [
    'ideas', 'brainstorm', 'creative', 'generate', 'think of',
    'possibilities', 'what could', 'alternatives', 'variations',
    'wild ideas', 'out of the box', 'lateral thinking'
  ],
  coach: [
    'feeling', 'should i', 'life', 'career', 'personal', 'growth',
    'purpose', 'values', 'meaning', 'direction', 'reflection',
    'stuck in life', 'what should i do', 'self-help'
  ],
  scientist: [
    'research', 'study', 'experiment', 'hypothesis', 'test', 'prove',
    'evidence', 'data', 'scientific', 'empirical', 'method', 'analysis'
  ],
  storyteller: [
    'tell me a story', 'example', 'case study', 'history of',
    'how did', 'narrative', 'metaphor', 'analogy', 'illustrate'
  ],
  drill: [
    'push me', 'discipline', 'focus', 'no excuses', 'tough love',
    'accountability', 'strict', 'force me', 'make me', 'drill'
  ]
};

/**
 * Analyzes user's first message to suggest the best tutor mode
 */
export function detectBestMode(userMessage: string): ModeDetectionResult {
  const message = userMessage.toLowerCase().trim();
  
  // Skip detection for very short messages
  if (message.length < 10) {
    return {
      suggestedMode: 'standard',
      confidence: 0.3,
      reason: 'Message too short to detect intent'
    };
  }
  
  // Score each mode
  const scores: Record<TutorMode, number> = {
    standard: 0,
    mentor: 0,
    cosmic: 0,
    ayanokoji: 0,
    innovator: 0,
    strategist: 0,
    devil: 0,
    brainstorm: 0,
    coach: 0,
    scientist: 0,
    storyteller: 0,
    drill: 0
  };
  
  // Count keyword matches
  for (const [mode, keywords] of Object.entries(MODE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (message.includes(keyword)) {
        scores[mode as TutorMode] += 1;
      }
    }
  }
  
  // Find mode with highest score
  let bestMode: TutorMode = 'standard';
  let maxScore = scores.standard;
  
  for (const [mode, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestMode = mode as TutorMode;
    }
  }
  
  // Calculate confidence (0-1)
  const totalMatches = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = totalMatches > 0 ? maxScore / totalMatches : 0.3;
  
  // Generate reason
  const reasons: Record<TutorMode, string> = {
    standard: 'General learning question detected',
    mentor: 'Detected help-seeking language',
    cosmic: 'Detected space/sci-fi interest',
    ayanokoji: 'Detected logical/strategic thinking',
    innovator: '🚀 Detected innovation/creative thinking keywords',
    strategist: '🎲 Detected decision-making/probabilistic thinking',
    devil: '😈 Detected need for critical analysis',
    brainstorm: '💡 Detected brainstorming/ideation intent',
    coach: '🧘 Detected personal growth/reflection needs',
    scientist: '🔬 Detected research/scientific inquiry',
    storyteller: '📖 Detected storytelling/narrative preference',
    drill: '💪 Detected need for discipline/tough motivation'
  };
  
  return {
    suggestedMode: bestMode,
    confidence,
    reason: reasons[bestMode]
  };
}

/**
 * Checks if we should show mode suggestion to user
 */
export function shouldSuggestMode(
  detectionResult: ModeDetectionResult,
  currentMode: TutorMode
): boolean {
  // Don't suggest if already using the detected mode
  if (detectionResult.suggestedMode === currentMode) {
    return false;
  }
  
  // Don't suggest if it's just defaulting to standard
  if (detectionResult.suggestedMode === 'standard' && currentMode === 'standard') {
    return false;
  }
  
  // Only suggest if confidence is high enough
  return detectionResult.confidence >= 0.5;
}

/**
 * Get friendly suggestion message for UI
 */
export function getModeSuggestionMessage(mode: TutorMode): string {
  const messages: Record<TutorMode, string> = {
    standard: '📘 Want structured learning? Try Standard Tutor mode!',
    mentor: '🧑‍🏫 Need patient step-by-step help? Try Friendly Mentor mode!',
    cosmic: '🌌 Love space? Try Cosmic Nerd mode for stellar explanations!',
    ayanokoji: '😐 Want efficient, tactical answers? Try Ayanokoji mode!',
    innovator: '🚀 Want breakthrough thinking? Try The Innovator mode!',
    strategist: '🎲 Need help deciding? Try The Strategist for probabilistic analysis!',
    devil: '😈 Want your ideas challenged? Try Devil\'s Advocate mode!',
    brainstorm: '💡 Want endless creative ideas? Try Brainstorm Buddy mode!',
    coach: '🧘 Need self-reflection guidance? Try The Coach mode!',
    scientist: '🔬 Want hypothesis-driven learning? Try The Scientist mode!',
    storyteller: '📖 Learn through stories? Try The Storyteller mode!',
    drill: '💪 Need tough motivation? Try Drill Sergeant mode!'
  };
  
  return messages[mode];
}
