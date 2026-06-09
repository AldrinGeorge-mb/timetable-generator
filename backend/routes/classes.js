const express = require('express');
const router = express.Router();
const ClassRoom = require('../models/ClassRoom');
const Timetable = require('../models/Timetable');
const { generateTimetable } = require('../utils/generator');

// Helper to rebuild schedules
async function buildMasterSchedule(projectId) {
    const allClasses = await ClassRoom.find({ projectId }).lean();
    return generateTimetable(allClasses);
}

router.get('/', async (req, res) => {
    try {
        const { projectId } = req.query;
        if (!projectId) return res.status(400).json({ error: 'projectId is required.' });
        const classes = await ClassRoom.find({ projectId }, 'className').lean();
        const classNames = classes.map(c => c.className);
        classNames.sort((a, b) => {
            const matchA = a.match(/^(\d+)(.*)$/);
            const matchB = b.match(/^(\d+)(.*)$/);
            if (!matchA || !matchB) {
                return b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' });
            }
            const numA = parseInt(matchA[1], 10);
            const numB = parseInt(matchB[1], 10);
            if (numA !== numB) return numB - numA;
            return matchA[2].localeCompare(matchB[2]);
        });
        res.status(200).json(classNames);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch class list.' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { className, projectId } = req.body;
        const newClass = await ClassRoom.create({ 
            projectId, 
            className: className.toUpperCase(), 
            requirements: [] 
        });
        res.status(201).json(newClass);
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ error: 'Class already exists.' });
        res.status(500).json({ error: 'Failed to create class.' });
    }
});

router.delete('/:className', async (req, res) => {
    try {
        const { projectId } = req.query;
        await ClassRoom.deleteOne({ projectId, className: req.params.className.toUpperCase() });
        res.status(200).json({ message: 'Class deleted.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete class.' });
    }
});

module.exports = router;
