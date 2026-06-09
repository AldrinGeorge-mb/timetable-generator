const express = require('express');
const router = express.Router();
const ClassRoom = require('../models/ClassRoom');
const { generateTimetable } = require('../utils/generator');

async function buildMasterSchedule(projectId) {
    const allClasses = await ClassRoom.find({ projectId }).lean();
    return generateTimetable(allClasses);
}

router.get('/:className', async (req, res) => {
    try {
        const { projectId } = req.query;
        const room = await ClassRoom.findOne({ projectId, className: req.params.className.toUpperCase() }).lean();
        if (!room) return res.status(404).json({ message: 'Class not found.' });
        res.status(200).json({ requirements: room.requirements, classTeacher: room.classTeacher || '' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch rules.' });
    }
});

router.put('/:className', async (req, res) => {
    try {
        const { requirements, projectId, classTeacher, skipRegenerate } = req.body;
        const className = req.params.className.toUpperCase();
        await ClassRoom.findOneAndUpdate(
            { projectId, className },
            { requirements, classTeacher: classTeacher || '' },
            { upsert: true, new: true }
        );
        if (skipRegenerate) {
            return res.status(200).json({ message: 'Requirements saved.' });
        }
        const schedules = await buildMasterSchedule(projectId);
        res.status(200).json({ message: 'Rules saved and schedule regenerated!', schedule: schedules[className] || [] });
    } catch (error) {
        console.error('Save rules error:', error);
        res.status(500).json({ error: 'Failed to save rules.' });
    }
});

module.exports = router;
