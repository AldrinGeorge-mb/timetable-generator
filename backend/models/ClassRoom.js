const mongoose = require('mongoose');

const RequirementSchema = new mongoose.Schema({
    subject: { type: String, required: true, trim: true },
    teacher: { type: String, required: true, trim: true },
    periodsPerWeek: { type: Number, required: true, min: 1, max: 14 }
});

const ClassRoomSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    className: { type: String, required: true, trim: true },
    classTeacher: { type: String, trim: true, default: '' },
    requirements: [RequirementSchema]
});

// Compound uniqueness: same className can exist in different projects
ClassRoomSchema.index({ projectId: 1, className: 1 }, { unique: true });

module.exports = mongoose.model('ClassRoom', ClassRoomSchema);
