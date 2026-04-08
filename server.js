const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(__dirname)); // Serve HTML, CSS, JS

// Database setup
const db = new sqlite3.Database('./tracker.db', (err) => {
    if (err) console.error("Database error:", err.message);
    else console.log("Connected to SQLite database.");
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS visits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip TEXT,
        time DATETIME DEFAULT (datetime('now', 'localtime'))
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS clicks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        link_id TEXT,
        target_url TEXT,
        time DATETIME DEFAULT (datetime('now', 'localtime'))
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question TEXT,
        answered BOOLEAN DEFAULT 0,
        time DATETIME DEFAULT (datetime('now', 'localtime'))
    )`);
});

// --- API Routing for Tracking ---
app.post('/api/track/visit', (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    db.run(`INSERT INTO visits (ip) VALUES (?)`, [ip], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.post('/api/track/click', (req, res) => {
    const { link_id, target_url } = req.body;
    db.run(`INSERT INTO clicks (link_id, target_url) VALUES (?, ?)`, [link_id, target_url], (err) => {
        if (err) return res.status(500).json({ error: err.message });
    });
});

app.post('/api/track/question', (req, res) => {
    const { question, answered } = req.body;
    db.run(`INSERT INTO questions (question, answered) VALUES (?, ?)`, [question, answered ? 1 : 0], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// --- Admin Authentication ---
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "rahul123";

const authMiddleware = (req, res, next) => {
    if (req.cookies.auth_token === "loggedin") {
        next();
    } else {
        res.redirect('/admin');
    }
};

app.get('/admin', (req, res) => {
    if (req.cookies.auth_token === "loggedin") {
        return res.redirect('/dashboard');
    }
    res.sendFile(path.join(__dirname, 'admin-login.html'));
});

app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USER && password === ADMIN_PASS) {
        res.cookie('auth_token', 'loggedin', { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 });
        res.redirect('/dashboard');
    } else {
        res.redirect('/admin?error=1');
    }
});

app.get('/api/admin/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.redirect('/admin');
});

// --- Admin Dashboard ---
app.get('/dashboard', authMiddleware, (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.sendFile(path.join(__dirname, 'admin-dashboard.html'));
});

// Data API for Dashboard
app.get('/api/admin/data', authMiddleware, (req, res) => {
    db.all(`SELECT * FROM visits ORDER BY id DESC LIMIT 50`, [], (err, visits) => {
        if (err) return res.status(500).json({ error: err.message });
        
        db.all(`SELECT * FROM clicks ORDER BY id DESC LIMIT 50`, [], (err, clicks) => {
            if (err) return res.status(500).json({ error: err.message });
            
            db.get(`SELECT COUNT(*) as vcount FROM visits`, [], (err, total_visits) => {
                db.get(`SELECT COUNT(*) as ccount FROM clicks`, [], (err, total_clicks) => {
                    db.all(`SELECT * FROM questions ORDER BY id DESC LIMIT 50`, [], (err, questions) => {
                        res.json({
                            visits: visits || [],
                            clicks: clicks || [],
                            questions: questions || [],
                            stats: {
                                total_visits: total_visits.vcount,
                                total_clicks: total_clicks.ccount
                            }
                        });
                    });
                });
            });
        });
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Node Server tracking traffic at Port ${PORT}`);
});
