const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'credits.json');

// ── Admin credentials (change these!) ────────────────────────────────────
const ADMIN_USERS = {
  'admin': 'mypcshop2026',
  'dev':   'devpass123'
};
// ─────────────────────────────────────────────────────────────────────────

// Multer — store uploaded images in /public/uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, 'avatar_' + Date.now() + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/image\/(jpeg|png|webp|gif)/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files allowed'));
  }
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'mypcshop_secret_2026_xK9#mP',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 2 * 60 * 60 * 1000 } // 2 hours
}));

// Serve static files (main site)
app.use(express.static(path.join(__dirname, 'public')));

// ── Helpers ───────────────────────────────────────────────────────────────
function readCredits() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch { return []; }
}
function writeCredits(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// ── Public API ────────────────────────────────────────────────────────────
app.get('/api/credits', (req, res) => {
  res.json(readCredits());
});

// ── Auth ──────────────────────────────────────────────────────────────────
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (ADMIN_USERS[username] && ADMIN_USERS[username] === password) {
    req.session.isAdmin = true;
    req.session.username = username;
    res.json({ ok: true, username });
  } else {
    res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
  }
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

app.get('/api/admin/me', (req, res) => {
  if (req.session && req.session.isAdmin) {
    res.json({ isAdmin: true, username: req.session.username });
  } else {
    res.json({ isAdmin: false });
  }
});

// ── Admin CRUD API ────────────────────────────────────────────────────────
// GET all (admin)
app.get('/api/admin/credits', requireAdmin, (req, res) => {
  res.json(readCredits());
});

// POST create
app.post('/api/admin/credits', requireAdmin, upload.single('avatar'), (req, res) => {
  const credits = readCredits();
  const entry = {
    id: Date.now(),
    name:  req.body.name  || '',
    role:  req.body.role  || '',
    stdId: req.body.stdId || '',
    desc:  req.body.desc  || '',
    image: req.file ? '/uploads/' + req.file.filename : (req.body.imageUrl || '')
  };
  credits.push(entry);
  writeCredits(credits);
  res.json({ ok: true, entry });
});

// PUT update
app.put('/api/admin/credits/:id', requireAdmin, upload.single('avatar'), (req, res) => {
  const id = parseInt(req.params.id);
  const credits = readCredits();
  const idx = credits.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  const existing = credits[idx];
  credits[idx] = {
    id,
    name:  req.body.name  || existing.name,
    role:  req.body.role  || existing.role,
    stdId: req.body.stdId !== undefined ? req.body.stdId : existing.stdId,
    desc:  req.body.desc  !== undefined ? req.body.desc  : existing.desc,
    image: req.file
      ? '/uploads/' + req.file.filename
      : (req.body.imageUrl !== undefined ? req.body.imageUrl : existing.image)
  };
  writeCredits(credits);
  res.json({ ok: true, entry: credits[idx] });
});

// DELETE
app.delete('/api/admin/credits/:id', requireAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  let credits = readCredits();
  const idx = credits.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  // Delete old file if uploaded
  const oldImage = credits[idx].image;
  if (oldImage && oldImage.startsWith('/uploads/')) {
    const filePath = path.join(__dirname, 'public', oldImage);
    try { fs.unlinkSync(filePath); } catch {}
  }

  credits.splice(idx, 1);
  writeCredits(credits);
  res.json({ ok: true });
});

// ── Admin panel route ─────────────────────────────────────────────────────
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// ── Fallback → main site ──────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  ✅  My PC Shop running at  http://localhost:${PORT}`);
  console.log(`  🔐  Admin panel at        http://localhost:${PORT}/admin`);
  console.log(`\n  Default credentials:`);
  console.log(`      username: admin   password: mypcshop2026`);
  console.log(`      username: dev     password: devpass123\n`);
});
