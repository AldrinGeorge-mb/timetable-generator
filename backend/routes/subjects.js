const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');

router.get('/', async (req, res) => {
    try {
        const { projectId } = req.query;
        if (!projectId) return res.status(400).json({ error: 'projectId is required.' });
        const subjects = await Subject.find({ projectId }).lean();
        res.status(200).json(subjects);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch subjects.' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { name, projectId, applicableClasses } = req.body;
        const subject = await Subject.create({ 
            projectId, 
            name: name.toUpperCase(),
            applicableClasses: applicableClasses || []
        });
        res.status(201).json(subject);
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ error: 'Subject already exists.' });
        res.status(500).json({ error: 'Failed to create subject.' });
    }
});

router.delete('/:name', async (req, res) => {
    try {
        const { projectId } = req.query;
        await Subject.deleteOne({ projectId, name: req.params.name.toUpperCase() });
        res.status(200).json({ message: 'Subject deleted.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete subject.' });
    }
});

module.exports = router;
