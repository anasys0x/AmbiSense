const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

process.env.JWT_SECRET = 'secret-de-test';

const app = require('../src/app');
const Observation = require('../src/models/Observation');
const User = require('../src/models/User');

test('GET /users/me/observations exige un JWT', async () => {
    const response = await request(app).get('/users/me/observations');
    assert.equal(response.status, 401);
});

test('GET /users/me/observations filtre par auteur et trie les contributions recentes', async () => {
    const userId = new mongoose.Types.ObjectId();
    const authToken = jwt.sign({ _id: userId.toString() }, process.env.JWT_SECRET);
    const originalFindOne = User.findOne;
    const originalFind = Observation.find;
    let observationFilter;
    let observationSort;

    try {
        User.findOne = async () => ({
            _id: userId,
            authTokens: [{ authToken }]
        });
        Observation.find = (filter) => {
            observationFilter = filter;
            return {
                sort: async (sort) => {
                    observationSort = sort;
                    return [{
                        location: 'Bibliothèque',
                        vibe: 'calme',
                        proximity: 'proche',
                        notes: 'Silencieux'
                    }];
                }
            };
        };

        const response = await request(app)
            .get('/users/me/observations')
            .set('Authorization', `Bearer ${authToken}`);

        assert.equal(response.status, 200);
        assert.equal(response.body.count, 1);
        assert.equal(response.body.observations[0].location, 'Bibliothèque');
        assert.equal(observationFilter.author.toString(), userId.toString());
        assert.deepEqual(observationSort, { receivedAt: -1 });
    } finally {
        User.findOne = originalFindOne;
        Observation.find = originalFind;
    }
});
