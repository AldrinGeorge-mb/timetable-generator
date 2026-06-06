const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

// 20 highly distinct, rich Tailwind colors
const COLOR_PALETTE = [
    'bg-red-200 border-red-400',
    'bg-blue-200 border-blue-400',
    'bg-green-200 border-green-400',
    'bg-yellow-200 border-yellow-400',
    'bg-purple-200 border-purple-400',
    'bg-orange-200 border-orange-400',
    'bg-pink-200 border-pink-400',
    'bg-teal-200 border-teal-400',
    'bg-indigo-200 border-indigo-400',
    'bg-lime-200 border-lime-400',
    'bg-amber-200 border-amber-400',
    'bg-cyan-200 border-cyan-400',
    'bg-fuchsia-200 border-fuchsia-400',
    'bg-emerald-200 border-emerald-400',
    'bg-violet-200 border-violet-400',
    'bg-rose-200 border-rose-400',
    'bg-sky-200 border-sky-400',
    'bg-slate-200 border-slate-400',
    'bg-stone-200 border-stone-400',
    'bg-zinc-200 border-zinc-400'
];

function generateTimetable(allClasses) {
    const finalSchedules = {};
    const globalTeacherTracker = {};

    const isTeacherGloballyFree = (teacherName, day, period) => {
        if (!teacherName) return true;
        const timeSlot = `${day}-${period}`;
        if (!globalTeacherTracker[teacherName]) return true;
        return !globalTeacherTracker[teacherName].includes(timeSlot);
    };

    const bookTeacherGlobally = (teacherName, day, period) => {
        if (!teacherName) return;
        const timeSlot = `${day}-${period}`;
        if (!globalTeacherTracker[teacherName]) globalTeacherTracker[teacherName] = [];
        globalTeacherTracker[teacherName].push(timeSlot);
    };

    // Initialize state per class
    const classStates = allClasses.map(currentClass => ({
        className: currentClass.className,
        classTeacher: currentClass.classTeacher || '',
        remainingRequirements: currentClass.requirements.map(req => ({ ...req, remaining: req.periodsPerWeek })),
        schedule: [],
        subjectColors: {},
        colorIndex: 0
    }));

    DAYS.forEach(day => {
        PERIODS.forEach(period => {
            
            // Phase 1: If it's Period 1, let all classes try to book their Class Teacher FIRST
            if (period === 1) {
                classStates.forEach(cState => {
                    if (cState.classTeacher) {
                        const ctReq = cState.remainingRequirements.find(r => r.teacher === cState.classTeacher);
                        if (ctReq && ctReq.remaining > 0 && isTeacherGloballyFree(ctReq.teacher, day, period)) {
                            
                            if (!cState.subjectColors[ctReq.subject]) {
                                cState.subjectColors[ctReq.subject] = COLOR_PALETTE[cState.colorIndex % COLOR_PALETTE.length];
                                cState.colorIndex++;
                            }

                            cState.schedule.push({
                                id: `${cState.className}-${day}-${period}`,
                                day, period,
                                subject: ctReq.subject,
                                teacher: ctReq.teacher,
                                color: cState.subjectColors[ctReq.subject],
                                isClassTeacherPeriod: true
                            });

                            bookTeacherGlobally(ctReq.teacher, day, period);
                            ctReq.remaining -= 1;
                        }
                    }
                });
            }

            // Phase 2: Normal scheduling for any classes that don't have a subject yet for this period
            classStates.forEach(cState => {
                // Skip if this class already has something scheduled for this day/period (e.g. from Phase 1)
                const isSlotFilled = cState.schedule.some(s => s.day === day && s.period === period);
                if (isSlotFilled) return;

                // Sort by remaining periods to prioritize subjects that need more slots
                cState.remainingRequirements.sort((a, b) => b.remaining - a.remaining);

                const previousPeriod = period - 1;
                const lastSubject = cState.schedule.find(s => s.day === day && s.period === previousPeriod)?.subject;

                const getTeacherContinuousCount = (tName, d, p) => {
                    if (!tName) return 0;
                    let count = 0;
                    let curr = p - 1;
                    const breaksBefore = { 3: true, 5: true, 7: true };
                    
                    while (curr >= 1) {
                        if (breaksBefore[curr + 1]) break;
                        
                        if (globalTeacherTracker[tName] && globalTeacherTracker[tName].includes(`${d}-${curr}`)) {
                            count++;
                            curr--;
                        } else break;
                    }
                    return count;
                };

                // Pass 1: Try to find a subject that is NOT adjacent, AND teacher has < 3 continuous periods
                let availableSubjectIndex = cState.remainingRequirements.findIndex(currReq => {
                    const countToday = cState.schedule.filter(s => s.day === day && s.subject === currReq.subject).length;
                    const continuousCount = getTeacherContinuousCount(currReq.teacher, day, period);
                    return currReq.remaining > 0 &&
                        isTeacherGloballyFree(currReq.teacher, day, period) &&
                        countToday < 2 &&
                        currReq.subject !== lastSubject &&
                        continuousCount < 3;
                });

                // Pass 2: Relax subject adjacency, but keep teacher continuous < 3
                if (availableSubjectIndex === -1) {
                    availableSubjectIndex = cState.remainingRequirements.findIndex(currReq => {
                        const countToday = cState.schedule.filter(s => s.day === day && s.subject === currReq.subject).length;
                        const continuousCount = getTeacherContinuousCount(currReq.teacher, day, period);
                        return currReq.remaining > 0 &&
                            isTeacherGloballyFree(currReq.teacher, day, period) &&
                            countToday < 2 &&
                            continuousCount < 3;
                    });
                }

                // Pass 3 (Fallback): Allow >= 3 continuous periods only if it is needed to prevent an empty slot
                if (availableSubjectIndex === -1) {
                    availableSubjectIndex = cState.remainingRequirements.findIndex(currReq => {
                        const countToday = cState.schedule.filter(s => s.day === day && s.subject === currReq.subject).length;
                        return currReq.remaining > 0 &&
                            isTeacherGloballyFree(currReq.teacher, day, period) &&
                            countToday < 2;
                    });
                }

                if (availableSubjectIndex !== -1) {
                    const selectedSubject = cState.remainingRequirements[availableSubjectIndex];

                    if (!cState.subjectColors[selectedSubject.subject]) {
                        cState.subjectColors[selectedSubject.subject] = COLOR_PALETTE[cState.colorIndex % COLOR_PALETTE.length];
                        cState.colorIndex++;
                    }

                    cState.schedule.push({
                        id: `${cState.className}-${day}-${period}`,
                        day, period,
                        subject: selectedSubject.subject,
                        teacher: selectedSubject.teacher,
                        color: cState.subjectColors[selectedSubject.subject]
                    });

                    bookTeacherGlobally(selectedSubject.teacher, day, period);
                    selectedSubject.remaining -= 1;
                }
            });

        });
    });

    // Finalize output
    classStates.forEach(cState => {
        finalSchedules[cState.className] = cState.schedule;
    });

    // ─────────────────────────────────────────────────────────
    // STRICT VERIFICATION ENGINE (10000% Guarantee)
    // ─────────────────────────────────────────────────────────
    const allSlots = [];
    Object.entries(finalSchedules).forEach(([className, schedule]) => {
        schedule.forEach(slot => {
            if (slot.teacher) allSlots.push({ ...slot, className });
        });
    });

    const collisions = [];
    for (let i = 0; i < allSlots.length; i++) {
        for (let j = i + 1; j < allSlots.length; j++) {
            const a = allSlots[i];
            const b = allSlots[j];
            if (a.day === b.day && a.period === b.period && a.teacher === b.teacher) {
                collisions.push(`[${a.day} P${a.period}] Teacher ${a.teacher} double-booked in ${a.className} and ${b.className}`);
            }
        }
    }

    if (collisions.length > 0) {
        console.error("CRITICAL GENERATOR FAILURE: Collisions detected!", collisions);
        throw new Error("Mathematical collision detected in generator: \n" + collisions.join('\n'));
    }

    console.log(`✅ Timetable generated for ${allClasses.length} classes. Verification passed: 0 teacher collisions.`);
    return finalSchedules;
}

module.exports = { generateTimetable };