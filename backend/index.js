const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import the algorithm!
const { generateTimetable } = require('./utils/generator');

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/timetable')
    .then(() => console.log('✅ Connected to MongoDB successfully'))
    .catch((err) => console.error('⚠️ MongoDB not connected yet:', err.message));

app.get('/api/health', (req, res) => {
    res.status(200).json({ message: 'Timetable Server is running!' });
});

// --- THE ONLY SCHEDULE ROUTE ---
app.get('/api/schedule', (req, res) => {
    // 1. The strict rules for Class 5A (35 periods total)
    const schoolClasses = [
        {
            className: "5A",
            requirements: [
                { subject: 'MATHS', teacher: 'RAVEENA TR', periodsPerWeek: 7 },
                { subject: 'ENG', teacher: 'EMY TR', periodsPerWeek: 6 },
                { subject: 'HINDI', teacher: 'BETTY TR', periodsPerWeek: 5 },
                { subject: 'SCI', teacher: 'NEETHU TR', periodsPerWeek: 6 },
                { subject: 'MAL', teacher: 'CHINCHU TR', periodsPerWeek: 5 },
                { subject: 'IT', teacher: 'CELINE TR', periodsPerWeek: 2 },
                { subject: 'PT', teacher: 'ROHIT TR', periodsPerWeek: 2 },
                { subject: 'ART', teacher: 'KALA TR', periodsPerWeek: 2 },
            ]
        }
    ];

    // 2. Feed the rules to the algorithm
    const generatedSchedules = generateTimetable(schoolClasses);

    // 3. Send the generated 35-block schedule back to your React app
    setTimeout(() => {
        res.status(200).json(generatedSchedules["5A"]);
    }, 500);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});