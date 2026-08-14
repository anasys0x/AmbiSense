const { getLegacyStatus } = require('./ambiance');

const DEFAULT_HISTORY_INTERVAL_MINUTES = 60;
const SHORT_HISTORY_INTERVAL_MINUTES = 5;

function parseLastParam(last, now = Date.now()) {
    const hours = parseInt(last, 10);
    return new Date(now - hours * 3600000);
}

function average(values) {
    return Math.round(
        (values.reduce((total, value) => total + value, 0) / values.length) * 100
    ) / 100;
}

function computeQuietHours(measurements) {
    const groups = {};

    for (const measurement of measurements) {
        const hour = new Date(measurement.timestamp).getHours();
        if (!groups[hour]) groups[hour] = [];
        groups[hour].push(measurement.value);
    }

    return Object.entries(groups)
        .map(([hour, values]) => {
            const averageValue = average(values);
            return {
                hour: Number(hour),
                averageValue,
                ambiance: getLegacyStatus(averageValue),
                count: values.length
            };
        })
        .sort((first, second) => first.averageValue - second.averageValue);
}

function getHistoryIntervalMinutes(last) {
    return String(last) === '3'
        ? SHORT_HISTORY_INTERVAL_MINUTES
        : DEFAULT_HISTORY_INTERVAL_MINUTES;
}

function aggregateHistory(measurements, intervalMinutes) {
    const groups = new Map();
    const intervalMilliseconds = intervalMinutes * 60 * 1000;

    for (const measurement of measurements) {
        const timestamp = new Date(measurement.timestamp).getTime();
        const bucketTimestamp = Math.floor(timestamp / intervalMilliseconds) * intervalMilliseconds;
        const values = groups.get(bucketTimestamp) || [];
        values.push(measurement.value);
        groups.set(bucketTimestamp, values);
    }

    return [...groups.entries()]
        .sort(([firstTimestamp], [secondTimestamp]) => firstTimestamp - secondTimestamp)
        .map(([timestamp, values]) => {
            const averageValue = average(values);
            return {
                timestamp: new Date(timestamp),
                value: averageValue,
                averageValue,
                minValue: Math.min(...values),
                maxValue: Math.max(...values),
                count: values.length
            };
        });
}

module.exports = {
    aggregateHistory,
    computeQuietHours,
    getHistoryIntervalMinutes,
    parseLastParam
};
