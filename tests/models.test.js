const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const Measurement = require('../src/models/Measurement');
const Observation = require('../src/models/Observation');
const Device = require('../src/models/Device');
const Place = require('../src/models/Place');

test('Measurement borne la valeur et référence un Device', () => {
    const valuePath = Measurement.schema.path('value');
    const devicePath = Measurement.schema.path('deviceId');

    assert.equal(valuePath.options.min, 0);
    assert.equal(valuePath.options.max, 140);
    assert.equal(devicePath.instance, 'ObjectId');
    assert.equal(devicePath.options.ref, 'Device');
});

test('Device stocke une empreinte unique plutot que la cle API en clair', () => {
    const hashPath = Device.schema.path('apiKeyHash');
    assert.ok(hashPath);
    assert.equal(hashPath.options.required, true);
    assert.equal(hashPath.options.unique, true);
    assert.equal(Device.schema.path('apiKey'), undefined);
});

test('Place expose une cle de collecte distincte de son nom public', () => {
    const locationKeyPath = Place.schema.path('locationKey');
    assert.ok(locationKeyPath);
    assert.equal(locationKeyPath.options.trim, true);
});

test('Measurement accepte les bornes et refuse les valeurs hors de 0 à 140 dB', async () => {
    const baseMeasurement = {
        type: 'audio_amplitude',
        location: 'Bibliothèque',
        timestamp: new Date(),
        deviceId: new mongoose.Types.ObjectId()
    };

    await new Measurement({ ...baseMeasurement, value: 0 }).validate();
    await new Measurement({ ...baseMeasurement, value: 140 }).validate();
    await assert.rejects(new Measurement({ ...baseMeasurement, value: -1 }).validate());
    await assert.rejects(new Measurement({ ...baseMeasurement, value: 141 }).validate());
});

test('Measurement indexe les recherches par lieu et date décroissante', () => {
    const indexes = Measurement.schema.indexes();

    assert.ok(indexes.some(([fields]) => (
        fields.location === 1 && fields.timestamp === -1
    )));
});

test('Observation valide proximity et vibe tout en acceptant les anciennes valeurs', async () => {
    const proximityValues = Observation.schema.path('proximity').enumValues;
    const vibeValues = Observation.schema.path('vibe').enumValues;

    assert.ok(proximityValues.includes('proche'));
    assert.ok(proximityValues.includes('near'));
    assert.ok(vibeValues.includes('calme'));
    assert.ok(vibeValues.includes('calm'));

    const invalidObservation = new Observation({
        location: 'Bibliothèque',
        proximity: 'inconnue',
        vibe: 'inconnue',
        notes: 'Test'
    });
    await assert.rejects(
        invalidObservation.validate(),
        (validationError) => (
            Boolean(validationError.errors.proximity) &&
            Boolean(validationError.errors.vibe)
        )
    );
});

test('Observation référence aussi les dispositifs de collecte', () => {
    const devicePath = Observation.schema.path('deviceId');

    assert.equal(devicePath.instance, 'ObjectId');
    assert.equal(devicePath.options.ref, 'Device');
});
