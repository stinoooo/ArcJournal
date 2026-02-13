const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, maxlength: 200 },
    message:     { type: String, required: true, maxlength: 2000 },
    type:        { type: String, enum: ['info', 'warning', 'maintenance', 'feature'], default: 'info' },
    active:      { type: Boolean, default: true },
    dismissible: { type: Boolean, default: true },
    expiresAt:   { type: Date, default: null },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Announcement', announcementSchema);