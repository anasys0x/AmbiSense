const { getLegacyStatus } = require('./ambiance');

/*
Service historique : toute la logique de calcul de l'historique et des créneaux
calmes vit ici, séparée de l'accès aux données. Les routes se contentent de lire
la base puis d'appeler ces fonctions pures, ce qui les rend testables sans serveur
ni MongoDB.
 */

const DEFAULT_HISTORY_INTERVAL_MINUTES = 60;
const SHORT_HISTORY_INTERVAL_MINUTES = 5;

// `last` est un nombre d'heures. On renvoie la date de début de la fenêtre
// (maintenant - N heures). `now` est injectable pour rendre le calcul testable.
function resolveHistoryStart(last, now = Date.now()) {
    const hours = parseInt(last, 10);
    return new Date(now - hours * 3600000);
}

// L'historique des trois dernières heures est tranché finement (5 min) ;
// les périodes plus longues le sont par heure (60 min).
function getHistoryIntervalMinutes(last) {
    return String(last) === '3' ? SHORT_HISTORY_INTERVAL_MINUTES : DEFAULT_HISTORY_INTERVAL_MINUTES;
}

// Regroupe les mesures par tranche de `intervalMinutes` et calcule, pour chaque
// tranche, la moyenne (arrondie à 2 décimales), le minimum, le maximum et le
// nombre de mesures. Les tranches sont triées de la plus ancienne à la plus récente.
function aggregateHistory(measurements, intervalMinutes) {
    const groups = new Map();
    const intervalMilliseconds = intervalMinutes * 60 * 1000;

    for (const measurement of measurements) {
        const timestamp = new Date(measurement.timestamp).getTime();
        const bucketTimestamp = Math.floor(timestamp / intervalMilliseconds) * intervalMilliseconds;
        const group = groups.get(bucketTimestamp) || [];
        group.push(measurement.value);
        groups.set(bucketTimestamp, group);
    }

    return [...groups.entries()]
        .sort(([firstTimestamp], [secondTimestamp]) => firstTimestamp - secondTimestamp)
        .map(([timestamp, values]) => {
            const averageValue = Math.round(
                (values.reduce((total, value) => total + value, 0) / values.length) * 100
            ) / 100;

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

// Regroupe les mesures par heure de la journée (0-23), calcule la moyenne de
// chaque heure, y associe la classification d'ambiance et classe de la plus
// calme à la plus animée.
function computeQuietHours(measurements) {
    const groups = {};

    for (const measurement of measurements) {
        const hour = new Date(measurement.timestamp).getHours();
        (groups[hour] = groups[hour] || []).push(measurement.value);
    }

    return Object.keys(groups)
        .map((hour) => {
            const values = groups[hour];
            const averageValue = Math.round(
                (values.reduce((total, value) => total + value, 0) / values.length) * 100
            ) / 100;

            return {
                hour: Number(hour),
                averageValue,
                ambiance: getLegacyStatus(averageValue),
                count: values.length
            };
        })
        .sort((first, second) => first.averageValue - second.averageValue);
}

module.exports = {
    DEFAULT_HISTORY_INTERVAL_MINUTES,
    SHORT_HISTORY_INTERVAL_MINUTES,
    resolveHistoryStart,
    getHistoryIntervalMinutes,
    aggregateHistory,
    computeQuietHours
};
