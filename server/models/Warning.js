const mongoose = require('mongoose');

const warningSchema = new mongoose.Schema(
  {
    userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    severity:       { type: String, enum: ['notice', 'warning', 'severe'], default: 'warning' },
    reason:         { type: String, required: true },   // shown to user
    note:           { type: String, default: '' },       // internal admin note
    acknowledged:   { type: Boolean, default: false },
    acknowledgedAt: { type: Date, default: null },
    issuedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Warning', warningSchema);