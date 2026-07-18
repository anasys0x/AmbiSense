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
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
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
    }
});

module.exports = mongoose.model('Observation', observationSchema);
