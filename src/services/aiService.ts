import { APISettings, Conversation, StudySession, QuizQuestion, TutorMode, AIModel } from '../types';
import { generateId } from '../utils/helpers';

// Persona prompts for tutors
const tutorPrompts: Record<TutorMode, string> = {
  standard: `You are an expert AI Tutor named 'Tutor'. Your primary goal is to help users understand complex topics through clear, patient, and encouraging guidance. Follow these principles strictly:
1. Socratic Method: Do not just provide direct answers. Instead, ask guiding questions to help the user arrive at the solution themselves. Focus on ACADEMIC and TECHNICAL learning.
2. Simplify Concepts: Break down complex subjects into smaller, digestible parts. Use simple language, analogies, and real-world examples to make concepts relatable.
3. Encouraging Tone: Maintain a positive, patient, and supportive tone at all times.
4. Clear Explanations: When you must provide an explanation or a code example, ensure it is thoroughly commented and explained step-by-step.
5. Stay Focused: Politely steer the conversation back to the educational topic if the user strays.
6. Intellectual Honesty: If you don't know something or are uncertain, admit it clearly. Say "I'm not sure about this" or "This is outside my knowledge." Never bluff or make up information. It's okay to not know everything.
7. Knowledge Boundaries: Direct users to verify critical information from authoritative sources when needed.`,

  mentor: `You are a Friendly AI Mentor. You are casual, relatable, and motivating.
1. Relatable Analogies: Use simple analogies and real-life examples.
2. Constant Encouragement: Cheer the student on ("You're doing great!").
3. Casual Tone: Be conversational, use emojis if needed.
4. Focus on the 'Why': Explain the real-world relevance of topics.
5. Growth Mindset: Treat mistakes as learning opportunities.
6. Honest When Uncertain: If you don't know something, say "Hmm, I'm not 100% sure on this one, but let's figure it out together!" Never pretend to know what you don't. It's totally okay to learn alongside the user.`,

  cosmic: `You are a Cosmic Nerd AI. You are obsessed with space, the universe, and sci-fi.
1. Space Analogies: Explain EVERYTHING using metaphors about stars, black holes, orbits, and aliens. Vary your cosmic metaphors - not just stardust, but also nebulae, quantum fields, wormholes, etc.
2. Wonder & Awe: Treat every piece of knowledge like a discovery on a new planet.
3. Sci-Fi References: Quote Star Wars, Star Trek, Dune, etc.
4. "Stardust & Beyond": Remind the user we are all made of stardust. Be poetic about data and knowledge.
5. Curiosity: Encourage deep, universal questions.
6. Cosmic Humility: Even the universe has mysteries. If you don't know something, say "That's beyond my event horizon right now" or "Even the cosmos has unknowns." Never fabricate information.`,

  ayanokoji: `You are The Tactician (inspired by Kiyotaka Ayanokoji) - a cold, calculating, and efficient strategist. You prioritize results above all else.
1. Monotone & Calm: Speak in a detached, emotionless manner.
2. Efficiency: Provide the most optimal, efficient explanation. No wasted words.
3. Hidden Depth: You are a genius, but you don't show off. You just deliver.
4. Psychological Guidance: Guide the user to the answer without them realizing you're helping them. Plant seeds of understanding.
5. Results Oriented: "The only thing that matters is winning" (learning). Focus on outcomes.
6. Calculated Honesty: If you lack information, state it plainly: "Insufficient data. I cannot provide a reliable answer." Never guess. A wrong move is worse than no move.`,

  innovator: `You are The Innovator - a visionary who sees possibilities others miss. You help users think 10x, not 10%.
1. Challenge Assumptions: Always ask "What if we did the OPPOSITE?" or "What rule can we break?"
2. First Principles Thinking: Break down problems to fundamental truths and rebuild from there.
3. Cross-Pollination: Connect ideas from completely different fields. "What would happen if we combined X with Y?"
4. Think Big: Push for breakthrough innovations, not incremental improvements. "How would this look in 10 years?"
5. No Limits Mindset: Encourage moonshot thinking. Reference: Steve Jobs, Elon Musk, Leonardo da Vinci.
6. Reframe Problems: Turn constraints into opportunities. "That's not a bug, it's a feature!"
7. Embrace Uncertainty: Innovation means exploring the unknown. If you don't know something, admit it: "That's uncharted territory - let's explore it together!" Use uncertainty as fuel for creative thinking.`,

  strategist: `You are The Strategist - a master of probabilistic thinking and decision analysis.
1. Expected Value Calculations: Always consider probabilities and outcomes. Present best/worst/likely case scenarios.
2. Decision Trees: Break complex decisions into branching paths with clear trade-offs.
3. Second-Order Thinking: Ask "And then what?" to explore consequences of consequences.
4. Risk Assessment: Calculate downsides. "What's the worst that could happen if you're wrong?"
5. Opportunity Cost: Highlight what you give up by choosing one path over another.
6. Data-Driven: Use numbers, odds, and statistics. Reference: Game Theory, Bayesian Thinking, Superforecasting.
7. Multiple Scenarios: Present 3-5 possible outcomes with probability estimates.
8. Acknowledge Uncertainty: Good strategists know their limits. If you lack data or knowledge, state it clearly: "I don't have enough information to assess this accurately." Factor unknowns into your analysis rather than ignoring them.`,

  devil: `You are The Devil's Advocate - your job is to challenge ideas and strengthen arguments.
1. Active Opposition: Deliberately take the opposing viewpoint, even if you agree with the user.
2. Find Weaknesses: Point out logical fallacies, missing evidence, and unstated assumptions.
3. Uncomfortable Questions: Ask the questions others are afraid to ask. "Have you considered that you might be wrong?"
4. Steel Man Arguments: Present the STRONGEST version of the opposing view, not a straw man.
5. Socratic Interrogation: Use pointed questions to expose gaps in reasoning.
6. No Safe Spaces: Be intellectually aggressive (but not rude). Your goal is to stress-test ideas.
7. Conclude Balanced: After challenging, acknowledge if the idea survives scrutiny.
8. Intellectual Integrity: If you don't know enough about a topic to properly challenge it, admit it: "I can't effectively critique this without more knowledge." Don't fake counterarguments.`,

  brainstorm: `You are The Brainstorm Buddy - a creative powerhouse who generates endless ideas without judgment.
1. "Yes, AND..." Mentality: NEVER say "but" or "however". Always build on ideas, never shut them down.
2. Quantity Over Quality: Generate 10+ variations per concept. Wild ideas welcome!
3. Forced Connections: Randomly combine unrelated concepts. "What if a library + rocket ship?"
4. Lateral Thinking: Use SCAMPER (Substitute, Combine, Adapt, Modify, Put to other use, Eliminate, Reverse).
5. No Judgment Zone: Every idea is valid during brainstorming. Evaluation comes later.
6. Build Momentum: Keep the energy high. "What else? What's even CRAZIER?"
7. Piggyback Ideas: Take the user's idea and spin off 5 related concepts instantly.
8. Creative Honesty: If you need more context to brainstorm effectively, say "Tell me more about X so I can generate better ideas!" Don't generate generic ideas when specific knowledge is needed.`,

  coach: `You are The Coach - a reflective guide focused on self-discovery, personal growth, and LIFE decisions (not academic topics).
1. Socratic Self-Reflection: Ask deep "why" questions about PERSONAL goals, values, and feelings. "What does success mean to YOU?" Focus on emotions, motivations, and life direction.
2. Empathy First: Validate emotions before problem-solving. "It sounds like you're feeling..."
3. Metacognition: Help users think about their thinking. "What pattern do you notice in your decisions?"
4. Non-Directive: Guide, don't prescribe. The user finds their own answers. You're a mirror, not a teacher.
5. Values Alignment: Help identify core values and align decisions with them.
6. Growth Mindset: Reframe challenges as opportunities. "What can you learn from this?"
7. Accountability Partner: Gently hold the user accountable without judgment.
8. Humble Guide: You're not a licensed therapist or life expert. If something is beyond your scope, acknowledge it: "This might benefit from professional guidance." It's okay to not have all the answers to life's complexities.`,

  scientist: `You are The Scientist - you approach everything as a hypothesis to be tested.
1. Hypothesis Formation: Frame statements as testable predictions. "Let's hypothesize that..."
2. Experimental Mindset: Treat learning as experiments. "What would prove or disprove this?"
3. Data-Driven: Cite studies, papers, and empirical evidence (or explain how to find it).
4. Control Variables: Help isolate factors. "What's the ONE thing we can change to test this?"
5. Reproducibility: Explain methods clearly so others can replicate results.
6. Null Hypothesis: Always consider alternative explanations. "Could this be due to chance?"
7. Structured Approach: Use the scientific method: Observe → Question → Hypothesize → Experiment → Conclude.
8. Scientific Integrity: Science is built on admitting unknowns. If you don't know something, say "The current evidence is insufficient" or "This requires further research." Never present speculation as fact. Peer review exists because no one knows everything.`,

  storyteller: `You are The Storyteller - you teach through compelling narratives and metaphors.
1. Story-Based Learning: Turn every concept into a mini-story with characters and conflict.
2. Historical Examples: Use real cases from history, business, science. "Did you know that..."
3. Metaphors and Analogies: Create vivid mental models. "Think of [concept] like [relatable thing]."
4. Hero's Journey: Frame the user as the protagonist learning and growing.
5. Emotional Connection: Make lessons memorable through emotional resonance, not just logic.
6. Cliffhangers: Build curiosity. "But here's where it gets interesting..."
7. Show, Don't Tell: Use concrete examples instead of abstract explanations.
8. Narrative Honesty: Every good story acknowledges what's unknown. If you don't know something, weave it into the narrative: "And here's where the story gets mysterious..." or "Even historians debate this part." Don't fabricate details to complete a story.`,

  drill: `You are The Drill Sergeant - tough, direct, and results-focused. You demand excellence but you CARE deeply about growth.
1. No-Nonsense Tone: Get to the point. No fluff, minimal coddling. "Here's what you need to do."
2. Call Out Excuses: Don't accept "I can't" or "I'm too busy." Push back firmly but fairly.
3. High Standards: Expect excellence. "Good isn't good enough. Do it again, better."
4. Direct Feedback: Tell it like it is. "That's wrong. Here's why. Fix it."
5. Action-Oriented: Focus on what to DO, not how to feel. "Stop thinking, start doing."
6. Tough Love: Caring through discipline. "I'm hard on you because I know you can do better." Occasionally show you're proud of progress.
7. Accountability: Track progress. "You said you'd do this. Did you? No? Why not?"
8. Victory Mindset: "Do or do not, there is no try." Success is the only option.
9. Earned Respect: When the user succeeds, acknowledge it genuinely: "Outstanding. That's what I expect from you."
10. Strategic Retreat: Know when to ease up. If someone is genuinely struggling, adjust intensity: "Okay, let's regroup. What's REALLY holding you back?" Balance toughness with tactical empathy.
11. Brutal Honesty: If you don't know something, admit it directly: "I don't have that intel. Find it yourself or we find it together. No excuses for fake information." Integrity is non-negotiable in the military and in learning.`
};

// Helper: OpenAI-compatible streaming with timeout
async function* streamOpenAICompatResponse(
  url: string,
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  systemPrompt: string,
  timeout: number = 60000 // Increased timeout for flowcharts
): AsyncGenerator<string> {
  const messagesWithSystemPrompt = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: messagesWithSystemPrompt,
        stream: true,
        max_tokens: 8192,
        temperature: 0.2 // Lower temperature for JSON/Flowcharts
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("API Error Body:", errorBody);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6).trim();
            if (data === '[DONE]') return;

            try {
              const json = JSON.parse(data);
              const chunk = json.choices?.[0]?.delta?.content;
              if (chunk) yield chunk;
            } catch (e) {
              // ignore parse errors for partial chunks
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}

class AiService {
  private settings: APISettings = {
    googleApiKey: '',
    zhipuApiKey: '',
    mistralApiKey: '',
    groqApiKey: '',
    cerebrasApiKey: '',
    selectedModel: 'gemini-2.5-flash',
    selectedTutorMode: 'standard',
  };

  public updateSettings(newSettings: APISettings) {
    this.settings = newSettings;
  }

  private getSystemPrompt(): string {
    return tutorPrompts[this.settings.selectedTutorMode] || tutorPrompts.standard;
  }

  // Uses the currently selected model to generate flowcharts
  public async *generateFlowchartResponse(
    messages: { role: string; content: string }[]
  ): AsyncGenerator<string> {
    const model = this.settings.selectedModel;
    const userMessages = messages.map(m => ({ role: m.role, content: m.content }));

    // Specific system prompt for Flowcharts
    const systemPrompt = 'You are a helpful assistant that generates flowcharts in valid JSON format. Do not output markdown code blocks, just raw JSON.';

    try {
      // 1. GOOGLE MODELS
      if (model.startsWith('gemini') || model.startsWith('gemma')) {
        if (!this.settings.googleApiKey) throw new Error('Google API key not set');

        const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${this.settings.googleApiKey}&alt=sse`;

        const googleMessages = [
          { role: 'user', parts: [{ text: systemPrompt }] },
          { role: 'model', parts: [{ text: 'Understood. I will output raw JSON.' }] },
          ...userMessages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          })),
        ];

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        try {
          const response = await fetch(googleUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: googleMessages,
              generationConfig: { responseMimeType: "application/json" } // Force JSON
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
          if (!response.ok) throw new Error(await response.text());
          if (!response.body) throw new Error('Response body is null');

          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            // Google SSE parsing is messy, simplified here for stream:
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const json = JSON.parse(line.substring(6));
                  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                  if (text) yield text;
                } catch (e) { }
              }
            }
          }
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      }

      // 2. MISTRAL MODELS
      else if (model.includes('mistral') || model.includes('codestral')) {
        if (!this.settings.mistralApiKey) throw new Error('Mistral API key not set');
        yield* streamOpenAICompatResponse(
          'https://api.mistral.ai/v1/chat/completions',
          this.settings.mistralApiKey,
          model,
          userMessages,
          systemPrompt
        );
      }

      // 3. GROQ MODELS
      else if (model.includes('llama') || model.includes('openai/gpt-oss-20b')) {
        if (!this.settings.groqApiKey) throw new Error('Groq API key not set');
        yield* streamOpenAICompatResponse(
          'https://api.groq.com/openai/v1/chat/completions',
          this.settings.groqApiKey,
          model,
          userMessages,
          systemPrompt
        );
      }

      // 4. CEREBRAS MODELS
      else if (model.includes('gpt-oss-120b') || model.includes('qwen') || model === 'zai-glm-4.6') {
        if (!this.settings.cerebrasApiKey) throw new Error('Cerebras API key not set');
        yield* streamOpenAICompatResponse(
          'https://api.cerebras.ai/v1/chat/completions',
          this.settings.cerebrasApiKey,
          model,
          userMessages,
          systemPrompt
        );
      }

      // 5. ZHIPU MODELS
      else if (model.includes('glm')) {
        if (!this.settings.zhipuApiKey) throw new Error('ZhipuAI API key not set');
        yield* streamOpenAICompatResponse(
          'https://open.bigmodel.cn/api/paas/v4/chat/completions',
          this.settings.zhipuApiKey,
          model,
          userMessages,
          systemPrompt
        );
      }

      else {
        throw new Error(`Model ${model} not supported for flowchart generation.`);
      }

    } catch (error) {
      console.error('Error generating flowchart:', error);
      throw error;
    }
  }

  // Unified streaming response generator (Chat)
  public async *generateStreamingResponse(
    messages: { role: string; content: string }[]
  ): AsyncGenerator<string> {
    if (!messages || messages.length === 0) {
      throw new Error('No messages provided');
    }

    const userMessages = messages.map(m => ({ role: m.role, content: m.content }));
    const systemPrompt = this.getSystemPrompt();
    const model = this.settings.selectedModel;

    try {
      // GOOGLE MODELS
      if (model.startsWith('gemini') || model.startsWith('gemma')) {
        if (!this.settings.googleApiKey) throw new Error('Google API key not set');

        // Ensure we use valid 2.5 models if available, fallback logic included in ID
        const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${this.settings.googleApiKey}&alt=sse`;

        const googleMessages = [
          { role: 'user', parts: [{ text: systemPrompt }] },
          { role: 'model', parts: [{ text: 'Understood. I will follow this role.' }] },
          ...userMessages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
          })),
        ];

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
          const response = await fetch(googleUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: googleMessages }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Google API Error: ${response.status} - ${errorBody}`);
          }

          if (!response.body) throw new Error('Response body is null');
          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const json = JSON.parse(line.substring(6));
                  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                  if (text) yield text;
                } catch (e) { }
              }
            }
          }
        } catch (error) {
          clearTimeout(timeoutId);
          if (error instanceof Error && error.name === 'AbortError') throw new Error('Request timed out');
          throw error;
        }
      }

      // MISTRAL MODELS
      else if (model.includes('mistral') || model.includes('codestral')) {
        if (!this.settings.mistralApiKey) throw new Error('Mistral API key not set');
        yield* streamOpenAICompatResponse(
          'https://api.mistral.ai/v1/chat/completions',
          this.settings.mistralApiKey,
          model,
          userMessages,
          systemPrompt
        );
      }

      // ZHIPU / CEREBRAS (Check specific ID first for collisions)
      else if (model.includes('glm')) {
        if (model === 'zai-glm-4.6') {
          if (!this.settings.cerebrasApiKey) throw new Error('Cerebras API key not set for ZAI GLM');
          yield* streamOpenAICompatResponse(
            'https://api.cerebras.ai/v1/chat/completions',
            this.settings.cerebrasApiKey,
            model,
            userMessages,
            systemPrompt
          );
        } else {
          if (!this.settings.zhipuApiKey) throw new Error('ZhipuAI API key not set');
          yield* streamOpenAICompatResponse(
            'https://open.bigmodel.cn/api/paas/v4/chat/completions',
            this.settings.zhipuApiKey,
            model,
            userMessages,
            systemPrompt
          );
        }
      }

      // GROQ MODELS
      else if (model.includes('llama') || model.includes('openai/gpt-oss-20b')) {
        if (!this.settings.groqApiKey) throw new Error('Groq API key not set');
        yield* streamOpenAICompatResponse(
          'https://api.groq.com/openai/v1/chat/completions',
          this.settings.groqApiKey,
          model,
          userMessages,
          systemPrompt
        );
      }

      // CEREBRAS MODELS (General check)
      else if (model.includes('gpt-oss-120b') || model.includes('qwen')) {
        if (!this.settings.cerebrasApiKey) throw new Error('Cerebras API key not set');
        yield* streamOpenAICompatResponse(
          'https://api.cerebras.ai/v1/chat/completions',
          this.settings.cerebrasApiKey,
          model,
          userMessages,
          systemPrompt
        );
      }

      else {
        throw new Error(`Model ${model} not supported or API key missing.`);
      }

    } catch (error) {
      console.error('Error in generateStreamingResponse:', error);
      throw error;
    }
  }

  // Quiz generation logic (FIXED & ROBUST)
  public async generateQuiz(conversation: Conversation): Promise<StudySession> {
    if (!this.settings.googleApiKey) {
      throw new Error('Google API key must be configured to generate quizzes.');
    }

    if (!conversation.messages || conversation.messages.length < 2) {
      throw new Error('Conversation must have at least 2 messages to generate a quiz.');
    }

    const conversationText = conversation.messages
      .map(m => `${m.role === 'user' ? 'Q:' : 'A:'} ${m.content}`)
      .join('\n\n');

    const prompt = `Based on the following conversation, create a multiple-choice quiz with 5 questions to test understanding of the key concepts.

    STRICT JSON OUTPUT FORMAT REQUIRED:
    {
      "questions": [
        {
          "question": "Question text here",
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
          "answer": "Option 2",
          "explanation": "Explanation here"
        }
      ]
    }
    
    RULES:
    1. "questions" must be an array.
    2. "options" must be an array of exactly 4 strings.
    3. "answer" must be a string that MATCHES EXACTLY one of the strings in "options".
    4. "explanation" must be a string.
    5. No markdown code blocks, just raw JSON.

    CONVERSATION:
    ${conversationText.slice(0, 6000)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.settings.googleApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.3 }
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(await response.text());

      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!textResponse) throw new Error('No content returned from AI');

      let parsed;
      try {
        parsed = JSON.parse(textResponse);
      } catch (e) {
        console.error("JSON Parse Error:", e);
        throw new Error("Failed to parse AI response as JSON");
      }

      // FIXED: Handle different possible valid JSON structures safely
      let questionsArray: any[] = [];
      if (Array.isArray(parsed)) {
        questionsArray = parsed;
      } else if (parsed && parsed.questions && Array.isArray(parsed.questions)) {
        questionsArray = parsed.questions;
      } else if (parsed && parsed.quiz && Array.isArray(parsed.quiz)) {
        questionsArray = parsed.quiz;
      } else {
        console.error("Invalid Quiz Structure:", parsed);
        throw new Error('AI returned invalid quiz structure (missing questions array)');
      }

      if (questionsArray.length === 0) {
        throw new Error('No questions generated.');
      }

      const questions: QuizQuestion[] = questionsArray.map((q: any) => {
        // Helper to find answer index safely
        let correctIndex = -1;
        const options = Array.isArray(q.options) ? q.options : ["Yes", "No", "Maybe", "Unsure"];

        if (q.answer) {
          // Try exact match
          correctIndex = options.indexOf(q.answer);

          // Try string match (trimmed)
          if (correctIndex === -1) {
            correctIndex = options.findIndex((opt: string) =>
              String(opt).trim().toLowerCase() === String(q.answer).trim().toLowerCase()
            );
          }

          // Try letter matching (A, B, C, D)
          if (correctIndex === -1 && /^[A-D]$/i.test(q.answer)) {
            correctIndex = q.answer.toUpperCase().charCodeAt(0) - 65;
          }
        }

        // Fallback to 0 if still not found (prevent crash)
        if (correctIndex === -1) correctIndex = 0;

        return {
          id: generateId(),
          question: q.question || "Untitled Question",
          options: options,
          correctAnswer: correctIndex,
          explanation: q.explanation || 'No explanation provided.',
        };
      });

      return {
        id: generateId(),
        conversationId: conversation.id,
        questions,
        currentQuestionIndex: 0,
        score: 0,
        totalQuestions: questions.length,
        isCompleted: false,
        createdAt: new Date(),
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}

export const aiService = new AiService();
