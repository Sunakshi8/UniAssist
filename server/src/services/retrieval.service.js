const KnowledgeChunk = require('../models/KnowledgeChunk');
const { embedText } = require('./embedding.service');

const TOP_K = 4;
const MIN_SCORE = 0.5; // chunks below this similarity are considered irrelevant

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Finds the top-K most relevant knowledge chunks for a given question.
 * @param {string} question
 * @param {object} [options]
 * @param {string} [options.category] - optionally restrict to one category
 * @param {number} [options.topK]
 * @returns {Promise<Array<{chunk: object, score: number}>>}
 */
async function retrieveRelevantChunks(question, options = {}) {
  const topK = options.topK || TOP_K;
  const filter = options.category ? { category: options.category } : {};

  const [questionVector, chunks] = await Promise.all([
    embedText(question),
    KnowledgeChunk.find(filter).lean(),
  ]);

  const scored = chunks
    .map((chunk) => ({ chunk, score: cosineSimilarity(questionVector, chunk.embedding) }))
    .filter((item) => item.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored;
}

module.exports = { retrieveRelevantChunks, cosineSimilarity };
