const { Schema, model } = require('mongoose');

const chatMessageSchema = new Schema({
  sessionId: { type: Schema.Types.ObjectId, ref: 'ChatSession', required: true, index: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  sourcesUsed: [{
    chunkId: { type: Schema.Types.ObjectId, ref: 'KnowledgeChunk' },
    sourceTitle: String,
    score: Number,
  }],
}, { timestamps: true });

module.exports = model('ChatMessage', chatMessageSchema);
