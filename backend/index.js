const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const { generateTimetable } = require('./utils/generator');

// ─── Models ───────────────────────────────────────────────────────────────────
const Project   = require('./models/Project');
const Teacher   = require('./models/Teacher');
const Subject   = require('./models/Subject');
const ClassRoom = require('./models/ClassRoom');
const Timetable = require('./models/Timetable');

const app = express();
app.use(cors());
app.use(express.json());

// ─── DB Connection ─────────────────────────────────────────────────────────────
mongoose
    .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/autoschedule_pro')
    .then(async () => {
        console.log('✅ Connected to MongoDB successfully');
        await seedDatabase();
    })
    .catch((err) => console.error('⚠️ MongoDB connection error:', err.message));

// ─── Seed ──────────────────────────────────────────────────────────────────────
async function seedDatabase() {
    const projectCount = await Project.countDocuments();
    if (projectCount > 0) {
        console.log('📦 Projects already exist — skipping seed.');
        return;
    }

    console.log('🌱 No projects found — seeding "Depaul" project...');

    // Create the Depaul project
    const depaul = await Project.create({
        name: 'Depaul',
        description: 'Depaul High School Timetable'
    });
    const pid = depaul._id;

    await Teacher.deleteMany({ projectId: pid });
    await Subject.deleteMany({ projectId: pid });
    await ClassRoom.deleteMany({ projectId: pid });
    await Timetable.deleteMany({ projectId: pid });

    await Teacher.insertMany([
        { projectId: pid, name: 'ANN MARY TR',  subjectSpecialization: ['ENG', 'CE'] },
        { projectId: pid, name: 'CELINE TR',    subjectSpecialization: ['IT'] },
        { projectId: pid, name: 'BETTY TR',     subjectSpecialization: ['HINDI'] },
        { projectId: pid, name: 'JITHA TR',     subjectSpecialization: ['MAL', 'MAL/HINDI'] },
        { projectId: pid, name: 'ANUMOL TR',    subjectSpecialization: ['MATHS'] },
        { projectId: pid, name: 'EMY TR',       subjectSpecialization: ['ENG', 'CE', 'PHY/ART'] },
        { projectId: pid, name: 'ANUJA TR',     subjectSpecialization: ['MATHS'] },
        { projectId: pid, name: 'VINEETHA TR',  subjectSpecialization: ['S.S'] },
        { projectId: pid, name: 'RENJINI TR',   subjectSpecialization: ['BIO', 'PHYSICS', 'ZOOLOGY'] },
        { projectId: pid, name: 'SHIJI TR',     subjectSpecialization: ['ENG'] },
        { projectId: pid, name: 'JOSE SIR',     subjectSpecialization: ['MAL'] },
        { projectId: pid, name: 'ANU JOSMEI TR',subjectSpecialization: ['PHYSICS'] },
        { projectId: pid, name: 'DINNY TR',     subjectSpecialization: ['MATHS'] },
        { projectId: pid, name: 'BEMITHA TR',   subjectSpecialization: ['SCI', 'CHE', 'PHY/ART'] },
        { projectId: pid, name: 'CHIPPY TR',    subjectSpecialization: ['S.S'] },
        { projectId: pid, name: 'SHANLEY TR',   subjectSpecialization: ['HINDI', 'MAL/HINDI'] },
        { projectId: pid, name: 'ASHLY TR',     subjectSpecialization: ['CHE', 'PHY/ART'] },
        { projectId: pid, name: 'RAVEENA TR',   subjectSpecialization: ['MATHS'] },
        { projectId: pid, name: 'SRUTHY TR',    subjectSpecialization: ['SCI', 'BOTANY', 'PHY/ART', 'BIO'] },
        { projectId: pid, name: 'DOMINIC SIR',  subjectSpecialization: ['PT'] },
        { projectId: pid, name: 'RONEY FR',     subjectSpecialization: ['S.S'] },
        { projectId: pid, name: 'CHINCHU TR',   subjectSpecialization: ['MAL'] },
        { projectId: pid, name: 'APARNA TR',    subjectSpecialization: ['ENG'] },
    ]);

    await Subject.insertMany([
        { projectId: pid, name: 'ENG' }, { projectId: pid, name: 'IT' }, { projectId: pid, name: 'HINDI' },
        { projectId: pid, name: 'MAL' }, { projectId: pid, name: 'MATHS' }, { projectId: pid, name: 'S.S' },
        { projectId: pid, name: 'BIO' }, { projectId: pid, name: 'PHYSICS' }, { projectId: pid, name: 'CHE' },
        { projectId: pid, name: 'SCI' }, { projectId: pid, name: 'BOTANY' }, { projectId: pid, name: 'ZOOLOGY' },
        { projectId: pid, name: 'PHY/ART' }, { projectId: pid, name: 'PT' }, { projectId: pid, name: 'CE' },
        { projectId: pid, name: 'MAL/HINDI' },
    ]);

    const classData = [
        {
            className: '5A',
            requirements: [
                { subject: 'MATHS',   teacher: 'RAVEENA TR',  periodsPerWeek: 7 },
                { subject: 'ENG',     teacher: 'EMY TR',      periodsPerWeek: 6 },
                { subject: 'MAL',     teacher: 'CHINCHU TR',  periodsPerWeek: 5 },
                { subject: 'HINDI',   teacher: 'BETTY TR',    periodsPerWeek: 4 },
                { subject: 'SCI',     teacher: 'SRUTHY TR',   periodsPerWeek: 4 },
                { subject: 'S.S',     teacher: 'RONEY FR',    periodsPerWeek: 4 },
                { subject: 'IT',      teacher: 'CELINE TR',   periodsPerWeek: 2 },
                { subject: 'PT',      teacher: 'DOMINIC SIR', periodsPerWeek: 1 },
                { subject: 'PHY/ART', teacher: 'SRUTHY TR',   periodsPerWeek: 1 },
                { subject: 'CE',      teacher: 'EMY TR',      periodsPerWeek: 1 },
            ]
        },
        {
            className: '5B',
            requirements: [
                { subject: 'MATHS',   teacher: 'RAVEENA TR',  periodsPerWeek: 7 },
                { subject: 'HINDI',   teacher: 'BETTY TR',    periodsPerWeek: 5 },
                { subject: 'ENG',     teacher: 'APARNA TR',   periodsPerWeek: 5 },
                { subject: 'SCI',     teacher: 'BEMITHA TR',  periodsPerWeek: 4 },
                { subject: 'S.S',     teacher: 'RONEY FR',    periodsPerWeek: 4 },
                { subject: 'MAL',     teacher: 'CHINCHU TR',  periodsPerWeek: 4 },
                { subject: 'IT',      teacher: 'CELINE TR',   periodsPerWeek: 3 },
                { subject: 'PT',      teacher: 'DOMINIC SIR', periodsPerWeek: 1 },
                { subject: 'CE',      teacher: 'ANN MARY TR', periodsPerWeek: 1 },
                { subject: 'PHY/ART', teacher: 'SRUTHY TR',   periodsPerWeek: 1 },
            ]
        },
        {
            className: '6A',
            requirements: [
                { subject: 'MATHS',   teacher: 'ANUJA TR',    periodsPerWeek: 6 },
                { subject: 'ENG',     teacher: 'ANN MARY TR', periodsPerWeek: 6 },
                { subject: 'MAL',     teacher: 'JITHA TR',    periodsPerWeek: 5 },
                { subject: 'SCI',     teacher: 'BEMITHA TR',  periodsPerWeek: 5 },
                { subject: 'S.S',     teacher: 'CHIPPY TR',   periodsPerWeek: 5 },
                { subject: 'HINDI',   teacher: 'BETTY TR',    periodsPerWeek: 4 },
                { subject: 'IT',      teacher: 'CELINE TR',   periodsPerWeek: 2 },
                { subject: 'CE',      teacher: 'ANN MARY TR', periodsPerWeek: 2 },
                { subject: 'PT',      teacher: 'DOMINIC SIR', periodsPerWeek: 1 },
                { subject: 'PHY/ART', teacher: 'BEMITHA TR',  periodsPerWeek: 1 },
            ]
        },
        {
            className: '6B',
            requirements: [
                { subject: 'SCI',     teacher: 'BEMITHA TR',  periodsPerWeek: 6 },
                { subject: 'MAL',     teacher: 'JITHA TR',    periodsPerWeek: 5 },
                { subject: 'S.S',     teacher: 'CHIPPY TR',   periodsPerWeek: 5 },
                { subject: 'ENG',     teacher: 'ANN MARY TR', periodsPerWeek: 5 },
                { subject: 'MATHS',   teacher: 'ANUJA TR',    periodsPerWeek: 5 },
                { subject: 'HINDI',   teacher: 'BETTY TR',    periodsPerWeek: 4 },
                { subject: 'IT',      teacher: 'CELINE TR',   periodsPerWeek: 2 },
                { subject: 'PT',      teacher: 'DOMINIC SIR', periodsPerWeek: 1 },
                { subject: 'PHY/ART', teacher: 'BEMITHA TR',  periodsPerWeek: 1 },
                { subject: 'CE',      teacher: 'ANN MARY TR', periodsPerWeek: 1 },
            ]
        },
        {
            className: '7A',
            requirements: [
                { subject: 'MATHS',   teacher: 'ANUMOL TR',   periodsPerWeek: 6 },
                { subject: 'S.S',     teacher: 'VINEETHA TR', periodsPerWeek: 5 },
                { subject: 'SCI',     teacher: 'BEMITHA TR',  periodsPerWeek: 5 },
                { subject: 'MAL',     teacher: 'JITHA TR',    periodsPerWeek: 5 },
                { subject: 'ENG',     teacher: 'EMY TR',      periodsPerWeek: 5 },
                { subject: 'HINDI',   teacher: 'BETTY TR',    periodsPerWeek: 3 },
                { subject: 'IT',      teacher: 'CELINE TR',   periodsPerWeek: 2 },
                { subject: 'CE',      teacher: 'EMY TR',      periodsPerWeek: 2 },
                { subject: 'PT',      teacher: 'DOMINIC SIR', periodsPerWeek: 1 },
                { subject: 'PHY/ART', teacher: 'ASHLY TR',    periodsPerWeek: 1 },
            ]
        },
        {
            className: '7B',
            requirements: [
                { subject: 'MATHS',   teacher: 'ANUMOL TR',   periodsPerWeek: 6 },
                { subject: 'ENG',     teacher: 'EMY TR',      periodsPerWeek: 5 },
                { subject: 'S.S',     teacher: 'VINEETHA TR', periodsPerWeek: 5 },
                { subject: 'MAL',     teacher: 'JITHA TR',    periodsPerWeek: 5 },
                { subject: 'SCI',     teacher: 'BEMITHA TR',  periodsPerWeek: 5 },
                { subject: 'HINDI',   teacher: 'BETTY TR',    periodsPerWeek: 3 },
                { subject: 'IT',      teacher: 'CELINE TR',   periodsPerWeek: 2 },
                { subject: 'CE',      teacher: 'EMY TR',      periodsPerWeek: 2 },
                { subject: 'PT',      teacher: 'DOMINIC SIR', periodsPerWeek: 1 },
                { subject: 'PHY/ART', teacher: 'ASHLY TR',    periodsPerWeek: 1 },
            ]
        },
        {
            className: '8A',
            requirements: [
                { subject: 'MATHS',   teacher: 'ANUMOL TR',   periodsPerWeek: 6 },
                { subject: 'S.S',     teacher: 'VINEETHA TR', periodsPerWeek: 5 },
                { subject: 'ENG',     teacher: 'ANN MARY TR', periodsPerWeek: 5 },
                { subject: 'MAL',     teacher: 'JOSE SIR',    periodsPerWeek: 4 },
                { subject: 'HINDI',   teacher: 'SHANLEY TR',  periodsPerWeek: 3 },
                { subject: 'PHYSICS', teacher: 'RENJINI TR',  periodsPerWeek: 2 },
                { subject: 'CHE',     teacher: 'BEMITHA TR',  periodsPerWeek: 2 },
                { subject: 'BIO',     teacher: 'SRUTHY TR',   periodsPerWeek: 2 },
                { subject: 'IT',      teacher: 'CELINE TR',   periodsPerWeek: 2 },
                { subject: 'CE',      teacher: 'ANN MARY TR', periodsPerWeek: 2 },
                { subject: 'PT',      teacher: 'DOMINIC SIR', periodsPerWeek: 1 },
                { subject: 'PHY/ART', teacher: 'EMY TR',      periodsPerWeek: 1 },
            ]
        },
        {
            className: '8B',
            requirements: [
                { subject: 'MATHS',   teacher: 'ANUMOL TR',   periodsPerWeek: 6 },
                { subject: 'ENG',     teacher: 'ANN MARY TR', periodsPerWeek: 5 },
                { subject: 'S.S',     teacher: 'CHIPPY TR',   periodsPerWeek: 5 },
                { subject: 'MAL',     teacher: 'JOSE SIR',    periodsPerWeek: 4 },
                { subject: 'HINDI',   teacher: 'SHANLEY TR',  periodsPerWeek: 3 },
                { subject: 'PHYSICS', teacher: 'RENJINI TR',  periodsPerWeek: 2 },
                { subject: 'CHE',     teacher: 'BEMITHA TR',  periodsPerWeek: 2 },
                { subject: 'BIO',     teacher: 'SRUTHY TR',   periodsPerWeek: 2 },
                { subject: 'IT',      teacher: 'CELINE TR',   periodsPerWeek: 2 },
                { subject: 'CE',      teacher: 'ANN MARY TR', periodsPerWeek: 2 },
                { subject: 'PT',      teacher: 'DOMINIC SIR', periodsPerWeek: 1 },
                { subject: 'PHY/ART', teacher: 'EMY TR',      periodsPerWeek: 1 },
            ]
        },
        {
            className: '9A',
            requirements: [
                { subject: 'ENG',     teacher: 'SHIJI TR',      periodsPerWeek: 6 },
                { subject: 'MATHS',   teacher: 'DINNY TR',      periodsPerWeek: 6 },
                { subject: 'MAL',     teacher: 'JOSE SIR',      periodsPerWeek: 5 },
                { subject: 'S.S',     teacher: 'CHIPPY TR',     periodsPerWeek: 5 },
                { subject: 'PHYSICS', teacher: 'ANU JOSMEI TR', periodsPerWeek: 3 },
                { subject: 'CHE',     teacher: 'ASHLY TR',      periodsPerWeek: 3 },
                { subject: 'BIO',     teacher: 'RENJINI TR',    periodsPerWeek: 3 },
                { subject: 'HINDI',   teacher: 'SHANLEY TR',    periodsPerWeek: 3 },
                { subject: 'IT',      teacher: 'CELINE TR',     periodsPerWeek: 2 },
                { subject: 'PT',      teacher: 'DOMINIC SIR',   periodsPerWeek: 1 },
                { subject: 'PHY/ART', teacher: 'SRUTHY TR',     periodsPerWeek: 1 },
            ]
        },
        {
            className: '9B',
            requirements: [
                { subject: 'ENG',     teacher: 'EMY TR',        periodsPerWeek: 6 },
                { subject: 'MATHS',   teacher: 'DINNY TR',      periodsPerWeek: 6 },
                { subject: 'S.S',     teacher: 'CHIPPY TR',     periodsPerWeek: 5 },
                { subject: 'MAL',     teacher: 'JOSE SIR',      periodsPerWeek: 5 },
                { subject: 'BIO',     teacher: 'RENJINI TR',    periodsPerWeek: 3 },
                { subject: 'PHYSICS', teacher: 'ANU JOSMEI TR', periodsPerWeek: 3 },
                { subject: 'CHE',     teacher: 'ASHLY TR',      periodsPerWeek: 3 },
                { subject: 'HINDI',   teacher: 'SHANLEY TR',    periodsPerWeek: 3 },
                { subject: 'IT',      teacher: 'CELINE TR',     periodsPerWeek: 2 },
                { subject: 'PT',      teacher: 'DOMINIC SIR',   periodsPerWeek: 1 },
                { subject: 'PHY/ART', teacher: 'SRUTHY TR',     periodsPerWeek: 1 },
            ]
        },
        {
            className: '10A',
            requirements: [
                { subject: 'MATHS',   teacher: 'ANUJA TR',      periodsPerWeek: 7 },
                { subject: 'ENG',     teacher: 'SHIJI TR',      periodsPerWeek: 5 },
                { subject: 'MAL',     teacher: 'JOSE SIR',      periodsPerWeek: 5 },
                { subject: 'S.S',     teacher: 'VINEETHA TR',   periodsPerWeek: 5 },
                { subject: 'PHYSICS', teacher: 'ANU JOSMEI TR', periodsPerWeek: 3 },
                { subject: 'CHE',     teacher: 'ASHLY TR',      periodsPerWeek: 3 },
                { subject: 'BIO',     teacher: 'RENJINI TR',    periodsPerWeek: 3 },
                { subject: 'HINDI',   teacher: 'SHANLEY TR',    periodsPerWeek: 3 },
                { subject: 'IT',      teacher: 'CELINE TR',     periodsPerWeek: 2 },
            ]
        },
        {
            className: '10B',
            requirements: [
                { subject: 'MATHS',   teacher: 'ANUJA TR',      periodsPerWeek: 7 },
                { subject: 'ENG',     teacher: 'SHIJI TR',      periodsPerWeek: 5 },
                { subject: 'S.S',     teacher: 'VINEETHA TR',   periodsPerWeek: 5 },
                { subject: 'MAL',     teacher: 'JOSE SIR',      periodsPerWeek: 5 },
                { subject: 'PHYSICS', teacher: 'ANU JOSMEI TR', periodsPerWeek: 3 },
                { subject: 'CHE',     teacher: 'ASHLY TR',      periodsPerWeek: 3 },
                { subject: 'BIO',     teacher: 'RENJINI TR',    periodsPerWeek: 3 },
                { subject: 'HINDI',   teacher: 'SHANLEY TR',    periodsPerWeek: 3 },
                { subject: 'IT',      teacher: 'CELINE TR',     periodsPerWeek: 2 },
            ]
        },
        {
            className: '11',
            requirements: [
                { subject: 'MATHS',     teacher: 'DINNY TR',      periodsPerWeek: 7 },
                { subject: 'PHYSICS',   teacher: 'ANU JOSMEI TR', periodsPerWeek: 6 },
                { subject: 'CHE',       teacher: 'ASHLY TR',      periodsPerWeek: 6 },
                { subject: 'MAL/HINDI', teacher: 'JITHA TR',      periodsPerWeek: 4 },
                { subject: 'ENG',       teacher: 'SHIJI TR',      periodsPerWeek: 4 },
                { subject: 'BOTANY',    teacher: 'SRUTHY TR',     periodsPerWeek: 4 },
                { subject: 'ZOOLOGY',   teacher: 'RENJINI TR',    periodsPerWeek: 4 },
            ]
        },
        {
            className: '12',
            requirements: [
                { subject: 'MATHS',     teacher: 'DINNY TR',      periodsPerWeek: 7 },
                { subject: 'PHYSICS',   teacher: 'ANU JOSMEI TR', periodsPerWeek: 6 },
                { subject: 'CHE',       teacher: 'ASHLY TR',      periodsPerWeek: 6 },
                { subject: 'MAL/HINDI', teacher: 'SHANLEY TR',    periodsPerWeek: 4 },
                { subject: 'ENG',       teacher: 'SHIJI TR',      periodsPerWeek: 4 },
                { subject: 'BOTANY',    teacher: 'SRUTHY TR',     periodsPerWeek: 4 },
                { subject: 'ZOOLOGY',   teacher: 'RENJINI TR',    periodsPerWeek: 4 },
            ]
        },
    ];

    await ClassRoom.insertMany(classData.map(c => ({ ...c, projectId: pid })));
    console.log(`✅ Seed complete: Depaul project seeded with ${classData.length} classes.`);
}

// ─── Helper ────────────────────────────────────────────────────────────────────
async function buildMasterSchedule(projectId) {
    const allClasses = await ClassRoom.find({ projectId }).lean();
    return generateTimetable(allClasses);
}

// ─── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.status(200).json({ message: 'AutoSchedule Pro server is running!' });
});

// ─── Project Routes ────────────────────────────────────────────────────────────

app.get('/api/projects', async (req, res) => {
    try {
        const projects = await Project.find().sort({ createdAt: -1 }).lean();
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects.' });
    }
});

app.post('/api/projects', async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) return res.status(400).json({ error: 'Project name is required.' });
        const project = await Project.create({ name: name.trim(), description: description || '' });
        res.status(201).json(project);
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ error: 'A project with this name already exists.' });
        res.status(500).json({ error: 'Failed to create project.' });
    }
});

app.delete('/api/projects/:id', async (req, res) => {
    try {
        const { id } = req.params;
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

// ─── Schedule Routes ───────────────────────────────────────────────────────────

app.get('/api/schedule', async (req, res) => {
    try {
        const { projectId } = req.query;
        if (!projectId) return res.status(400).json({ error: 'projectId is required.' });

        let timetable = await Timetable.findOne({ projectId });

        if (!timetable) {
            console.log(`🤖 No saved timetable for project ${projectId}. Generating...`);
            const generatedSchedules = await buildMasterSchedule(projectId);
            timetable = new Timetable({ projectId, schedules: generatedSchedules });
            await timetable.save();
        } else {
            console.log(`📦 Loaded schedule for project ${projectId}.`);
        }

        const schedulesObj = {};
        timetable.schedules.forEach((slots, cls) => { schedulesObj[cls] = slots; });
        res.status(200).json(schedulesObj);
    } catch (error) {
        console.error('Schedule fetch error:', error);
        res.status(500).json({ message: 'Failed to fetch or generate schedule.' });
    }
});

app.post('/api/schedule/save', async (req, res) => {
    try {
        const { allSchedules, projectId } = req.body;
        if (!allSchedules || !projectId) return res.status(400).json({ error: 'Missing allSchedules or projectId.' });

        await Timetable.findOneAndUpdate(
            { projectId },
            { schedules: allSchedules, updatedAt: Date.now() },
            { upsert: true, new: true }
        );
        res.json({ message: 'Timetable saved successfully.' });
    } catch (error) {
        console.error('Save schedule error:', error);
        res.status(500).json({ error: 'Failed to save schedule.' });
    }
});

app.post('/api/schedule/regenerate', async (req, res) => {
    try {
        const { projectId } = req.body;
        if (!projectId) return res.status(400).json({ error: 'projectId is required.' });

        const generatedSchedules = await buildMasterSchedule(projectId);
        await Timetable.findOneAndUpdate(
            { projectId },
            { schedules: generatedSchedules, updatedAt: Date.now() },
            { upsert: true, new: true }
        );
        res.json(generatedSchedules);
    } catch (error) {
        console.error('Regenerate error:', error);
        res.status(500).json({ error: 'Failed to regenerate schedule.' });
    }
});

// ─── ClassRoom Routes ──────────────────────────────────────────────────────────

app.get('/api/classes', async (req, res) => {
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

app.get('/api/rules/:className', async (req, res) => {
    try {
        const { projectId } = req.query;
        const room = await ClassRoom.findOne({ projectId, className: req.params.className.toUpperCase() }).lean();
        if (!room) return res.status(404).json({ message: 'Class not found.' });
        res.status(200).json({ requirements: room.requirements, classTeacher: room.classTeacher || '' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch rules.' });
    }
});

app.put('/api/rules/:className', async (req, res) => {
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

// Explicitly generate timetable for the whole project
app.post('/api/schedule/generate', async (req, res) => {
    try {
        const { projectId } = req.body;
        if (!projectId) return res.status(400).json({ error: 'projectId is required.' });
        
        const generatedSchedules = await buildMasterSchedule(projectId);
        
        await Timetable.findOneAndUpdate(
            { projectId },
            { schedules: generatedSchedules },
            { upsert: true, new: true }
        );
        
        res.status(200).json({ message: 'Timetable generated successfully for all classes!' });
    } catch (error) {
        console.error('Generation error:', error);
        res.status(500).json({ error: 'Failed to generate timetable.' });
    }
});

app.post('/api/classes', async (req, res) => {
    try {
        const { className, projectId } = req.body;
        if (!className || !projectId) return res.status(400).json({ error: 'className and projectId are required.' });
        const existing = await ClassRoom.findOne({ projectId, className: className.toUpperCase() });
        if (existing) return res.status(409).json({ error: 'Class already exists.' });
        const newClass = await ClassRoom.create({ projectId, className: className.toUpperCase(), requirements: [] });
        res.status(201).json(newClass);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create class.' });
    }
});

app.delete('/api/classes/:className', async (req, res) => {
    try {
        const { projectId } = req.query;
        await ClassRoom.deleteOne({ projectId, className: req.params.className.toUpperCase() });
        res.status(200).json({ message: 'Class deleted.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete class.' });
    }
});

// ─── Teacher Routes ────────────────────────────────────────────────────────────

app.get('/api/teachers', async (req, res) => {
    try {
        const { projectId } = req.query;
        if (!projectId) return res.status(400).json({ error: 'projectId is required.' });
        const teachers = await Teacher.find({ projectId }).lean();
        res.status(200).json(teachers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch teachers.' });
    }
});

app.post('/api/teachers', async (req, res) => {
    try {
        const { name, assignments, projectId } = req.body;
        const teacher = await Teacher.create({ projectId, name: name.toUpperCase(), assignments: assignments || [] });
        res.status(201).json(teacher);
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ error: 'Teacher already exists.' });
        res.status(500).json({ error: 'Failed to create teacher.' });
    }
});

app.put('/api/teachers/:name', async (req, res) => {
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

app.delete('/api/teachers/:name', async (req, res) => {
    try {
        const { projectId } = req.query;
        await Teacher.deleteOne({ projectId, name: req.params.name.toUpperCase() });
        res.status(200).json({ message: 'Teacher deleted.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete teacher.' });
    }
});

// ─── Subject Routes ────────────────────────────────────────────────────────────

app.get('/api/subjects', async (req, res) => {
    try {
        const { projectId } = req.query;
        if (!projectId) return res.status(400).json({ error: 'projectId is required.' });
        const subjects = await Subject.find({ projectId }).lean();
        res.status(200).json(subjects);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch subjects.' });
    }
});

app.post('/api/subjects', async (req, res) => {
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

app.delete('/api/subjects/:name', async (req, res) => {
    try {
        const { projectId } = req.query;
        await Subject.deleteOne({ projectId, name: req.params.name.toUpperCase() });
        res.status(200).json({ message: 'Subject deleted.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete subject.' });
    }
});

// ─── Validate Move ─────────────────────────────────────────────────────────────
app.post('/api/validate-move', async (req, res) => {
    const { teacherName, targetDay, targetPeriod, currentClassName, allSchedules } = req.body;
    try {
        const currentSchedule = allSchedules[currentClassName] || [];
        for (const [className, slots] of Object.entries(allSchedules)) {
            if (className === currentClassName) continue;
            const conflict = slots.find(s => s.day === targetDay && s.period === targetPeriod && s.teacher === teacherName);
            if (conflict) {
                return res.status(200).json({ isValid: false, message: `Conflict: ${teacherName} is already teaching ${conflict.subject} in Class ${className} at this time.` });
            }
        }
        const sameClassConflict = currentSchedule.find(s => s.day === targetDay && s.period === targetPeriod);
        if (sameClassConflict) {
            return res.status(200).json({ isValid: false, message: `Slot ${targetDay} Period ${targetPeriod} in Class ${currentClassName} is already occupied by ${sameClassConflict.subject}.` });
        }
        return res.status(200).json({ isValid: true, message: 'Move is safe.' });
    } catch (error) {
        console.error('Validate move error:', error);
        res.status(500).json({ error: 'Failed to validate move.' });
    }
});

// ─── Suggest Alternatives ──────────────────────────────────────────────────────
app.post('/api/suggest-alternatives', async (req, res) => {
    const { teacherName, originalDay, originalPeriod, currentClassName, allSchedules } = req.body;
    try {
        const currentSchedule = allSchedules[currentClassName] || [];
        const DAYS    = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const PERIODS = [1, 2, 3, 4, 5, 6, 7];
        const safeEmptySlots = [];
        const safeSwapSlots  = [];

        for (const day of DAYS) {
            for (const period of PERIODS) {
                if (day === originalDay && period === originalPeriod) continue;
                let draggedTeacherBusy = false;
                for (const [cls, slots] of Object.entries(allSchedules)) {
                    if (cls === currentClassName) continue;
                    if (slots.some(s => s.day === day && s.period === period && s.teacher === teacherName)) {
                        draggedTeacherBusy = true; break;
                    }
                }
                if (draggedTeacherBusy) continue;
                const occupant = currentSchedule.find(s => s.day === day && s.period === period);
                if (!occupant) {
                    safeEmptySlots.push({ day, period });
                } else {
                    let occupantTeacherBusy = false;
                    for (const [cls, slots] of Object.entries(allSchedules)) {
                        if (cls === currentClassName) continue;
                        if (slots.some(s => s.day === originalDay && s.period === originalPeriod && s.teacher === occupant.teacher)) {
                            occupantTeacherBusy = true; break;
                        }
                    }
                    if (!occupantTeacherBusy) {
                        safeSwapSlots.push({ day, period, subject: occupant.subject, teacher: occupant.teacher, color: occupant.color || '', blockId: occupant.id });
                    }
                }
            }
        }
        res.status(200).json({ safeEmptySlots, safeSwapSlots });
    } catch (error) {
        console.error('Suggest alternatives error:', error);
        res.status(500).json({ error: 'Failed to compute alternatives.' });
    }
});

// ─── Find Cascade Chains ───────────────────────────────────────────────────────
app.post('/api/find-cascade', async (req, res) => {
    const { draggedBlock, targetDay, targetPeriod, currentClassName, allSchedules } = req.body;
    try {
        const DAYS    = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const PERIODS = [1, 2, 3, 4, 5, 6, 7];

        const isGloballyFree = (teacher, day, period, vp) => {
            for (const [id, pos] of vp) {
                if (pos.day === day && pos.period === period) {
                    let blockTeacher = null;
                    for (const slots of Object.values(allSchedules)) {
                        const b = slots.find(s => s.id === id);
                        if (b) { blockTeacher = b.teacher; break; }
                    }
                    if (blockTeacher === teacher) return false;
                }
            }
            for (const [cls, slots] of Object.entries(allSchedules)) {
                for (const s of slots) {
                    if (vp.has(s.id)) continue;
                    if (s.day === day && s.period === period && s.teacher === teacher) return false;
                }
            }
            return true;
        };

        const getVirtualOccupant = (cls, day, period, vp) => {
            for (const [id, pos] of vp) {
                if (pos.className === cls && pos.day === day && pos.period === period) {
                    return allSchedules[cls]?.find(s => s.id === id) || null;
                }
            }
            for (const s of (allSchedules[cls] || [])) {
                if (s.day === day && s.period === period && !vp.has(s.id)) return s;
            }
            return null;
        };

        const MAX_DEPTH = 3, MAX_CHAINS = 6;
        const foundChains = [];
        const displacedBlocks = [];
        const occupantAtT = getVirtualOccupant(currentClassName, targetDay, targetPeriod, new Map());
        if (occupantAtT) displacedBlocks.push({ ...occupantAtT, className: currentClassName });

        for (const [cls, slots] of Object.entries(allSchedules)) {
            if (cls === currentClassName) continue;
            for (const s of slots) {
                if (s.day === targetDay && s.period === targetPeriod && s.teacher === draggedBlock.teacher)
                    displacedBlocks.push({ ...s, className: cls });
            }
        }

        const initVP = new Map([[draggedBlock.id, { className: currentClassName, day: targetDay, period: targetPeriod }]]);
        const initMove = { blockId: draggedBlock.id, subject: draggedBlock.subject, teacher: draggedBlock.teacher, fromDay: draggedBlock.day, fromPeriod: draggedBlock.period, toDay: targetDay, toPeriod: targetPeriod, className: currentClassName, isTarget: true };
        const queue = [{ vp: initVP, displaced: displacedBlocks, displacedIds: new Set(displacedBlocks.map(b => b.id)), chain: [initMove] }];

        while (queue.length > 0 && foundChains.length < MAX_CHAINS) {
            const { vp, displaced, displacedIds, chain } = queue.shift();
            if (displaced.length === 0) { foundChains.push(chain); continue; }
            if (chain.length > MAX_DEPTH + 1) continue;
            const toPlace = displaced[0];
            const remaining = displaced.slice(1);

            const targetSlots = [];
            for (const d of DAYS) {
                for (const p of PERIODS) {
                    if (d === draggedBlock.day && p === draggedBlock.period) {
                        targetSlots.unshift({day: d, period: p});
                    } else {
                        targetSlots.push({day: d, period: p});
                    }
                }
            }

            for (const { day, period } of targetSlots) {
                    if (day === toPlace.day && period === toPlace.period) continue;
                    if (!isGloballyFree(toPlace.teacher, day, period, vp)) continue;
                    const newVP = new Map(vp);
                    newVP.set(toPlace.id, { className: toPlace.className, day, period });
                    const move = { blockId: toPlace.id, subject: toPlace.subject, teacher: toPlace.teacher, fromDay: toPlace.day, fromPeriod: toPlace.period, toDay: day, toPeriod: period, className: toPlace.className, isTarget: false };
                    const vOccupant = getVirtualOccupant(toPlace.className, day, period, vp);
                    let otherClassOccupant = null;
                    for (const cls of Object.keys(allSchedules)) {
                        if (cls === toPlace.className) continue;
                        const occ = getVirtualOccupant(cls, day, period, vp);
                        if (occ && occ.teacher === toPlace.teacher) otherClassOccupant = { ...occ, className: cls };
                    }
                    const newlyDisplaced = [];
                    let validPlacement = true;
                    if (vOccupant) {
                        if (displacedIds.has(vOccupant.id)) validPlacement = false;
                        else newlyDisplaced.push({ ...vOccupant, className: toPlace.className });
                    } else {
                        if (!(day === draggedBlock.day && period === draggedBlock.period && toPlace.className === currentClassName)) {
                            validPlacement = false;
                        }
                    }
                    if (otherClassOccupant) {
                        if (displacedIds.has(otherClassOccupant.id)) validPlacement = false;
                        else newlyDisplaced.push(otherClassOccupant);
                    }
                    if (!validPlacement || chain.length + newlyDisplaced.length > MAX_DEPTH + 1) continue;
                    const newIds = new Set(displacedIds);
                    newlyDisplaced.forEach(b => newIds.add(b.id));
                    queue.push({ vp: newVP, displaced: [...remaining, ...newlyDisplaced], displacedIds: newIds, chain: [...chain, move] });
                }
        }

        foundChains.sort((a, b) => a.length - b.length);
        res.json({ chains: foundChains, blocked: false });
    } catch (error) {
        console.error('Find cascade error:', error);
        res.status(500).json({ error: 'Failed to find cascade chains.' });
    }
});

// ─── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 AutoSchedule Pro server running on port ${PORT}`);
});