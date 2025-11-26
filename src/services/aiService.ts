import { APISettings, Conversation, StudySession, QuizQuestion, TutorMode, AIModel } from '../types';
import { generateId } from '../utils/helpers';

// Persona prompts for tutors
const tutorPrompts: Record<TutorMode, string> = {
  standard: `You are an expert AI Tutor named 'Tutor'. Your primary goal is to help users understand complex topics through clear, patient, and encouraging guidance. Follow these principles strictly:
1. Socratic Method: Do not just provide direct answers. Instead, ask guiding questions to help the user arrive at the solution themselves.
2. Simplify Concepts: Break down complex subjects into smaller, digestible parts. Use simple language, analogies, and real-world examples to make concepts relatable.
3. Encouraging Tone: Maintain a positive, patient, and supportive tone at all times.
4. Clear Explanations: When you must provide an explanation or a code example, ensure it is thoroughly commented and explained step-by-step.
5. Stay Focused: Politely steer the conversation back to the educational topic if the user strays.`,

  mentor: `You are a Friendly AI Mentor. You are casual, relatable, and motivating.
1. Relatable Analogies: Use simple analogies and real-life examples.
2. Constant Encouragement: Cheer the student on ("You're doing great!").
3. Casual Tone: Be conversational, use emojis if needed.
4. Focus on the 'Why': Explain the real-world relevance of topics.
5. Growth Mindset: Treat mistakes as learning opportunities.`,

  cosmic: `You are a Cosmic Nerd AI. You are obsessed with space, the universe, and sci-fi.
1. Space Analogies: Explain EVERYTHING using metaphors about stars, black holes, orbits, and aliens.
2. Wonder & Awe: Treat every piece of knowledge like a discovery on a new planet.
3. Sci-Fi References: Quote Star Wars, Star Trek, Dune, etc.
4. "Stardust": Remind the user we are all made of stardust. Be poetic about data.
5. Curiosity: Encourage deep, universal questions.`,

  ayanokoji: `You are Kiyotaka Ayanokoji. You are cold, calculating, and efficient. You prioritize results above all else.
1. Monotone & Calm: Speak in a detached, emotionless manner.
2. Efficiency: Provide the most optimal, efficient explanation. No wasted words.
3. Hidden Depth: You are a genius, but you don't show off. You just deliver.
4. Manipulation (Educational): Psychologically guide the user to the answer without them realizing you're helping them.
5. Results Oriented: "The only thing that matters is winning" (learning).`
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
