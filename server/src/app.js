require('dotenv').config();
const express = require('express');
const cors = require('cors');

const connectDB = require('./config/db');
const { warmUp } = require('./services/embedding.service');

const authRoutes = require('./routes/auth.routes');
const chatRoutes = require('./routes/chat.routes');
const knowledgeRoutes = require('./routes/knowledge.routes');

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/knowledge', knowledgeRoutes);

// Fallback 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Central error handler (in case anything throws synchronously)
app.use((err, req, res, next) => {
  console.error('[unhandled]', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB();
    await warmUp(); // pre-load the embedding model so first request is fast
    app.listen(PORT, () => console.log(`[server] UniAssist API listening on port ${PORT}`));
  } catch (err) {
    console.error('[server] Failed to start:', err);
    process.exit(1);
  }
})();

module.exports = app;
