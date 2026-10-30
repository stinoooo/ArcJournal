const mongoose = require('mongoose');

// An AES-GCM sealed blob. Only the device holding the journal key can open it.
const sealedSchema = new mongoose.Schema({
  iv:         { type: String, required: true },
  ciphertext: { type: String, required: true },
}, { _id: false });

const versionSchema = new mongoose.Schema({
  body:    { type: sealedSchema, default: undefined },
  content: { type: String }, // legacy plaintext, removed by the encryption migration
  savedAt: { type: Date, default: Date.now },
}, { _id: false });

const entrySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // The calendar day stays readable so the journal can be listed by date.
    // Everything written in the entry lives in the sealed blobs.
    date: { type: String, required: true, index: true }, // YYYY-MM-DD

    // Encryption format version. Unset means a legacy plaintext entry from
    // ArcJournal 1.x that the app encrypts the next time it is unlocked.
    enc: { type: Number },
    // title, content, grade, mood, background and comments
    body: { type: sealedSchema, default: undefined },
    // attachments, sealed separately so versions stay small
    files: { type: sealedSchema, default: undefined },

    versions: { type: [versionSchema], default: [] },
    lastEditedAt: { type: Date, default: null },

    // Legacy plaintext fields (ArcJournal 1.x)
    title: String,
    content: String,
    grade: Number,
    emoji: String,
    bgColor: String,
    comments: { type: Array, default: undefined },
    attachments: { type: Array, default: undefined },
  },
  { timestamps: true }
);

// Not unique: several entries per day are allowed.
entrySchema.index({ userId: 1, date: 1 });

const LEGACY_FIELDS = ['title', 'content', 'grade', 'emoji', 'bgColor', 'comments', 'attachments'];

entrySchema.methods.toClient = function () {
  const base = {
    _id: this._id,
    date: this.date,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    lastEditedAt: this.lastEditedAt,
    versionCount: this.versions?.length || 0,
  };
  if (this.enc) return { ...base, enc: this.enc, body: this.body, files: this.files || null };
  const legacy = {};
  for (const key of LEGACY_FIELDS) legacy[key] = this[key];
  return { ...base, legacy: true, ...legacy };
};

entrySchema.statics.LEGACY_FIELDS = LEGACY_FIELDS;

module.exports = mongoose.model('Entry', entrySchema);
