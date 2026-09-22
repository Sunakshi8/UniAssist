const { Schema, model } = require('mongoose');

const chatSessionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, default: 'New chat' },
}, { timestamps: true });

module.exports = model('ChatSession', chatSessionSchema);
