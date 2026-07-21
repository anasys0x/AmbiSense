const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

process.env.JWT_SECRET = 'secret-de-test';

const app = require('../src/app');
const Place = require('../src/models/Place');
const User = require('../src/models/User');

const userId = new mongoose.Types.ObjectId();
const placeId = new mongoose.Types.ObjectId();
const authToken = jwt.sign({ _id: userId.toString() }, process.env.JWT_SECRET);
const place = {
    _id: placeId,
    name: 'Bibliothèque',
    slug: 'bibliotheque',
    latitude: 45.5017,
    longitude: -73.5673
};

function createUser(favorites = []) {
    return {
        _id: userId,
        authTokens: [{ authToken }],
        favorites,
        saveCalls: 0,
        async save() {
            this.saveCalls += 1;
            return this;
        },
        async populate() {
            this.favorites = this.favorites.map((favorite) => (
                favorite.toString() === placeId.toString() ? place : favorite
            ));
            return this;
        }
    };
}

test('les routes de favoris exigent un JWT', async () => {
    const response = await request(app).get('/users/me/favorites');
    assert.equal(response.status, 401);
});

test('GET /users/me/favorites retourne uniquement les favoris du compte connecte', async () => {
    const originalFindOne = User.findOne;
    const user = createUser([place]);
    let authQuery;

    try {
        User.findOne = async (query) => {
            authQuery = query;
            return user;
        };

        const response = await request(app)
            .get('/users/me/favorites')
            .set('Authorization', `Bearer ${authToken}`);

        assert.equal(response.status, 200);
        assert.equal(response.body.count, 1);
        assert.equal(response.body.favorites[0].id, placeId.toString());
        assert.equal(authQuery._id, userId.toString());
        assert.equal(authQuery['authTokens.authToken'], authToken);
    } finally {
        User.findOne = originalFindOne;
    }
});

test('POST /users/me/favorites/:placeId ajoute et persiste un favori sans doublon', async () => {
    const originalFindOne = User.findOne;
    const originalFindById = Place.findById;
    const user = createUser([]);

    try {
        User.findOne = async () => user;
        Place.findById = async () => place;

        const firstResponse = await request(app)
            .post(`/users/me/favorites/${placeId}`)
            .set('Authorization', `Bearer ${authToken}`);

        const secondResponse = await request(app)
            .post(`/users/me/favorites/${placeId}`)
            .set('Authorization', `Bearer ${authToken}`);

        assert.equal(firstResponse.status, 201);
        assert.equal(secondResponse.status, 200);
        assert.equal(secondResponse.body.count, 1);
        assert.equal(user.saveCalls, 1);
    } finally {
        User.findOne = originalFindOne;
        Place.findById = originalFindById;
    }
});

test('DELETE /users/me/favorites/:placeId retire et persiste le favori', async () => {
    const originalFindOne = User.findOne;
    const user = createUser([placeId]);

    try {
        User.findOne = async () => user;

        const response = await request(app)
            .delete(`/users/me/favorites/${placeId}`)
            .set('Authorization', `Bearer ${authToken}`);

        assert.equal(response.status, 200);
        assert.equal(response.body.count, 0);
        assert.equal(user.favorites.length, 0);
        assert.equal(user.saveCalls, 1);
    } finally {
        User.findOne = originalFindOne;
    }
});
