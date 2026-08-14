const test = require('node:test');
const assert = require('node:assert/strict');

const {
    buildHourlyAggregation,
    loadRecommendationData
} = require('../src/repositories/recommendations');

test('le depot construit une aggregation horaire independante de la route', () => {
    const pipeline = buildHourlyAggregation(['biblio', 'cafe'], 14, 'America/Toronto');

    assert.deepEqual(pipeline[0], { $match: { location: { $in: ['biblio', 'cafe'] } } });
    assert.equal(pipeline[1].$project.localHour.$hour.timezone, 'America/Toronto');
    assert.deepEqual(pipeline[2], { $match: { localHour: 14 } });
});

test('le depot evite une aggregation inutile quand aucun lieu nexiste', async () => {
    let aggregateCalled = false;
    const PlaceModel = { find: async () => [] };
    const MeasurementModel = {
        aggregate: async () => {
            aggregateCalled = true;
            return [];
        }
    };

    const result = await loadRecommendationData({ PlaceModel, MeasurementModel }, {
        hour: 14,
        timezone: 'America/Toronto'
    });

    assert.deepEqual(result, { places: [], aggregates: [] });
    assert.equal(aggregateCalled, false);
});

test('le depot retourne ensemble les lieux et leurs moyennes', async () => {
    const places = [{ name: 'Bibliotheque', locationKey: 'biblio' }];
    const aggregates = [{ _id: 'biblio', averageValue: 35, sampleCount: 4 }];
    const PlaceModel = { find: async () => places };
    const MeasurementModel = { aggregate: async () => aggregates };

    const result = await loadRecommendationData({ PlaceModel, MeasurementModel }, {
        hour: 9,
        timezone: 'America/Toronto'
    });

    assert.deepEqual(result, { places, aggregates });
});
