const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      default: '',
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: null,
      trim: true,
    },
    isTrash: {
      type: Boolean,
      default: false,
    },
    trashedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

 noteSchema.index({ userId: 1, isTrash: 1, updatedAt: -1 });
 
module.exports = mongoose.model('Note', noteSchema);
