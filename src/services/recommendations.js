const { classifyAmbiance } = require('./ambiance');

const VALID_AMBIANCES = ['calm', 'moderate', 'animated'];

function rankingMetric(code, averageValue) {
    if (code === 'calm') return averageValue;
    if (code === 'animated') return -averageValue;
    return Math.abs(averageValue - 55);
}

function serializePlace(place) {
    return {
        id: place._id,
        name: place.name,
        slug: place.slug,
        locationKey: place.locationKey || place.name,
        latitude: place.latitude,
        longitude: place.longitude
    };
}

function rankRecommendations(places, aggregates, desiredAmbiance, hour) {
    if (!VALID_AMBIANCES.includes(desiredAmbiance)) {
        throw new RangeError('Ambiance recherchée invalide');
    }

    const aggregatesByLocation = new Map(
        aggregates.map((aggregate) => [String(aggregate._id), aggregate])
    );

    return places
        .map((place) => {
            const location = place.locationKey || place.name;
            const aggregate = aggregatesByLocation.get(String(location));
            if (!aggregate || !Number.isFinite(aggregate.averageValue)) return null;

            const averageValue = Math.round(aggregate.averageValue * 100) / 100;
            const now = new Date();
            const classification = classifyAmbiance(averageValue, now, now);
            const matchesDesired = classification.code === desiredAmbiance;

            return {
                place: serializePlace(place),
                averageValue,
                sampleCount: aggregate.sampleCount,
                classification,
                matchesDesired,
                explanation: matchesDesired
                    ? `Correspond à l'ambiance ${classification.label.toLowerCase()} recherchée à ${hour} h.`
                    : `Meilleure option disponible à ${hour} h, même si son ambiance habituelle est ${classification.label.toLowerCase()}.`,
                metric: rankingMetric(desiredAmbiance, averageValue)
            };
        })
        .filter(Boolean)
        .sort((first, second) => {
            if (first.matchesDesired !== second.matchesDesired) {
                return first.matchesDesired ? -1 : 1;
            }
            if (first.metric !== second.metric) return first.metric - second.metric;
            if (first.sampleCount !== second.sampleCount) return second.sampleCount - first.sampleCount;
            return first.place.name.localeCompare(second.place.name);
        })
        .map(({ metric, ...recommendation }, index) => ({
            ...recommendation,
            rank: index + 1
        }));
}

module.exports = {
    VALID_AMBIANCES,
    rankRecommendations
};
