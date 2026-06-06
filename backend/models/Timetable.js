const mongoose = require('mongoose');

const BlockSchema = new mongoose.Schema({
    id: { type: String, required: true },
    day: { type: String, required: true },
    period: { type: Number, required: true },
    subject: { type: String, required: true },
    teacher: { type: String, required: true },
    color: { type: String }
}, { _id: false });

const TimetableSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, unique: true },
    schedules: {
        type: Map,
        of: [BlockSchema]
    },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Timetable', TimetableSchema);
