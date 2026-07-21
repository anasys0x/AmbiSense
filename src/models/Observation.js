const mongoose = require('mongoose');

const observationSchema = new mongoose.Schema({
    location: {
        type: String,
        required: true,
    },
    proximity: {
        type: String,
        required: true,
        enum: ['proche', 'moyenne', 'lointaine', 'near', 'far', 'close'],
    },
    vibe: {
        type: String,
        required: true,
        enum: ['calme', 'moderee', 'animee', 'calm', 'focused', 'busy', 'noisy'],
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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Device',
    }
});

module.exports = mongoose.model('Observation', observationSchema);
