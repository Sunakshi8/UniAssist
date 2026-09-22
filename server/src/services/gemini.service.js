/**
 * Thin wrapper around the Gemini REST API (generateContent).
 * Uses global fetch (Node 18+).
 */

const DEFAULT_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-2.5-pro'];
const GEMINI_MODELS = Array.from(new Set([process.env.GEMINI_MODEL, ...DEFAULT_MODELS].filter(Boolean)));

function buildPrompt({ question, contextChunks, history }) {
  const contextBlock = contextChunks.length
    ? contextChunks
        .map((c, i) => `[Source ${i + 1}: ${c.chunk.sourceTitle}]\n${c.chunk.text}`)
        .join('\n\n')
    : '(No relevant knowledge base entries were found for this question.)';

  const historyBlock = (history || [])
    .slice(-6) // last few turns for light continuity
    .map((m) => `${m.role === 'user' ? 'Student' : 'Assistant'}: ${m.content}`)
    .join('\n');

  return `You are UniAssist, a helpful and accurate college support assistant.
Answer the student's question using ONLY the context provided below.
If the answer is not contained in the context, say clearly that you don't have that information
in the knowledge base and suggest the student contact the relevant college department.
Keep answers concise and friendly. Do not make up policies, dates, or numbers.

--- CONTEXT ---
${contextBlock}
--- END CONTEXT ---

${historyBlock ? `--- RECENT CONVERSATION ---\n${historyBlock}\n--- END CONVERSATION ---\n` : ''}
Student's question: ${question}

Answer:`;
}

/**
 * @param {object} params
 * @param {string} params.question
 * @param {Array<{chunk: object, score: number}>} params.contextChunks
 * @param {Array<{role: string, content: string}>} [params.history]
 * @returns {Promise<string>} the generated answer text
 */
async function generateAnswer({ question, contextChunks, history }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in .env');
  }

  const prompt = buildPrompt({ question, contextChunks, history });
  let lastError;

  for (const modelName of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 800 },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        lastError = new Error(`Gemini API error (${response.status}): ${errText}`);
        if (response.status !== 404 && response.status !== 400) {
          throw lastError;
        }
        continue;
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';

      if (!text) {
        throw new Error('Gemini API returned an empty response');
      }

      return text.trim();
    } catch (err) {
      lastError = err;
      if (String(err.message).includes('API key not valid')) {
        throw err;
      }
    }
  }

  throw lastError || new Error('Gemini API request failed');
}

module.exports = { generateAnswer };
