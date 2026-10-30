const User = require('../models/User');
const { isLegacyAppToken } = require('../lib/legacy');

const BLOCKED = ['suspended', 'terminated', 'deleted'];
const UPGRADE_MESSAGE = 'This version of ArcJournal is no longer supported. Download the latest version from arcnode.dev/downloads.';

/**
 * Resolves the Bearer token, an Arcnode access token from Backboard, to an
 * ArcJournal user. The user is created on first sign-in. A session token from
 * an ArcJournal 1.x app gets 426 so that app tells its user to update.
 *
 * The verifier and profile lookup come from app.locals so tests can swap them out.
 */
module.exports = async function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Sign in to continue.', code: 'unauthenticated' });
  }
  const token = header.slice(7);
  const { verifyToken, fetchProfile } = req.app.locals.auth;

  try {
    const claims = await verifyToken(token);
    if (!claims) {
      if (await isLegacyAppToken(token)) {
        return res.status(426).json({ error: UPGRADE_MESSAGE, code: 'upgrade_required' });
      }
      return res.status(401).json({ error: 'Your session expired. Sign in again.', code: 'unauthenticated' });
    }

    let user = await User.findOne({ arcnodeId: claims.sub });
    if (!user) {
      const profile = await fetchProfile(token).catch(() => null);
      user = await User.create({
        arcnodeId: claims.sub,
        email: (profile?.email || '').toLowerCase(),
        displayName: profile?.name || '',
      });
    }

    // A suspension with an end date lifts itself once that date has passed.
    if (user.status === 'suspended' && user.statusExpiry && user.statusExpiry <= new Date()) {
      user.statusHistory.push({ action: 'restored', note: 'Suspension ended' });
      user.status = 'active';
      user.statusReason = '';
      user.statusNote = '';
      user.statusExpiry = null;
      await user.save();
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/** Blocks suspended, terminated and deleted accounts. They can still read their status and appeal. */
module.exports.requireActive = function requireActive(req, res, next) {
  if (BLOCKED.includes(req.user?.status)) {
    return res.status(403).json({ error: 'Your account is not active.', code: `account_${req.user.status}` });
  }
  next();
};
