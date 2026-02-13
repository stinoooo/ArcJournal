const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const statusHistorySchema = new mongoose.Schema({
  action: { type: String }, // 'suspended', 'terminated', 'restored', 'deleted'
  reason: { type: String, default: '' },
  note:   { type: String, default: '' },
  expiry: { type: Date, default: null },
  by:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  at:     { type: Date, default: Date.now },
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    // Role
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    // Moderation
    status: {
      type: String,
      enum: ['active', 'suspended', 'terminated', 'deleted'],
      default: 'active',
    },
    statusReason: { type: String, default: '' },   // shown to user
    statusNote:   { type: String, default: '' },   // internal admin note only
    statusExpiry: { type: Date, default: null },   // null = permanent
    statusHistory: { type: [statusHistorySchema], default: [] },
    // Onboarding profile fields
    displayName: {
      type: String,
      trim: true,
      default: '',
    },
    dateOfBirth: {
      type: String,
      default: '',
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'non-binary', 'prefer-not-to-say', ''],
      default: '',
    },
    journalingGoals: {
      type: [String],
      default: [],
    },
    onboardingComplete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.statusNote; // never expose internal notes to clients
  return obj;
};

module.exports = mongoose.model('User', userSchema);