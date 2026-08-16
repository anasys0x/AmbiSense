const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const { createCache, invalidateOnNewMeasurement } = require('../src/services/cache');
const app = require('../src/app');
const Measurement = require('../src/models/Measurement');
const { cache } = require('../src/services/cache');

// --- Comportement de base du cache -----------------------------------------

test('une valeur mise en cache est resservie telle quelle', () => {
    const store = createCache();
    store.set('history:biblio_jb:', { count: 3 }, 1000);

    assert.deepEqual(store.get('history:biblio_jb:'), { count: 3 });
    assert.equal(store.size(), 1);
});

test('une entrée expirée est oubliée et doit être recalculée', () => {
    // Horloge fausse : on avance le temps sans attendre.
    let current = 0;
    const store = createCache({ now: () => current });
    store.set('quiet-hours:cafe', { ok: true }, 1000);

    current = 999;
    assert.deepEqual(store.get('quiet-hours:cafe'), { ok: true }); // encore valide

    current = 1000;
    assert.equal(store.get('quiet-hours:cafe'), undefined); // périmée -> absente
    assert.equal(store.size(), 0);
});

// --- Invalidation lors d'une nouvelle mesure -------------------------------

test('une nouvelle mesure invalide le lieu concerné et toutes les recommandations', () => {
    const store = createCache();
    store.set('history:biblio_jb:24:', 'h', 5000);
    store.set('quiet-hours:biblio_jb', 'q', 5000);
    store.set('recommendations:calm:14', 'r', 5000);
    store.set('history:cafe_tore:', 'autre-lieu', 5000);

    invalidateOnNewMeasurement('biblio_jb', store);

    assert.equal(store.get('history:biblio_jb:24:'), undefined);
    assert.equal(store.get('quiet-hours:biblio_jb'), undefined);
    assert.equal(store.get('recommendations:calm:14'), undefined);
    // Un autre lieu ne doit pas être vidé par une mesure de biblio_jb.
    assert.equal(store.get('history:cafe_tore:'), 'autre-lieu');
});

test('invalidatePrefix ne touche que les clés du préfixe et compte les suppressions', () => {
    const store = createCache();
    store.set('history:biblio_jb:', 1, 5000);
    store.set('history:biblio_jb:24:', 2, 5000);
    store.set('quiet-hours:biblio_jb', 3, 5000);

    const removed = store.invalidatePrefix('history:biblio_jb');

    assert.equal(removed, 2);
    assert.equal(store.get('quiet-hours:biblio_jb'), 3);
});

// --- Critère d'acceptation : une requête répétée réutilise le cache --------

test('GET /ambiance/:location/history sert la 2e requête depuis le cache', async () => {
    cache.clear();
    let dbReads = 0;
    const originalFind = Measurement.find;
    Measurement.find = () => {
        dbReads += 1;
        return { sort: async () => [{ value: 50, timestamp: new Date('2026-08-01T10:00:00.000Z') }] };
    };

    try {
        const first = await request(app).get('/ambiance/lieu-cache/history');
        const second = await request(app).get('/ambiance/lieu-cache/history');

        assert.equal(first.status, 200);
        assert.equal(second.status, 200);
        assert.deepEqual(second.body, first.body);
        // La base n'a été lue qu'une seule fois : la 2e réponse vient du cache.
        assert.equal(dbReads, 1);
    } finally {
        Measurement.find = originalFind;
        cache.clear();
    }
});
