/**
 * fix-depaul.js — Fixes period counts for the "Depaul" project only.
 *
 * Issues fixed:
 *   6A  : total was 37 (ENG 6→5, CE 2→1)
 *   9A  : total was 38 (MAL 5→4, ENG 6→5, HINDI 3→2)
 *   9B  : total was 38 (MAL 5→4, ENG 6→5, HINDI 3→2)
 *   10A : total was 36 (MATHS 7→6)
 *   10B : total was 36 (MATHS 7→6)
 *
 * Usage: node fix-depaul.js
 */
const mongoose = require('mongoose');
require('dotenv').config();

const Project  = require('./models/Project');
const ClassRoom = require('./models/ClassRoom');
const Timetable = require('./models/Timetable');

const FIXED_CLASSES = {
    '6A': [
        { subject: 'MATHS',   teacher: 'ANUJA TR',    periodsPerWeek: 6 },
        { subject: 'ENG',     teacher: 'ANN MARY TR', periodsPerWeek: 5 }, // was 6 → 5
        { subject: 'MAL',     teacher: 'JITHA TR',    periodsPerWeek: 5 },
        { subject: 'SCI',     teacher: 'BEMITHA TR',  periodsPerWeek: 5 },
        { subject: 'S.S',     teacher: 'CHIPPY TR',   periodsPerWeek: 5 },
        { subject: 'HINDI',   teacher: 'BETTY TR',    periodsPerWeek: 4 },
        { subject: 'IT',      teacher: 'CELINE TR',   periodsPerWeek: 2 },
        { subject: 'CE',      teacher: 'ANN MARY TR', periodsPerWeek: 1 }, // was 2 → 1
        { subject: 'PT',      teacher: 'DOMINIC SIR', periodsPerWeek: 1 },
        { subject: 'PHY/ART', teacher: 'BEMITHA TR',  periodsPerWeek: 1 },
        // Total: 6+5+5+5+5+4+2+1+1+1 = 35 ✓
    ],
    '9A': [
        { subject: 'ENG',     teacher: 'SHIJI TR',      periodsPerWeek: 5 }, // was 6 → 5
        { subject: 'MATHS',   teacher: 'DINNY TR',      periodsPerWeek: 6 },
        { subject: 'MAL',     teacher: 'JOSE SIR',      periodsPerWeek: 4 }, // was 5 → 4
        { subject: 'S.S',     teacher: 'CHIPPY TR',     periodsPerWeek: 5 },
        { subject: 'PHYSICS', teacher: 'ANU JOSMEI TR', periodsPerWeek: 3 },
        { subject: 'CHE',     teacher: 'ASHLY TR',      periodsPerWeek: 3 },
        { subject: 'BIO',     teacher: 'RENJINI TR',    periodsPerWeek: 3 },
        { subject: 'HINDI',   teacher: 'SHANLEY TR',    periodsPerWeek: 2 }, // was 3 → 2
        { subject: 'IT',      teacher: 'CELINE TR',     periodsPerWeek: 2 },
        { subject: 'PT',      teacher: 'DOMINIC SIR',   periodsPerWeek: 1 },
        { subject: 'PHY/ART', teacher: 'SRUTHY TR',     periodsPerWeek: 1 },
        // Total: 5+6+4+5+3+3+3+2+2+1+1 = 35 ✓
    ],
    '9B': [
        { subject: 'ENG',     teacher: 'EMY TR',        periodsPerWeek: 5 }, // was 6 → 5
        { subject: 'MATHS',   teacher: 'DINNY TR',      periodsPerWeek: 6 },
        { subject: 'S.S',     teacher: 'CHIPPY TR',     periodsPerWeek: 5 },
        { subject: 'MAL',     teacher: 'JOSE SIR',      periodsPerWeek: 4 }, // was 5 → 4
        { subject: 'BIO',     teacher: 'RENJINI TR',    periodsPerWeek: 3 },
        { subject: 'PHYSICS', teacher: 'ANU JOSMEI TR', periodsPerWeek: 3 },
        { subject: 'CHE',     teacher: 'ASHLY TR',      periodsPerWeek: 3 },
        { subject: 'HINDI',   teacher: 'SHANLEY TR',    periodsPerWeek: 2 }, // was 3 → 2
        { subject: 'IT',      teacher: 'CELINE TR',     periodsPerWeek: 2 },
        { subject: 'PT',      teacher: 'DOMINIC SIR',   periodsPerWeek: 1 },
        { subject: 'PHY/ART', teacher: 'SRUTHY TR',     periodsPerWeek: 1 },
        // Total: 5+6+5+4+3+3+3+2+2+1+1 = 35 ✓
    ],
    '10A': [
        { subject: 'MATHS',   teacher: 'ANUJA TR',      periodsPerWeek: 6 }, // was 7 → 6
        { subject: 'ENG',     teacher: 'SHIJI TR',      periodsPerWeek: 5 },
        { subject: 'MAL',     teacher: 'JOSE SIR',      periodsPerWeek: 5 },
        { subject: 'S.S',     teacher: 'VINEETHA TR',   periodsPerWeek: 5 },
        { subject: 'PHYSICS', teacher: 'ANU JOSMEI TR', periodsPerWeek: 3 },
        { subject: 'CHE',     teacher: 'ASHLY TR',      periodsPerWeek: 3 },
        { subject: 'BIO',     teacher: 'RENJINI TR',    periodsPerWeek: 3 },
        { subject: 'HINDI',   teacher: 'SHANLEY TR',    periodsPerWeek: 3 },
        { subject: 'IT',      teacher: 'CELINE TR',     periodsPerWeek: 2 },
        // Total: 6+5+5+5+3+3+3+3+2 = 35 ✓
    ],
    '10B': [
        { subject: 'MATHS',   teacher: 'ANUJA TR',      periodsPerWeek: 6 }, // was 7 → 6
        { subject: 'ENG',     teacher: 'SHIJI TR',      periodsPerWeek: 5 },
        { subject: 'S.S',     teacher: 'VINEETHA TR',   periodsPerWeek: 5 },
        { subject: 'MAL',     teacher: 'JOSE SIR',      periodsPerWeek: 5 },
        { subject: 'PHYSICS', teacher: 'ANU JOSMEI TR', periodsPerWeek: 3 },
        { subject: 'CHE',     teacher: 'ASHLY TR',      periodsPerWeek: 3 },
        { subject: 'BIO',     teacher: 'RENJINI TR',    periodsPerWeek: 3 },
        { subject: 'HINDI',   teacher: 'SHANLEY TR',    periodsPerWeek: 3 },
        { subject: 'IT',      teacher: 'CELINE TR',     periodsPerWeek: 2 },
        // Total: 6+5+5+5+3+3+3+3+2 = 35 ✓
    ],
};

async function fix() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/autoschedule_pro');
    console.log('✅ Connected to MongoDB');

    // Find the "Depaul" project (not Depaul2)
    const project = await Project.findOne({ name: 'Depaul' });
    if (!project) {
        console.error('❌ Project "Depaul" not found!');
        process.exit(1);
    }
    const pid = project._id;
    console.log(`📦 Found Depaul project: ${pid}`);

    // Apply fixes to each affected class
    for (const [className, requirements] of Object.entries(FIXED_CLASSES)) {
        const result = await ClassRoom.findOneAndUpdate(
            { projectId: pid, className },
            { requirements },
            { new: true }
        );
        if (result) {
            const total = requirements.reduce((sum, r) => sum + r.periodsPerWeek, 0);
            console.log(`  ✅ ${className}: updated (total = ${total} periods)`);
        } else {
            console.log(`  ⚠️  ${className}: not found in DB`);
        }
    }

    // Delete the old timetable so it regenerates fresh on next load
    await Timetable.deleteOne({ projectId: pid });
    console.log('\n🗑  Deleted old timetable — will regenerate on next page load');
    console.log('\n✨ All done! Open the Depaul project in the app to get a fresh timetable.\n');

    await mongoose.disconnect();
    process.exit(0);
}

fix().catch(err => { console.error(err); process.exit(1); });
