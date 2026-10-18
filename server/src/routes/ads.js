'use strict';
const express = require('express');
const crypto = require('crypto');
const store = require('../store');
const { HttpError } = require('../httpError');
const { validateAdInput, CATEGORIES } = require('../validation');

const router = express.Router();

// ---- middleware: זיהוי משתמש ----
// בלי הרשמה, הלקוח מייצר UUID פעם אחת ושולח אותו בכותרת X-User-Id.
function getUserId(req) {
  const id = req.get('X-User-Id');
  return id && id.length >= 8 && id.length <= 64 ? id : null;
}

function requireUser(req, _res, next) {
  const userId = getUserId(req);
  if (!userId) return next(new HttpError(401, 'Missing or invalid X-User-Id header'));
  req.userId = userId;
  next();
}

// מה שמחזירים ללקוח: מסירים את ownerId (לא חושפים מזהים של אחרים)
// ומוסיפים isMine כדי שהלקוח ידע אם להציג כפתורי עריכה/מחיקה.
const toPublic = (ad, userId) => {
  const { ownerId, ...rest } = ad;
  return { ...rest, isMine: !!userId && ownerId === userId };
};

// ---- GET /api/ads?q=&category=&mine=true ----
router.get('/', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const q = String(req.query.q || '').trim().toLowerCase();
    const category = String(req.query.category || '');
    const mine = req.query.mine === 'true';

    let ads = await store.getAll();

    if (mine) {
      if (!userId) throw new HttpError(401, 'Missing or invalid X-User-Id header');
      ads = ads.filter((a) => a.ownerId === userId);
    }
    if (category) ads = ads.filter((a) => a.category === category);
    if (q) {
      ads = ads.filter((a) =>
        [a.title, a.description, a.location?.address].some((f) => f && f.toLowerCase().includes(q))
      );
    }

    ads.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); // החדשות ראשונות
    res.json(ads.map((a) => toPublic(a, userId)));
  } catch (err) {
    next(err);
  }
});

// ---- GET /api/ads/meta/categories ----
router.get('/meta/categories', (_req, res) => res.json(CATEGORIES));

// ---- GET /api/ads/:id ----
router.get('/:id', async (req, res, next) => {
  try {
    const ad = await store.getById(req.params.id);
    if (!ad) throw new HttpError(404, 'Ad not found');
    res.json(toPublic(ad, getUserId(req)));
  } catch (err) {
    next(err);
  }
});

// ---- POST /api/ads ----
router.post('/', requireUser, async (req, res, next) => {
  try {
    const data = validateAdInput(req.body);
    const now = new Date().toISOString();
    const ad = { id: crypto.randomUUID(), ...data, ownerId: req.userId, createdAt: now, updatedAt: now };

    await store.update((ads) => ({ ads: [...ads, ad], result: ad }));
    res.status(201).json(toPublic(ad, req.userId));
  } catch (err) {
    next(err);
  }
});

// ---- PUT /api/ads/:id ----
router.put('/:id', requireUser, async (req, res, next) => {
  try {
    const data = validateAdInput(req.body);

    // בדיקת קיום ובעלות נעשית *בתוך* update, כלומר בתוך התור,
    // כך שאין מרווח זמן בין הבדיקה לשינוי שבו מישהו אחר יכול להתערב.
    const updated = await store.update((ads) => {
      const i = ads.findIndex((a) => a.id === req.params.id);
      if (i === -1) throw new HttpError(404, 'Ad not found');
      if (ads[i].ownerId !== req.userId) throw new HttpError(403, 'You can only edit your own ads');

      const ad = { ...ads[i], ...data, updatedAt: new Date().toISOString() };
      const next = [...ads];
      next[i] = ad;
      return { ads: next, result: ad };
    });
    res.json(toPublic(updated, req.userId));
  } catch (err) {
    next(err);
  }
});

// ---- DELETE /api/ads/:id ----
router.delete('/:id', requireUser, async (req, res, next) => {
  try {
    await store.update((ads) => {
      const ad = ads.find((a) => a.id === req.params.id);
      if (!ad) throw new HttpError(404, 'Ad not found');
      if (ad.ownerId !== req.userId) throw new HttpError(403, 'You can only delete your own ads');
      return { ads: ads.filter((a) => a.id !== req.params.id), result: null };
    });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;