const mongoose = require('mongoose');

/**
 * Subject — a catalog of subjects offered, scoped to a project.
 */
const SubjectSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    name: { type: String, required: true, trim: true },
    applicableClasses: { type: [String], default: [] }
});

SubjectSchema.index({ projectId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Subject', SubjectSchema);
