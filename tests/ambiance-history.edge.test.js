const test = require('node:test');
const assert = require('node:assert/strict');

/*
Cas limites complementaires du service ambianceHistory (#36).
Les collegues testent deja l'agregation et le tri ; on ajoute ici les entrees
vides, le parsing de la periode et l'intervalle par defaut.
 */

test('aggregateHistory renvoie un tableau vide quand il n\'y a aucune mesure', () => {
    const { aggregateHistory } = require('../src/services/ambianceHistory');

    assert.deepEqual(aggregateHistory([], 60), []);
});

test('computeQuietHours renvoie un tableau vide quand il n\'y a aucune mesure', () => {
    const { computeQuietHours } = require('../src/services/ambianceHistory');

    assert.deepEqual(computeQuietHours([]), []);
});

test('parseLastParam recule de N heures et ignore un suffixe (3h -> 3)', () => {
    const { parseLastParam } = require('../src/services/ambianceHistory');
    const now = new Date('2026-08-01T12:00:00.000Z').getTime();

    assert.equal(parseLastParam('3h', now).toISOString(), '2026-08-01T09:00:00.000Z');
});

test('getHistoryIntervalMinutes reste a 60 min hors periode de trois heures', () => {
    const { getHistoryIntervalMinutes } = require('../src/services/ambianceHistory');

    assert.equal(getHistoryIntervalMinutes('24'), 60);
    assert.equal(getHistoryIntervalMinutes(undefined), 60);
});
