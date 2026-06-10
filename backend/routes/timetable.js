const express = require('express');
const router = express.Router();
const Timetable = require('../models/Timetable');
const ClassRoom = require('../models/ClassRoom');
const { generateTimetable } = require('../utils/generator');
const Project = require('../models/Project');

// Helper
async function buildMasterSchedule(projectId) {
    const project = await Project.findById(projectId).lean();
    const allClasses = await ClassRoom.find({ projectId }).lean();
    return generateTimetable(allClasses, project);
}

// ─── Schedule Base Routes ───────────────────────────────────────────────────────────

router.get('/', async (req, res) => {
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

router.post('/save', async (req, res) => {
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

router.post('/regenerate', async (req, res) => {
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

router.post('/generate', async (req, res) => {
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

// ─── Validate Move ─────────────────────────────────────────────────────────────
router.post('/validate-move', async (req, res) => {
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
router.post('/suggest-alternatives', async (req, res) => {
    const { teacherName, originalDay, originalPeriod, currentClassName, allSchedules, settings } = req.body;
    try {
        const currentSchedule = allSchedules[currentClassName] || [];
        const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const numDays = settings?.numberOfDays || 5;
        const DAYS = ALL_DAYS.slice(0, numDays);
        const numPeriods = settings?.periodsPerDay || 7;
        const PERIODS = Array.from({ length: numPeriods }, (_, i) => i + 1);
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
router.post('/find-cascade', async (req, res) => {
    const { draggedBlock, targetDay, targetPeriod, currentClassName, allSchedules, settings } = req.body;
    try {
        const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const numDays = settings?.numberOfDays || 5;
        const DAYS = ALL_DAYS.slice(0, numDays);
        const numPeriods = settings?.periodsPerDay || 7;
        const PERIODS = Array.from({ length: numPeriods }, (_, i) => i + 1);

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

        const MAX_DEPTH = 4, MAX_CHAINS = 6;
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

module.exports = router;
