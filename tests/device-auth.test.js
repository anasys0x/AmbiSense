const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const request = require('supertest');

const app = require('../src/app');
const Device = require('../src/models/Device');

test('le middleware recherche une empreinte SHA-256 de la cle API', async () => {
    const originalFindOne = Device.findOne;
    let receivedFilter;
    Device.findOne = async (filter) => {
        receivedFilter = filter;
        return { _id: 'device-1', name: 'Telephone', location: 'lieu' };
    };
    try {
        const response = await request(app).get('/devices/me').set('x-api-key', 'cle-secrete');
        assert.equal(response.status, 200);
        assert.deepEqual(receivedFilter, {
            apiKeyHash: crypto.createHash('sha256').update('cle-secrete').digest('hex')
        });
    } finally {
        Device.findOne = originalFindOne;
    }
});

test('POST /devices retourne la cle une fois mais ne la stocke pas en clair', async () => {
    const originalSave = Device.prototype.save;
    let savedDocument;
    Device.prototype.save = async function save() {
        savedDocument = this;
        this._id = 'device-2';
        return this;
    };
    try {
        const response = await request(app).post('/devices')
            .send({ name: 'Telephone', location: 'bibliotheque' });
        assert.equal(response.status, 201);
        assert.equal(typeof response.body.data.apiKey, 'string');
        assert.equal(savedDocument.apiKey, undefined);
        assert.equal(savedDocument.apiKeyHash,
            crypto.createHash('sha256').update(response.body.data.apiKey).digest('hex'));
    } finally {
        Device.prototype.save = originalSave;
    }
});
