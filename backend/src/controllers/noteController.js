const Note = require('../models/Note');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

async function createNote(req, res) {
  const { title, content, category } = req.body ?? {};

if (typeof content !== 'string' || content.trim() === '') {
    return res.status(400).json({ success: false, data: null, message: 'content is required' });
  }

  const note = await Note.create({
    userId: req.user.id,
    title: title || '',
    content,
    category: category || null,
  });

  logger.info({ userId: req.user.id, noteId: note._id }, 'Note created');

  res.status(201).json({
    success: true,
    data: note,
    message: 'Note created successfully',
  });
}

async function getNotes(req, res) {
  const isTrash = req.query.isTrash === 'true';
  const filter = {
    userId: req.user.id,
    isTrash,
  };

  if (req.query.category) {
    filter.category = req.query.category;
  }

  const notes = await Note.find(filter).sort({ updatedAt: -1 });

  res.status(200).json({
    success: true,
    data: notes,
    message: 'Notes retrieved successfully',
  });
}

async function getNoteById(req, res) {
  const note = await Note.findOne({ _id: req.params.id, userId: req.user.id });

  if (!note) {
    return res.status(404).json({ success: false, data: null, message: 'Note not found' });
  }

  res.status(200).json({
    success: true,
    data: note,
    message: 'Note retrieved successfully',
  });
}

async function updateNote(req, res) {
  const { title, content, category } = req.body ?? {};

  const note = await Note.findOne({ _id: req.params.id, userId: req.user.id });

  if (!note) {
    return res.status(404).json({ success: false, data: null, message: 'Note not found' });
  }

  if (title !== undefined) note.title = title;
  if (content !== undefined) note.content = content;
  if (category !== undefined) note.category = category;

  await note.save();

  logger.info({ userId: req.user.id, noteId: note._id }, 'Note updated');

  res.status(200).json({
    success: true,
    data: note,
    message: 'Note updated successfully',
  });
}

async function trashNote(req, res) {
  const note = await Note.findOne({ _id: req.params.id, userId: req.user.id });

  if (!note) {
    return res.status(404).json({ success: false, data: null, message: 'Note not found' });
  }

  note.isTrash = true;
  note.trashedAt = new Date();
  await note.save();

  logger.info({ userId: req.user.id, noteId: note._id }, 'Note moved to trash');

  res.status(200).json({
    success: true,
    data: note,
    message: 'Note moved to trash',
  });
}

async function restoreNote(req, res) {
  const note = await Note.findOne({ _id: req.params.id, userId: req.user.id });

  if (!note) {
    return res.status(404).json({ success: false, data: null, message: 'Note not found' });
  }

  note.isTrash = false;
  note.trashedAt = null;
  await note.save();

  logger.info({ userId: req.user.id, noteId: note._id }, 'Note restored from trash');

  res.status(200).json({
    success: true,
    data: note,
    message: 'Note restored successfully',
  });
}

async function deleteNotePermanent(req, res) {
  const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user.id });

  if (!note) {
    return res.status(404).json({ success: false, data: null, message: 'Note not found' });
  }

  logger.info({ userId: req.user.id, noteId: req.params.id }, 'Note permanently deleted');

  res.status(200).json({
    success: true,
    data: null,
    message: 'Note deleted permanently',
  });
}

async function importNotes(req, res) {
  const rawNotes = Array.isArray(req.body) ? req.body : req.body?.notes;

  if (!Array.isArray(rawNotes) || rawNotes.length === 0) {
    return res.status(400).json({ success: false, data: null, message: 'A non-empty notes array is required for import' });
  }

  const validNotes = rawNotes
    .filter((n) => typeof n?.content === 'string' && n.content.trim() !== '')
    .map((n) => ({
      userId: req.user.id,
      title: n.title || '',
      content: n.content,
      category: n.category || null,
      isTrash: false,
      trashedAt: null,
    }));

  if (validNotes.length === 0) {
    return res.status(400).json({ success: false, data: null, message: 'No valid notes found to import' });
  }

  const insertedNotes = await Note.insertMany(validNotes);

  logger.info({ userId: req.user.id, count: insertedNotes.length }, 'Notes imported');

  res.status(201).json({
    success: true,
    data: insertedNotes,
    message: 'Notes imported successfully',
  });
}

module.exports = {
  createNote: asyncHandler(createNote),
  getNotes: asyncHandler(getNotes),
  getNoteById: asyncHandler(getNoteById),
  updateNote: asyncHandler(updateNote),
  trashNote: asyncHandler(trashNote),
  restoreNote: asyncHandler(restoreNote),
  deleteNotePermanent: asyncHandler(deleteNotePermanent),
  importNotes: asyncHandler(importNotes),
};
