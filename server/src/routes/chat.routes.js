const router = require('express').Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { sendMessage, listSessions, getSessionMessages } = require('../controllers/chat.controller');

router.use(requireAuth);

router.post('/', sendMessage);
router.get('/sessions', listSessions);
router.get('/sessions/:id', getSessionMessages);

module.exports = router;
