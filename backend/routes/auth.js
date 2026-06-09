const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const User = require('../models/User');

router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        let user = await User.findOne({ username: new RegExp(`^${username}$`, 'i') });
        if (user) return res.status(400).json({ error: 'Username already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({ username, password: hashedPassword });
        await user.save();

        const payload = { user: { id: user.id, username: user.username } };
        jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { username: user.username } });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username: new RegExp(`^${username}$`, 'i') });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        const payload = { user: { id: user.id, username: user.username } };
        jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { username: user.username } });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
