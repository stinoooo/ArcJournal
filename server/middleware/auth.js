const User = require('../models/User');
const legacy = require('../lib/legacy');

const BLOCKED = ['suspended', 'terminated', 'deleted'];

/**
 * Resolves the Bearer token to an ArcJournal user. Two kinds are accepted:
 *
 * - An Arcnode access token from Backboard. The user is created on first sign-in.
 * - A password session for an ArcJournal 1.x account that has not been linked
 *   to Arcnode yet (see lib/legacy.js). These stop working once it is linked.
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
    let user = null;
    const claims = await verifyToken(token);
    if (claims) {
      user = await User.findOne({ arcnodeId: claims.sub });
      if (!user) {
        const profile = await fetchProfile(token).catch(() => null);
        user = await User.create({
          arcnodeId: claims.sub,
          email: (profile?.email || '').toLowerCase(),
          displayName: profile?.name || '',
        });
      }
      req.authKind = 'arcnode';
    } else {
      const userId = await legacy.verifySession(token);
      if (userId) user = await User.findOne({ _id: userId, arcnodeId: { $exists: false }, password: { $exists: true } });
      if (!user) return res.status(401).json({ error: 'Your session expired. Sign in again.', code: 'unauthenticated' });
      req.authKind = 'password';
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
