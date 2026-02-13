const mongoose = require('mongoose');

const appealSchema = new mongoose.Schema(
  {
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type:       { type: String, enum: ['suspension', 'termination'], required: true },
    message:    { type: String, required: true, maxlength: 2000 },
    status:     { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending' },
    adminResponse: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

appealSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Appeal', appealSchema);