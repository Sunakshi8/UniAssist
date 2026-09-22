const router = require('express').Router();
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');
const { addChunk, listChunks, deleteChunk } = require('../controllers/knowledge.controller');

router.use(requireAuth, requireAdmin);

router.post('/', addChunk);
router.get('/', listChunks);
router.delete('/:id', deleteChunk);

module.exports = router;
