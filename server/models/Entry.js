const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
  selectedText: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const attachmentSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  mimeType: { type: String, default: 'application/octet-stream' },
  size: { type: Number, default: 0 },
  data: { type: String, default: '' }, // base64
}, { _id: false });

const versionSchema = new mongoose.Schema({
  content: { type: String, default: '' },
  savedAt: { type: Date, default: Date.now },
}, { _id: false });

const entrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '',
    },
    // HTML content from TipTap rich text editor
    content: {
      type: String,
      default: '',
    },
    grade: {
      type: Number,
      min: 1,
      max: 10,
      default: 7,
    },
    emoji: {
      type: String,
      default: 'happy',
    },
    bgColor: {
      type: String,
      default: '',
    },
    comments: {
      type: [commentSchema],
      default: [],
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    versions: {
      type: [versionSchema],
      default: [],
    },
    lastEditedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// NOT unique — multiple entries per day allowed
entrySchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('Entry', entrySchema);
