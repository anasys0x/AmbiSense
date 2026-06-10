const mongoose = require('mongoose');

const measurementsSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
    },
    value: {
        type: Number,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        required: true,
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

module.exports = mongoose.model('Measurement', measurementsSchema);
