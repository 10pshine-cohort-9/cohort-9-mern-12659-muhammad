const { Router } = require('express');
const { createNote, getNotes, getNoteById, updateNote, trashNote, restoreNote, deleteNotePermanent, importNotes } = require('../controllers/noteController');
const authMiddleware = require('../middleware/authMiddleware');

const router = Router();

router.use(authMiddleware);

router.get('/', getNotes);
router.post('/', createNote);
router.post('/import', importNotes);
router.get('/:id', getNoteById);
router.put('/:id', updateNote);
router.delete('/:id', trashNote);
router.patch('/:id/restore', restoreNote);
router.delete('/:id/permanent', deleteNotePermanent);

module.exports = router;
