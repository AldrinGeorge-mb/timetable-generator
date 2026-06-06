const mongoose = require('mongoose');

/**
 * Project — represents a single timetable project (e.g. "Depaul High School").
 * All teachers, subjects, classes, and schedules are scoped to a project.
 */
const ProjectSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true, default: '' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Project', ProjectSchema);
