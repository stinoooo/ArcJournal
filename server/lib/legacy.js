/**
 * ArcJournal 1.x accounts and their move to Arcnode.
 *
 * Accounts from 1.x keep signing in with their password until their owner links
 * an Arcnode account; only then is the password removed. Password sessions are
 * HS256 tokens marked `typ: arcjournal-password`, so tokens issued by 1.x apps
 * (which lack the mark) are refused and those apps are told to update.
 */
const mongoose = require('mongoose');
const User = require('../models/User');
const Entry = require('../models/Entry');
const Warning = require('../models/Warning');
const Appeal = require('../models/Appeal');
const LegacyBackup = require('../models/LegacyBackup');

const TYP = 'arcjournal-password';
const SESSION_DAYS = 30;

function secret() {
  const value = process.env.JWT_SECRET;
  return value ? new TextEncoder().encode(value) : null;
}

async function issueSession(userId) {
  const key = secret();
  if (!key) throw new Error('JWT_SECRET is not set');
  const { SignJWT } = await import('jose');
  return new SignJWT({ typ: TYP })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(key);
}

async function verifySession(token) {
  const key = secret();
  if (!key) return null;
  const { jwtVerify } = await import('jose');
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
    if (payload.typ !== TYP || !mongoose.isValidObjectId(payload.sub)) return null;
    return payload.sub;
  } catch {
    return null;
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

/** Links a 1.x account to an Arcnode account, merging when that Arcnode account already uses ArcJournal. */
async function linkToArcnode(legacyUser, arcnodeId, profile) {
  const existing = await User.findOne({ arcnodeId });
  if (existing) return mergeInto(legacyUser, existing);
  legacyUser.arcnodeId = arcnodeId;
  legacyUser.password = undefined;
  if (!legacyUser.email && profile?.email) legacyUser.email = profile.email.toLowerCase();
  await legacyUser.save();
  return legacyUser;
}

module.exports = { issueSession, verifySession, mergeInto, linkToArcnode, LinkConflict };
