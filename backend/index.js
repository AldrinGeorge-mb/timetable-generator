const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const { generateTimetable } = require('./utils/generator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('./middleware/auth');

// ─── Models ───────────────────────────────────────────────────────────────────
const User      = require('./models/User');
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
    .then(() => console.log('✅ Connected to MongoDB successfully'))
    .catch((err) => console.error('⚠️ MongoDB connection error:', err.message));

// ─── Helper ────────────────────────────────────────────────────────────────────
async function buildMasterSchedule(projectId) {
    const allClasses = await ClassRoom.find({ projectId }).lean();
    return generateTimetable(allClasses);
}

// ─── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.status(200).json({ message: 'AutoSchedule Pro server is running!' });
});

// ─── Auth Routes ───────────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        let user = await User.findOne({ username });
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

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
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

app.get('/api/auth/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// ─── Project Routes ────────────────────────────────────────────────────────────

app.get('/api/projects', auth, async (req, res) => {
    try {
        const projects = await Project.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects.' });
    }
});

app.post('/api/projects', auth, async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) return res.status(400).json({ error: 'Project name is required.' });
        
        // Ensure name is unique for THIS user
        const existing = await Project.findOne({ userId: req.user.id, name: name.trim() });
        if (existing) return res.status(409).json({ error: 'You already have a project with this name.' });

        const project = await Project.create({ 
            userId: req.user.id, 
            name: name.trim(), 
            description: description || '' 
        });
        res.status(201).json(project);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create project.' });
    }
});

app.delete('/api/projects/:id', auth, async (req, res) => {
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