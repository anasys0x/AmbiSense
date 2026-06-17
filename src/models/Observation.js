const mongoose = require('mongoose');

const observationSchema = new mongoose.Schema({
    location: {
        type: String,
        required: true,
    },
    proximity: {
        type: String,
        required: true,
    },
    vibe: {
        type: String,
        required: true,
    },
    notes: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    receivedAt: {
        type: Date,
        default: Date.now,
    },
    deviceId: {
        type: String,
        required: true,
    }
});

module.exports = mongoose.model('Observation', observationSchema);
