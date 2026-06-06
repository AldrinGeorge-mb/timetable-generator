const mongoose = require('mongoose');

// The blueprint for a single subject requirement
const RequirementSchema = new mongoose.Schema({
    subject: { type: String, required: true },
    teacher: { type: String, required: true },
    periodsPerWeek: { type: Number, required: true }
});

// The blueprint for the overall Class (e.g., "5A")
const SchoolClassSchema = new mongoose.Schema({
    className: { type: String, required: true, unique: true },
    requirements: [RequirementSchema] // An array of the requirements defined above
});

module.exports = mongoose.model('SchoolClass', SchoolClassSchema);