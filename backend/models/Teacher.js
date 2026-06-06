const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
    subject: { type: String, required: true, trim: true },
    classes: [{ type: String, trim: true }]
}, { _id: false });

const TeacherSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    name: { type: String, required: true, trim: true },
    assignments: [AssignmentSchema]
});

TeacherSchema.index({ projectId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Teacher', TeacherSchema);
