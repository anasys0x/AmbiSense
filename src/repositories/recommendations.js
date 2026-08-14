function buildHourlyAggregation(locations, hour, timezone) {
    return [
        { $match: { location: { $in: locations } } },
        {
            $project: {
                location: 1,
                value: 1,
                localHour: {
                    $hour: { date: '$timestamp', timezone }
                }
            }
        },
        { $match: { localHour: hour } },
        {
            $group: {
                _id: '$location',
                averageValue: { $avg: '$value' },
                sampleCount: { $sum: 1 }
            }
        }
    ];
}

async function loadRecommendationData(models, criteria) {
    const { PlaceModel, MeasurementModel } = models;
    const places = await PlaceModel.find({});
    const locations = places.map((place) => place.locationKey || place.name);

    if (locations.length === 0) {
        return { places, aggregates: [] };
    }

    const pipeline = buildHourlyAggregation(
        locations,
        criteria.hour,
        criteria.timezone
    );
    const aggregates = await MeasurementModel.aggregate(pipeline);
    return { places, aggregates };
}

module.exports = {
    buildHourlyAggregation,
    loadRecommendationData
};
