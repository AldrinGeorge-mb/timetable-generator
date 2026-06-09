const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');

router.get('/', async (req, res) => {
    try {
        const { projectId } = req.query;
        if (!projectId) return res.status(400).json({ error: 'projectId is required.' });
        const teachers = await Teacher.find({ projectId }).lean();
        res.status(200).json(teachers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch teachers.' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { name, assignments, projectId } = req.body;
        const teacher = await Teacher.create({ projectId, name: name.toUpperCase(), assignments: assignments || [] });
        res.status(201).json(teacher);
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ error: 'Teacher already exists.' });
        res.status(500).json({ error: 'Failed to create teacher.' });
    }
});

router.put('/:name', async (req, res) => {
    try {
        const { assignments, projectId } = req.body;
        const teacher = await Teacher.findOneAndUpdate(
            { projectId, name: req.params.name.toUpperCase() },
            { assignments: assignments || [] },
            { new: true }
        );
        if (!teacher) return res.status(404).json({ error: 'Teacher not found.' });
        res.status(200).json(teacher);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update teacher.' });
    }
});

router.delete('/:name', async (req, res) => {
    try {
        const { projectId } = req.query;
        await Teacher.deleteOne({ projectId, name: req.params.name.toUpperCase() });
        res.status(200).json({ message: 'Teacher deleted.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete teacher.' });
    }
});

module.exports = router;
