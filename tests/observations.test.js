const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

process.env.JWT_SECRET = 'secret-de-test';

const app = require('../src/app');
const Observation = require('../src/models/Observation');
const User = require('../src/models/User');

test('POST /observations associe le compte authentifie comme auteur', async () => {
    const userId = new mongoose.Types.ObjectId();
    const authToken = jwt.sign({ _id: userId.toString() }, process.env.JWT_SECRET);
    const originalFindOne = User.findOne;
    const originalSave = Observation.prototype.save;

    User.findOne = async () => ({ _id: userId, authTokens: [{ authToken }] });
    Observation.prototype.save = async function saveObservation() {
        return this;
    };

    const response = await request(app)
        .post('/observations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
            location: 'Bibliotheque',
            proximity: 'proche',
            vibe: 'calme',
            notes: 'Conversation douce'
        });

    assert.equal(response.status, 201);
    assert.equal(response.body.author, userId.toString());

    User.findOne = originalFindOne;
    Observation.prototype.save = originalSave;
});
