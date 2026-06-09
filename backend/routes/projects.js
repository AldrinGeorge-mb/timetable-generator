const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');
const ClassRoom = require('../models/ClassRoom');
const Timetable = require('../models/Timetable');

router.get('/', auth, async (req, res) => {
    try {
        const projects = await Project.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
        res.status(200).json(projects);
    } catch (error) {
        console.error(error); res.status(500).json({ error: 'Failed to fetch projects.' });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const { name, description, settings } = req.body;
        if (!name) return res.status(400).json({ error: 'Project name is required.' });
        
        const existing = await Project.findOne({ userId: req.user.id, name: name.trim() });
        if (existing) return res.status(409).json({ error: 'You already have a project with this name.' });

        const projectData = {
            userId: req.user.id, 
            name: name.trim(), 
            description: description || ''
        };
        if (settings) projectData.settings = settings;

        const project = await Project.create(projectData);
        res.status(201).json(project);
    } catch (error) {
        console.error('PROJECT CREATE ERROR:', error); res.status(500).json({ error: 'Failed to create project.' });
    }
});

router.put('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Project name is required.' });

        const project = await Project.findOne({ _id: id, userId: req.user.id });
        if (!project) return res.status(404).json({ error: 'Project not found.' });

        const existing = await Project.findOne({ userId: req.user.id, name: name.trim(), _id: { $ne: id } });
        if (existing) return res.status(409).json({ error: 'You already have a project with this name.' });

        project.name = name.trim();
        await project.save();
        
        res.status(200).json(project);
    } catch (error) {
        console.error('PROJECT RENAME ERROR:', error);
        res.status(500).json({ error: 'Failed to rename project.' });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const project = await Project.findOne({ _id: id, userId: req.user.id });
        if (!project) return res.status(404).json({ error: 'Project not found or unauthorized.' });

        await Promise.all([
            Project.deleteOne({ _id: id }),
            Teacher.deleteMany({ projectId: id }),
            Subject.deleteMany({ projectId: id }),
            ClassRoom.deleteMany({ projectId: id }),
            Timetable.deleteMany({ projectId: id }),
        ]);
        res.status(200).json({ message: 'Project and all associated data deleted.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete project.' });
    }
});

module.exports = router;
