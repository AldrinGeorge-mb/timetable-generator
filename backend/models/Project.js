const mongoose = require('mongoose');

/**
 * Project — represents a single timetable project (e.g. "Depaul High School").
 * All teachers, subjects, classes, and schedules are scoped to a project.
 */
const ProjectSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    settings: {
        numberOfDays: { type: Number, default: 5 },
        periodsPerDay: { type: Number, default: 7 },
        breaks: [{
            afterPeriod: { type: Number },
            label: { type: String, default: 'Interval' }
        }]
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Project', ProjectSchema);
