const KnowledgeChunk = require('../models/KnowledgeChunk');
const { embedText } = require('../services/embedding.service');

/**
 * POST /api/knowledge
 * body: { sourceTitle, category, text }
 * Embeds the text and stores it as a new knowledge chunk.
 */
async function addChunk(req, res) {
  try {
    const { sourceTitle, category, text } = req.body;
    if (!sourceTitle || !text) {
      return res.status(400).json({ error: 'sourceTitle and text are required' });
    }

    const embedding = await embedText(text);
    const chunk = await KnowledgeChunk.create({
      sourceTitle,
      category: category || 'general',
      text,
      embedding,
    });

    res.status(201).json(chunk);
  } catch (err) {
    console.error('[knowledge.addChunk]', err);
    res.status(500).json({ error: 'Failed to add knowledge chunk' });
  }
}

/** GET /api/knowledge */
async function listChunks(req, res) {
  try {
    const chunks = await KnowledgeChunk.find({}, { embedding: 0 }).sort({ createdAt: -1 });
    res.json(chunks);
  } catch (err) {
    console.error('[knowledge.listChunks]', err);
    res.status(500).json({ error: 'Failed to list knowledge chunks' });
  }
}

/** DELETE /api/knowledge/:id */
async function deleteChunk(req, res) {
  try {
    await KnowledgeChunk.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    console.error('[knowledge.deleteChunk]', err);
    res.status(500).json({ error: 'Failed to delete knowledge chunk' });
  }
}

module.exports = { addChunk, listChunks, deleteChunk };
