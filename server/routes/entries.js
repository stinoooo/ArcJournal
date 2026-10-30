const router = require('express').Router();
const Entry = require('../models/Entry');
const auth = require('../middleware/auth');
const { requireActive } = require('../middleware/auth');
const { isDate, isFutureDate, isSealed, sealed, MAX_BODY, MAX_FILES } = require('../lib/validate');

router.use(auth, requireActive);

const ENC_VERSION = 1;
const MAX_VERSIONS = 10;

// GET /entries?date=YYYY-MM-DD | ?from=&to=
router.get('/', async (req, res) => {
  const { from, to, date } = req.query;
  const query = { userId: req.user._id };
  if (date !== undefined) {
    if (!isDate(date)) return res.status(400).json({ error: 'Invalid date' });
    query.date = date;
  } else if (from !== undefined || to !== undefined) {
    if ((from !== undefined && !isDate(from)) || (to !== undefined && !isDate(to))) {
      return res.status(400).json({ error: 'Invalid date range' });
    }
    query.date = {};
    if (from) query.date.$gte = from;
    if (to) query.date.$lte = to;
  }
  const entries = await Entry.find(query).select('-versions.body -versions.content').sort({ date: -1, createdAt: -1 });
  res.json({ entries: entries.map((e) => e.toClient()) });
});

// GET /entries/:id/versions
router.get('/:id/versions', async (req, res) => {
  const entry = await Entry.findOne({ _id: req.params.id, userId: req.user._id }).select('versions');
  if (!entry) return res.status(404).json({ error: 'Entry not found' });
  res.json({ versions: entry.versions });
});

// POST /entries
router.post('/', async (req, res) => {
  const { date, body, files } = req.body;
  if (!isDate(date)) return res.status(400).json({ error: 'A valid date is required' });
  if (isFutureDate(date)) return res.status(400).json({ error: 'Cannot create entries for future dates' });
  if (!isSealed(body, MAX_BODY)) return res.status(400).json({ error: 'Entries must be encrypted on your device' });
  if (files != null && !isSealed(files, MAX_FILES)) return res.status(400).json({ error: 'Attachments must be encrypted on your device' });

  const entry = await Entry.create({
    userId: req.user._id,
    date,
    enc: ENC_VERSION,
    body: sealed(body),
    files: files ? sealed(files) : undefined,
  });
  res.status(201).json({ entry: entry.toClient() });
});

// PUT /entries/:id
// { body, files?, snapshot? } where snapshot keeps the previous text as a version.
// Encrypting a legacy entry may also send { versions: [{ body, savedAt }] }.
router.put('/:id', async (req, res) => {
  const { body, files, snapshot, versions } = req.body;
  if (!isSealed(body, MAX_BODY)) return res.status(400).json({ error: 'Entries must be encrypted on your device' });
  if (files != null && !isSealed(files, MAX_FILES)) return res.status(400).json({ error: 'Attachments must be encrypted on your device' });

  const entry = await Entry.findOne({ _id: req.params.id, userId: req.user._id });
  if (!entry) return res.status(404).json({ error: 'Entry not found' });

  if (!entry.enc) {
    // Encrypting a legacy entry: drop every plaintext field and plaintext version.
    const migrated = Array.isArray(versions) ? versions.slice(-MAX_VERSIONS) : [];
    if (!migrated.every((v) => isSealed(v?.body, MAX_BODY))) {
      return res.status(400).json({ error: 'Versions must be encrypted on your device' });
    }
    for (const key of Entry.LEGACY_FIELDS) entry.set(key, undefined);
    entry.versions = migrated.map((v) => ({ body: sealed(v.body), savedAt: v.savedAt ? new Date(v.savedAt) : new Date() }));
  } else {
    if (snapshot && entry.body) {
      entry.versions.push({ body: entry.body, savedAt: entry.lastEditedAt || entry.updatedAt });
      while (entry.versions.length > MAX_VERSIONS) entry.versions.shift();
    }
    entry.lastEditedAt = new Date();
  }

  entry.enc = ENC_VERSION;
  entry.body = sealed(body);
  if (files !== undefined) entry.files = files ? sealed(files) : undefined;
  await entry.save();
  res.json({ entry: entry.toClient() });
});

// DELETE /entries/:id
router.delete('/:id', async (req, res) => {
  const entry = await Entry.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!entry) return res.status(404).json({ error: 'Entry not found' });
  res.json({ message: 'Entry deleted' });
});

module.exports = router;
