/**
 * ArcJournal 1.x accounts and their move to Arcnode.
 *
 * ArcJournal signs in with Arcnode only. A 1.x account is reached once, from an
 * Arcnode account, by proving its old email or username and password
 * (POST /user/link-legacy); its journal is then merged in and it is deleted.
 * Session tokens from 1.x apps (HS256 with JWT_SECRET) are recognized so those
 * apps are told to update instead of "session expired".
 */
const User = require('../models/User');
const Entry = require('../models/Entry');
const Warning = require('../models/Warning');
const Appeal = require('../models/Appeal');
const LegacyBackup = require('../models/LegacyBackup');

function secret() {
  const value = process.env.JWT_SECRET;
  return value ? new TextEncoder().encode(value) : null;
}

/**
 * True for a session token issued by ArcJournal 1.x (HS256, { userId },
 * no typ), so those apps can be told to update instead of "session expired".
 */
async function isLegacyAppToken(token) {
  const key = secret();
  if (!key) return false;
  const { jwtVerify } = await import('jose');
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
    return payload.typ === undefined && typeof payload.userId === 'string';
  } catch {
    return false;
  }
}

class LinkConflict extends Error {}

/**
 * Moves everything from a 1.x account into an Arcnode-backed account and
 * deletes the 1.x account. Moderation state and the admin role carry over, so
 * linking can never be used to shed a suspension.
 */
async function mergeInto(from, into) {
  if (from.vault && into.vault) {
    throw new LinkConflict('Both accounts already have an encrypted journal. Contact support to combine them.');
  }
  await Promise.all([
    Entry.updateMany({ userId: from._id }, { $set: { userId: into._id } }),
    Warning.updateMany({ userId: from._id }, { $set: { userId: into._id } }),
    Appeal.updateMany({ userId: from._id }, { $set: { userId: into._id } }),
    LegacyBackup.updateMany({ userId: from._id }, { $set: { userId: into._id } }),
  ]);

  if (from.vault && !into.vault) into.vault = from.vault;
  if (from.role === 'admin') into.role = 'admin';
  if (from.status !== 'active') {
    into.status = from.status;
    into.statusReason = from.statusReason;
    into.statusNote = from.statusNote;
    into.statusExpiry = from.statusExpiry;
  }
  into.statusHistory = [...from.statusHistory, ...into.statusHistory];
  for (const key of ['displayName', 'dateOfBirth', 'gender']) {
    if (!into[key] && from[key]) into[key] = from[key];
  }
  if (!into.journalingGoals?.length && from.journalingGoals?.length) into.journalingGoals = from.journalingGoals;
  if (from.onboardingComplete) into.onboardingComplete = true;
  if (!into.email && from.email) into.email = from.email;

  await User.findByIdAndDelete(from._id);
  await into.save();
  // Keep "member since" from the first account. createdAt is immutable in
  // Mongoose, so this goes straight to the collection.
  if (from.createdAt < into.createdAt) {
    await User.collection.updateOne({ _id: into._id }, { $set: { createdAt: from.createdAt } });
  }
  return User.findById(into._id);
}

module.exports = { isLegacyAppToken, mergeInto, LinkConflict };
