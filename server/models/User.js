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

const wrappedKeySchema = new mongoose.Schema({
  iv: { type: String, required: true },
  ciphertext: { type: String, required: true },
}, { _id: false });

/**
 * The end-to-end encryption vault. The journal key never leaves the device in
 * the clear: the server only stores it wrapped by a key derived from the user's
 * passphrase, and once more by their recovery key.
 */
const vaultSchema = new mongoose.Schema({
  version: { type: Number, required: true },
  kdf: {
    name:       { type: String, required: true },
    hash:       { type: String, required: true },
    iterations: { type: Number, required: true },
    salt:       { type: String, required: true },
  },
  passphrase: { type: wrappedKeySchema, required: true },
  recovery:   { type: wrappedKeySchema, required: true },
  updatedAt:  { type: Date, default: Date.now },
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    // The Arcnode account (Backboard subject). Unset only on legacy accounts
    // that have not been linked yet.
    arcnodeId: { type: String, index: { unique: true, sparse: true } },
    email:     { type: String, lowercase: true, trim: true, default: '', index: true },
    // Legacy sign-in from ArcJournal 1.x. Kept only so a legacy account can be
    // linked to an Arcnode account once, then the legacy account is removed.
    username:  { type: String, trim: true, index: { unique: true, sparse: true } },
    password:  { type: String },

    role:   { type: String, enum: ['user', 'admin'], default: 'user' },
    status: { type: String, enum: ['active', 'suspended', 'terminated', 'deleted'], default: 'active' },
    statusReason:  { type: String, default: '' }, // shown to the user
    statusNote:    { type: String, default: '' }, // internal admin note only
    statusExpiry:  { type: Date, default: null }, // null = permanent
    statusHistory: { type: [statusHistorySchema], default: [] },

    displayName:        { type: String, trim: true, default: '' },
    dateOfBirth:        { type: String, default: '' },
    gender:             { type: String, enum: ['male', 'female', 'non-binary', 'prefer-not-to-say', ''], default: '' },
    journalingGoals:    { type: [String], default: [] },
    onboardingComplete: { type: Boolean, default: false },

    vault: { type: vaultSchema, default: null },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function (candidate) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.statusNote; // never expose internal notes to clients
  delete obj.vault;      // served by /vault only
  obj.hasVault = !!this.vault;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
