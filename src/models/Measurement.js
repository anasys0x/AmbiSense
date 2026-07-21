const mongoose = require('mongoose');

const measurementsSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
    },
    value: {
        type: Number,
        required: true,
        min: 0,
        max: 140,
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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Device',
        required: true,
    }
});

measurementsSchema.index({ location: 1, timestamp: -1 });

module.exports = mongoose.model('Measurement', measurementsSchema);
