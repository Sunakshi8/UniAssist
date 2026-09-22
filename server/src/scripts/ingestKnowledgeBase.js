/**
 * Reads server/data/sample_knowledge.json (or any array of
 * { sourceTitle, category, text } objects), embeds each entry locally,
 * and inserts it into the KnowledgeChunk collection.
 *
 * Usage: npm run ingest
 * Optional: node src/scripts/ingestKnowledgeBase.js path/to/other-file.json
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const connectDB = require('../config/db');
const KnowledgeChunk = require('../models/KnowledgeChunk');
const { embedText } = require('../services/embedding.service');

async function run() {
  const inputPath = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.join(__dirname, '..', '..', 'data', 'sample_knowledge.json');

  if (!fs.existsSync(inputPath)) {
    console.error(`[ingest] File not found: ${inputPath}`);
    process.exit(1);
  }

  const entries = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  console.log(`[ingest] Loaded ${entries.length} entries from ${inputPath}`);

  await connectDB();

  let inserted = 0;
  for (const entry of entries) {
    if (!entry.sourceTitle || !entry.text) {
      console.warn('[ingest] Skipping invalid entry (missing sourceTitle/text):', entry);
      continue;
    }
    const embedding = await embedText(entry.text);
    await KnowledgeChunk.create({
      sourceTitle: entry.sourceTitle,
      category: entry.category || 'general',
      text: entry.text,
      embedding,
    });
    inserted += 1;
    process.stdout.write(`\r[ingest] Inserted ${inserted}/${entries.length}`);
  }

  console.log(`\n[ingest] Done. Inserted ${inserted} knowledge chunks.`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('[ingest] Failed:', err);
  process.exit(1);
});
