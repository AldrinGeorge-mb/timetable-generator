const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ─── DB Connection ─────────────────────────────────────────────────────────────
mongoose
    .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/autoschedule_pro')
    .then(() => console.log('✅ Connected to MongoDB successfully'))
    .catch((err) => console.error('⚠️ MongoDB connection error:', err.message));

// ─── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.status(200).json({ message: 'Schedulify server is running!' });
});

// ─── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/rules', require('./routes/rules'));
app.use('/api/schedule', require('./routes/timetable'));

// The timetable router also handles these flat endpoints directly off /api/
app.post('/api/validate-move', (req, res, next) => {
    req.url = '/validate-move';
    require('./routes/timetable')(req, res, next);
});
app.post('/api/suggest-alternatives', (req, res, next) => {
    req.url = '/suggest-alternatives';
    require('./routes/timetable')(req, res, next);
});
app.post('/api/find-cascade', (req, res, next) => {
    req.url = '/find-cascade';
    require('./routes/timetable')(req, res, next);
});

// ─── Serve Frontend in Production ──────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/dist')));

    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../frontend/dist', 'index.html'));
    });
}

// ─── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀Schedulify server running on port ${PORT}`);
});
