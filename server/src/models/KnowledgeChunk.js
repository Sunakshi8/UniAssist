const { Schema, model } = require('mongoose');

const knowledgeChunkSchema = new Schema({
  sourceTitle: { type: String, required: true },
  category: { type: String, default: 'general', index: true },
  text: { type: String, required: true },
  embedding: { type: [Number], required: true },
}, { timestamps: true });

module.exports = model('KnowledgeChunk', knowledgeChunkSchema);
