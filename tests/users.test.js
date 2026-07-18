const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.JWT_SECRET = 'secret-de-test';

const app = require('../src/app');
const User = require('../src/models/User');

test('POST /users cree un compte et masque les donnees sensibles', async () => {
    const originalGenerate = User.prototype.generateAuthTokenAndSaveUser;
    User.prototype.generateAuthTokenAndSaveUser = async function generateTestToken() {
        this.authTokens = [{ authToken: 'jeton-de-test' }];
        return 'jeton-de-test';
    };

    const response = await request(app)
        .post('/users')
        .send({
            name: 'Alice',
            email: 'alice@example.com',
            password: 'motdepasse123'
        });

    assert.equal(response.status, 201);
    assert.equal(response.body.user.email, 'alice@example.com');
    assert.equal(response.body.user.password, undefined);
    assert.equal(response.body.user.authTokens, undefined);
    assert.ok(response.body.authToken);

    User.prototype.generateAuthTokenAndSaveUser = originalGenerate;
});
