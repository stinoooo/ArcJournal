const mongoose = require('mongoose');

const gradeBucketSchema = new mongoose.Schema({
  grade: Number,
  count: Number,
}, { _id: false });

const daySchema = new mongoose.Schema({
  date: String,
  title: String,
  grade: Number,
}, { _id: false });

const wrapSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    weekStart: { type: String, required: true },
    weekEnd:   { type: String, required: true },
    averageGrade:     { type: Number },
    trend:            { type: String, enum: ['improving', 'declining', 'stable'] },
    topEmojis:        [{ type: String }],
    gradeDistribution: [gradeBucketSchema],
    bestDay:          { type: daySchema, default: null },
    worstDay:         { type: daySchema, default: null },
    moodFreq:         { type: mongoose.Schema.Types.Mixed, default: {} },
    daysJournaled:    { type: Number, default: 0 },
    totalEntries:     { type: Number, default: 0 },
    entriesCount:     { type: Number, default: 0 },
  },
  { timestamps: true }
);

wrapSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

module.exports = mongoose.model('Wrap', wrapSchema);
