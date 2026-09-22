const ChatSession = require('../models/ChatSession');
const ChatMessage = require('../models/ChatMessage');
const { retrieveRelevantChunks } = require('../services/retrieval.service');
const { generateAnswer } = require('../services/gemini.service');

/**
 * POST /api/chat
 * body: { message: string, sessionId?: string }
 */
async function sendMessage(req, res) {
  try {
    const { message, sessionId } = req.body;
    const userId = req.user.id;

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      return res.status(503).json({
        error: 'Gemini API is not configured',
        detail: 'Add a valid GEMINI_API_KEY to server/.env to enable chat responses.',
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }

    // 1. Get or create the chat session
    let session;
    if (sessionId) {
      session = await ChatSession.findOne({ _id: sessionId, userId });
      if (!session) return res.status(404).json({ error: 'Session not found' });
    } else {
      session = await ChatSession.create({
        userId,
        title: message.slice(0, 60),
      });
    }

    // 2. Save the user's message
    await ChatMessage.create({ sessionId: session._id, role: 'user', content: message });

    // 3. Retrieve relevant knowledge chunks
    const scoredChunks = await retrieveRelevantChunks(message);

    // 4. Pull recent history for light conversational continuity
    const recentHistory = await ChatMessage.find({ sessionId: session._id })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();
    recentHistory.reverse();

    // 5. Ask Gemini
    const answer = await generateAnswer({
      question: message,
      contextChunks: scoredChunks,
      history: recentHistory,
    });

    // 6. Save the assistant's reply with source attribution
    const sourcesUsed = scoredChunks.map(({ chunk, score }) => ({
      chunkId: chunk._id,
      sourceTitle: chunk.sourceTitle,
      score,
    }));

    const assistantMessage = await ChatMessage.create({
      sessionId: session._id,
      role: 'assistant',
      content: answer,
      sourcesUsed,
    });

    res.json({
      sessionId: session._id,
      answer,
      sources: sourcesUsed,
      messageId: assistantMessage._id,
    });
  } catch (err) {
    console.error('[chat.sendMessage]', err);
    res.status(500).json({ error: 'Failed to generate a response', detail: err.message });
  }
}

/** GET /api/chat/sessions */
async function listSessions(req, res) {
  try {
    const sessions = await ChatSession.find({ userId: req.user.id }).sort({ updatedAt: -1 });
    res.json(sessions);
  } catch (err) {
    console.error('[chat.listSessions]', err);
    res.status(500).json({ error: 'Failed to list sessions' });
  }
}

/** GET /api/chat/sessions/:id */
async function getSessionMessages(req, res) {
  try {
    const session = await ChatSession.findOne({ _id: req.params.id, userId: req.user.id });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const messages = await ChatMessage.find({ sessionId: session._id }).sort({ createdAt: 1 });
    res.json({ session, messages });
  } catch (err) {
    console.error('[chat.getSessionMessages]', err);
    res.status(500).json({ error: 'Failed to load session' });
  }
}

module.exports = { sendMessage, listSessions, getSessionMessages };
