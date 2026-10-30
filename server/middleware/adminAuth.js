// Runs after the auth middleware, so req.user is set.
module.exports = function adminAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Sign in to continue.', code: 'unauthenticated' });
  if (req.user.role !== 'admin' || req.user.status !== 'active') return res.status(403).json({ error: 'Admin access required' });
  next();
};
