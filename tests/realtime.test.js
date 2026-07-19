const test = require('node:test');
const assert = require('node:assert/strict');

const { addClient, removeClient, publishAmbiance, clientCount } = require('../src/services/realtime');

// Simule une reponse Express : on garde ce que le hub ecrit dans le flux
// pour pouvoir verifier le contenu envoye
function fakeResponse() {
    return {
        chunks: [],
        write(chunk) {
            this.chunks.push(chunk);
        }
    };
}

test('publie les evenements aux abonnes du lieu concerne', () => {
    const resBiblio = fakeResponse();
    const resCafe = fakeResponse();
    const clientBiblio = addClient(resBiblio, 'biblio_jb');
    const clientCafe = addClient(resCafe, 'cafe');

    publishAmbiance({ location: 'biblio_jb', value: 35.5, code: 'calm', label: 'Calme' });

    assert.equal(resBiblio.chunks.length, 1);
    assert.match(resBiblio.chunks[0], /^event: ambiance\n/);
    assert.match(resBiblio.chunks[0], /"location":"biblio_jb"/);
    assert.equal(resCafe.chunks.length, 0); // le cafe ne suit pas biblio_jb, il ne recoit rien

    removeClient(clientBiblio);
    removeClient(clientCafe);
});

test('les abonnes sans lieu recoivent tous les evenements', () => {
    const resTous = fakeResponse();
    const client = addClient(resTous, null);

    publishAmbiance({ location: 'biblio_jb', value: 40, code: 'moderate', label: 'Modéré' });
    publishAmbiance({ location: 'cafe', value: 75, code: 'animated', label: 'Animé' });

    assert.equal(resTous.chunks.length, 2);

    removeClient(client);
});

test('un abonne retire ne recoit plus rien', () => {
    const res = fakeResponse();
    const client = addClient(res, null);
    removeClient(client);

    publishAmbiance({ location: 'biblio_jb', value: 50, code: 'moderate', label: 'Modéré' });

    assert.equal(res.chunks.length, 0);
    assert.equal(clientCount(), 0);
});
