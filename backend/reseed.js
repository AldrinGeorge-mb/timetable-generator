/**
 * reseed.js — Run once to drop old data and re-seed with the full school dataset.
 * Usage: node reseed.js
 */
const mongoose = require('mongoose');
require('dotenv').config();

const Teacher   = require('./models/Teacher');
const Subject   = require('./models/Subject');
const ClassRoom = require('./models/ClassRoom');

async function reseed() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/autoschedule_pro');
    console.log('✅ Connected');

    await Promise.all([
        Teacher.deleteMany({}),
        Subject.deleteMany({}),
        ClassRoom.deleteMany({}),
    ]);
    console.log('🗑  Cleared all collections');

    // Trigger the seed by starting the server would be one approach,
    // but we just replicate it here directly.

    await Teacher.insertMany([
        { name: 'ANN MARY TR',   subjectSpecialization: ['ENG', 'CE'] },
        { name: 'CELINE TR',     subjectSpecialization: ['IT'] },
        { name: 'BETTY TR',      subjectSpecialization: ['HINDI'] },
        { name: 'JITHA TR',      subjectSpecialization: ['MAL', 'MAL/HINDI'] },
        { name: 'ANUMOL TR',     subjectSpecialization: ['MATHS'] },
        { name: 'EMY TR',        subjectSpecialization: ['ENG', 'CE', 'PHY/ART'] },
        { name: 'ANUJA TR',      subjectSpecialization: ['MATHS'] },
        { name: 'VINEETHA TR',   subjectSpecialization: ['S.S'] },
        { name: 'RENJINI TR',    subjectSpecialization: ['BIO', 'PHYSICS', 'ZOOLOGY'] },
        { name: 'SHIJI TR',      subjectSpecialization: ['ENG'] },
        { name: 'JOSE SIR',      subjectSpecialization: ['MAL'] },
        { name: 'ANU JOSMEI TR', subjectSpecialization: ['PHYSICS'] },
        { name: 'DINNY TR',      subjectSpecialization: ['MATHS'] },
        { name: 'BEMITHA TR',    subjectSpecialization: ['SCI', 'CHE', 'PHY/ART'] },
        { name: 'CHIPPY TR',     subjectSpecialization: ['S.S'] },
        { name: 'SHANLEY TR',    subjectSpecialization: ['HINDI', 'MAL/HINDI'] },
        { name: 'ASHLY TR',      subjectSpecialization: ['CHE', 'PHY/ART'] },
        { name: 'RAVEENA TR',    subjectSpecialization: ['MATHS'] },
        { name: 'SRUTHY TR',     subjectSpecialization: ['SCI', 'BOTANY', 'PHY/ART', 'BIO'] },
        { name: 'DOMINIC SIR',   subjectSpecialization: ['PT'] },
        { name: 'RONEY FR',      subjectSpecialization: ['S.S'] },
        { name: 'CHINCHU TR',    subjectSpecialization: ['MAL'] },
        { name: 'APARNA TR',     subjectSpecialization: ['ENG'] },
    ]);
    console.log('✅ Teachers inserted');

    await Subject.insertMany([
        { name: 'ENG' }, { name: 'IT' }, { name: 'HINDI' }, { name: 'MAL' },
        { name: 'MATHS' }, { name: 'S.S' }, { name: 'BIO' }, { name: 'PHYSICS' },
        { name: 'CHE' }, { name: 'SCI' }, { name: 'BOTANY' }, { name: 'ZOOLOGY' },
        { name: 'PHY/ART' }, { name: 'PT' }, { name: 'CE' }, { name: 'MAL/HINDI' },
    ]);
    console.log('✅ Subjects inserted');

    await ClassRoom.insertMany([
        { className: '5A', requirements: [
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
        ]},
        { className: '5B', requirements: [
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
        ]},
        { className: '6A', requirements: [
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
        ]},
        { className: '6B', requirements: [
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
        ]},
        { className: '7A', requirements: [
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
        ]},
        { className: '7B', requirements: [
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
        ]},
        { className: '8A', requirements: [
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
        ]},
        { className: '8B', requirements: [
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
        ]},
        { className: '9A', requirements: [
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
        ]},
        { className: '9B', requirements: [
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
        ]},
        { className: '10A', requirements: [
            { subject: 'MATHS',   teacher: 'ANUJA TR',      periodsPerWeek: 7 },
            { subject: 'ENG',     teacher: 'SHIJI TR',      periodsPerWeek: 5 },
            { subject: 'MAL',     teacher: 'JOSE SIR',      periodsPerWeek: 5 },
            { subject: 'S.S',     teacher: 'VINEETHA TR',   periodsPerWeek: 5 },
            { subject: 'PHYSICS', teacher: 'ANU JOSMEI TR', periodsPerWeek: 3 },
            { subject: 'CHE',     teacher: 'ASHLY TR',      periodsPerWeek: 3 },
            { subject: 'BIO',     teacher: 'RENJINI TR',    periodsPerWeek: 3 },
            { subject: 'HINDI',   teacher: 'SHANLEY TR',    periodsPerWeek: 3 },
            { subject: 'IT',      teacher: 'CELINE TR',     periodsPerWeek: 2 },
        ]},
        { className: '10B', requirements: [
            { subject: 'MATHS',   teacher: 'ANUJA TR',      periodsPerWeek: 7 },
            { subject: 'ENG',     teacher: 'SHIJI TR',      periodsPerWeek: 5 },
            { subject: 'S.S',     teacher: 'VINEETHA TR',   periodsPerWeek: 5 },
            { subject: 'MAL',     teacher: 'JOSE SIR',      periodsPerWeek: 5 },
            { subject: 'PHYSICS', teacher: 'ANU JOSMEI TR', periodsPerWeek: 3 },
            { subject: 'CHE',     teacher: 'ASHLY TR',      periodsPerWeek: 3 },
            { subject: 'BIO',     teacher: 'RENJINI TR',    periodsPerWeek: 3 },
            { subject: 'HINDI',   teacher: 'SHANLEY TR',    periodsPerWeek: 3 },
            { subject: 'IT',      teacher: 'CELINE TR',     periodsPerWeek: 2 },
        ]},
        { className: '11', requirements: [
            { subject: 'MATHS',     teacher: 'DINNY TR',      periodsPerWeek: 7 },
            { subject: 'PHYSICS',   teacher: 'ANU JOSMEI TR', periodsPerWeek: 6 },
            { subject: 'CHE',       teacher: 'ASHLY TR',      periodsPerWeek: 6 },
            { subject: 'MAL/HINDI', teacher: 'JITHA TR',      periodsPerWeek: 4 },
            { subject: 'ENG',       teacher: 'SHIJI TR',      periodsPerWeek: 4 },
            { subject: 'BOTANY',    teacher: 'SRUTHY TR',     periodsPerWeek: 4 },
            { subject: 'ZOOLOGY',   teacher: 'RENJINI TR',    periodsPerWeek: 4 },
        ]},
        { className: '12', requirements: [
            { subject: 'MATHS',     teacher: 'DINNY TR',      periodsPerWeek: 7 },
            { subject: 'PHYSICS',   teacher: 'ANU JOSMEI TR', periodsPerWeek: 6 },
            { subject: 'CHE',       teacher: 'ASHLY TR',      periodsPerWeek: 6 },
            { subject: 'MAL/HINDI', teacher: 'SHANLEY TR',    periodsPerWeek: 4 },
            { subject: 'ENG',       teacher: 'SHIJI TR',      periodsPerWeek: 4 },
            { subject: 'BOTANY',    teacher: 'SRUTHY TR',     periodsPerWeek: 4 },
            { subject: 'ZOOLOGY',   teacher: 'RENJINI TR',    periodsPerWeek: 4 },
        ]},
    ]);

    console.log('✅ 14 classes seeded successfully!');
    await mongoose.disconnect();
    process.exit(0);
}

reseed().catch(err => { console.error(err); process.exit(1); });
