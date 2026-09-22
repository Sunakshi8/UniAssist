/**
 * Local embedding generation using @xenova/transformers.
 * Model loads once and is cached in memory for the life of the process.
 */
const { pipeline } = require('@xenova/transformers');

let embedderPromise = null;

function getEmbedder() {
  if (!embedderPromise) {
    const modelName = process.env.EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2';
    console.log(`[embedding] loading model: ${modelName} (first call only)`);
    embedderPromise = pipeline('feature-extraction', modelName);
  }
  return embedderPromise;
}

/**
 * Returns a plain JS array of numbers (the embedding vector) for the given text.
 * @param {string} text
 * @returns {Promise<number[]>}
 */
async function embedText(text) {
  if (!text || !text.trim()) {
    throw new Error('embedText: text must be a non-empty string');
  }
  const embedder = await getEmbedder();
  const output = await embedder(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

/**
 * Warms the model up at server startup so the first real request isn't slow.
 */
async function warmUp() {
  await getEmbedder();
  await embedText('warm up');
  console.log('[embedding] model ready');
}

module.exports = { embedText, warmUp };
