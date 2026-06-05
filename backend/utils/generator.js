const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

// A nice palette of Tailwind colors for our subjects
// A massive palette of 17 distinct Tailwind colors (No white)
// 20 highly distinct, rich Tailwind colors (No white or washed-out pastels)
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
function generateTimetable(classes) {
    const finalSchedules = {};
    const teacherTracker = {};

    const isTeacherFree = (teacherName, day, period) => {
        const timeSlot = `${day}-${period}`;
        if (!teacherTracker[teacherName]) return true;
        return !teacherTracker[teacherName].includes(timeSlot);
    };

    const bookTeacher = (teacherName, day, period) => {
        const timeSlot = `${day}-${period}`;
        if (!teacherTracker[teacherName]) teacherTracker[teacherName] = [];
        teacherTracker[teacherName].push(timeSlot);
    };

    classes.forEach(currentClass => {
        const schedule = [];
        let remainingRequirements = currentClass.requirements.map(req => ({ ...req, remaining: req.periodsPerWeek }));

        // --- NEW: Color Tracking System ---
        const subjectColors = {};
        let colorIndex = 0;

        DAYS.forEach(day => {
            PERIODS.forEach(period => {

                const availableSubjectIndex = remainingRequirements.findIndex(req =>
                    req.remaining > 0 && isTeacherFree(req.teacher, day, period)
                );

                if (availableSubjectIndex !== -1) {
                    const selectedSubject = remainingRequirements[availableSubjectIndex];

                    // 3. REPLACE EVERYTHING INSIDE THE 'IF' STATEMENT WITH THIS:

                    // If this subject doesn't have a color yet, assign it one from the palette
                    if (!subjectColors[selectedSubject.subject]) {
                        subjectColors[selectedSubject.subject] = COLOR_PALETTE[colorIndex % COLOR_PALETTE.length];
                        colorIndex++; // Move to the next color for the next new subject
                    }

                    // Push to schedule using the tracked color
                    schedule.push({
                        id: `${currentClass.className}-${day}-${period}`,
                        day,
                        period,
                        subject: selectedSubject.subject,
                        teacher: selectedSubject.teacher,
                        color: subjectColors[selectedSubject.subject]
                    });

                    bookTeacher(selectedSubject.teacher, day, period);
                    remainingRequirements[availableSubjectIndex].remaining -= 1;
                }
            });
        });

        finalSchedules[currentClass.className] = schedule;
    });

    return finalSchedules;
}

module.exports = { generateTimetable };