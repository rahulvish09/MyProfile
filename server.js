const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
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
        email TEXT,
        answered BOOLEAN DEFAULT 0,
        time DATETIME DEFAULT (datetime('now', 'localtime'))
    )`);
    // Safe schema update for existing databases
    db.run(`ALTER TABLE questions ADD COLUMN email TEXT`, (err) => {
        /* suppress duplicate column error on subsequent runs */
    });
    db.run(`CREATE TABLE IF NOT EXISTS lab_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feedback TEXT,
        photo_path TEXT,
        ip TEXT,
        time DATETIME DEFAULT (datetime('now', 'localtime'))
    )`);
});

// Ensure snapshots directory exists
const snapshotsDir = path.join(__dirname, 'snapshots');
if (!fs.existsSync(snapshotsDir)) fs.mkdirSync(snapshotsDir);

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
    const { question, answered, email } = req.body;
    db.run(`INSERT INTO questions (question, email, answered) VALUES (?, ?, ?)`, [question, email || null, answered ? 1 : 0], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// --- Lab Feedback + Snapshot + Email ---
app.post('/api/lab/feedback', (req, res) => {
    try {
        const { photo, feedback } = req.body;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        
        let photoPath = null;
        let attachments = [];

        // Save photo if provided
        if (photo) {
            const base64Data = photo.replace(/^data:image\/\w+;base64,/, '');
            const filename = `lab_${Date.now()}.png`;
            photoPath = path.join(snapshotsDir, filename);
            try {
                fs.writeFileSync(photoPath, base64Data, 'base64');
                attachments.push({ filename: filename, path: photoPath });
            } catch (e) {
                console.error('Failed to save snapshot:', e);
            }
        }

        // Save to database
        db.run(`INSERT INTO lab_sessions (feedback, photo_path, ip) VALUES (?, ?, ?)`,
            [feedback || 'No feedback', photoPath, ip]);

        // Send email only if credentials are configured
        const mailUser = process.env.MAIL_USER;
        const mailPass = process.env.MAIL_PASS;
        
        if (mailUser && mailPass) {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: mailUser, pass: mailPass }
            });

            const mailOptions = {
                from: mailUser,
                to: 'rv14879423@gmail.com',
                subject: `Lab Visitor Feedback — ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
                html: `
                    <h2 style="color:#ff2a2a;">New Lab Session Report</h2>
                    <p><strong>Visitor IP:</strong> ${ip}</p>
                    <p><strong>Feedback:</strong> ${feedback || 'No feedback provided'}</p>
                    <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
                    <p>Photo is attached below (if captured).</p>
                `,
                attachments: attachments
            };

            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    console.error('Email send failed:', err.message);
                    return res.json({ success: true, emailed: false, error: err.message });
                }
                console.log('Lab feedback email sent:', info.response);
                res.json({ success: true, emailed: true });
            });
        } else {
            console.log('Mail credentials not set, skipping email. Data saved to DB.');
            res.json({ success: true, emailed: false });
        }
    } catch (err) {
        console.error('Lab feedback error:', err);
        res.json({ success: true, emailed: false });
    }
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
