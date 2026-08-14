const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../src/app');
const Place = require('../src/models/Place');
const Measurement = require('../src/models/Measurement');

const places = [
    {
        _id: 'place-cafe',
        name: 'Cafe Tore et Fraction',
        slug: 'cafe-tore-et-fraction',
        locationKey: 'cafe_tore_fraction',
        latitude: 45.5,
        longitude: -73.6
    },
    {
        _id: 'place-biblio',
        name: 'Bibliotheque des sciences humaines',
        slug: 'bibliotheque-sciences-humaines',
        locationKey: 'biblio_sciences_humaines',
        latitude: 45.51,
        longitude: -73.61
    }
];

test('le service classe les lieux calmes du plus silencieux au plus sonore', () => {
    const { rankRecommendations } = require('../src/services/recommendations');
    const aggregates = [
        { _id: 'cafe_tore_fraction', averageValue: 52, sampleCount: 8 },
        { _id: 'biblio_sciences_humaines', averageValue: 34, sampleCount: 12 }
    ];

    const result = rankRecommendations(places, aggregates, 'calm', 14);

    assert.equal(result[0].place.slug, 'bibliotheque-sciences-humaines');
    assert.equal(result[0].rank, 1);
    assert.equal(result[0].matchesDesired, true);
    assert.equal(result[1].matchesDesired, false);
});

test('le service classe les lieux animes du plus sonore au moins sonore', () => {
    const { rankRecommendations } = require('../src/services/recommendations');
    const aggregates = [
        { _id: 'cafe_tore_fraction', averageValue: 74, sampleCount: 8 },
        { _id: 'biblio_sciences_humaines', averageValue: 83, sampleCount: 12 }
    ];

    const result = rankRecommendations(places, aggregates, 'animated', 20);

    assert.equal(result[0].place.slug, 'bibliotheque-sciences-humaines');
    assert.equal(result[0].averageValue, 83);
    assert.equal(result[0].classification.code, 'animated');
});

test('le service privilegie une ambiance moderee proche du centre de sa plage', () => {
    const { rankRecommendations } = require('../src/services/recommendations');
    const aggregates = [
        { _id: 'cafe_tore_fraction', averageValue: 67, sampleCount: 8 },
        { _id: 'biblio_sciences_humaines', averageValue: 54, sampleCount: 12 }
    ];

    const result = rankRecommendations(places, aggregates, 'moderate', 12);

    assert.equal(result[0].place.slug, 'bibliotheque-sciences-humaines');
    assert.match(result[0].explanation, /12 h/);
});

test('le service valide et normalise les criteres de recommandation', () => {
    const { parseRecommendationCriteria } = require('../src/services/recommendations');

    assert.deepEqual(parseRecommendationCriteria({ ambiance: 'calm', hour: '14' }), {
        ambiance: 'calm',
        hour: 14,
        timezone: 'America/Toronto'
    });
    assert.throws(
        () => parseRecommendationCriteria({ ambiance: 'inconnue', hour: '14' }),
        /ambiance/
    );
    assert.throws(
        () => parseRecommendationCriteria({ ambiance: 'calm', hour: '25' }),
        /hour/
    );
});

test('le service construit toute la reponse metier hors de la route', () => {
    const { buildRecommendationResponse } = require('../src/services/recommendations');
    const aggregates = [
        { _id: 'biblio_sciences_humaines', averageValue: 36.2, sampleCount: 12 }
    ];
    const criteria = { ambiance: 'calm', hour: 14, timezone: 'America/Toronto' };

    const response = buildRecommendationResponse(places, aggregates, criteria);

    assert.equal(response.data[0].place.slug, 'bibliotheque-sciences-humaines');
    assert.deepEqual(response.meta, {
        desiredAmbiance: 'calm',
        hour: 14,
        timezone: 'America/Toronto',
        unit: 'dB',
        totalMeasurements: 12
    });
});

test('GET /recommendations valide les criteres', async () => {
    const invalidAmbiance = await request(app).get('/recommendations?ambiance=inconnue&hour=12');
    const invalidHour = await request(app).get('/recommendations?ambiance=calm&hour=25');

    assert.equal(invalidAmbiance.status, 400);
    assert.equal(invalidHour.status, 400);
});

test('GET /recommendations expose le classement calcule par le serveur', async () => {
    const originalPlaceFind = Place.find;
    const originalMeasurementAggregate = Measurement.aggregate;
    let receivedPipeline;

    Place.find = async () => places;
    Measurement.aggregate = async (pipeline) => {
        receivedPipeline = pipeline;
        return [
            { _id: 'cafe_tore_fraction', averageValue: 58.456, sampleCount: 8 },
            { _id: 'biblio_sciences_humaines', averageValue: 36.2, sampleCount: 12 }
        ];
    };

    try {
        const response = await request(app).get('/recommendations?ambiance=calm&hour=14');

        assert.equal(response.status, 200);
        assert.equal(response.body.data[0].place.slug, 'bibliotheque-sciences-humaines');
        assert.equal(response.body.data[0].averageValue, 36.2);
        assert.equal(response.body.meta.hour, 14);
        assert.equal(response.body.meta.timezone, 'America/Toronto');
        assert.equal(receivedPipeline[0].$match.location.$in.length, 2);
    } finally {
        Place.find = originalPlaceFind;
        Measurement.aggregate = originalMeasurementAggregate;
    }
});
