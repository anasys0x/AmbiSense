/*
Cache mémoire avec durée de vie (TTL).

But : éviter de recalculer/recharger les lectures publiques coûteuses (historique,
créneaux calmes, recommandations) quand plusieurs visiteurs demandent la même chose.

On NE met JAMAIS en cache : les écritures (POST), l'authentification, les comptes
et le flux SSE — ces réponses sont personnelles ou changent à chaque appel.

L'horloge `now` est injectable pour pouvoir tester l'expiration sans attendre.
 */

function createCache({ now = () => Date.now() } = {}) {
    const store = new Map(); // clé -> { value, expiresAt }

    function set(key, value, ttlMs) {
        store.set(key, { value, expiresAt: now() + ttlMs });
        return value;
    }

    function get(key) {
        const entry = store.get(key);
        if (!entry) return undefined;

        // Entrée périmée : on la supprime et on répond "absent" pour forcer le recalcul.
        if (now() >= entry.expiresAt) {
            store.delete(key);
            return undefined;
        }
        return entry.value;
    }

    function has(key) {
        return get(key) !== undefined;
    }

    function del(key) {
        return store.delete(key);
    }

    // Vide toutes les entrées dont la clé commence par `prefix`.
    // Ex : invalidatePrefix('history:biblio_jb') efface tout l'historique de ce lieu,
    // toutes périodes confondues. Retourne le nombre d'entrées supprimées.
    function invalidatePrefix(prefix) {
        let removed = 0;
        for (const key of store.keys()) {
            if (key.startsWith(prefix)) {
                store.delete(key);
                removed += 1;
            }
        }
        return removed;
    }

    function clear() {
        store.clear();
    }

    function size() {
        return store.size;
    }

    return { set, get, has, del, invalidatePrefix, clear, size };
}

// Préfixes de clés : une famille de lecture par préfixe.
const CACHE_PREFIX = {
    history: 'history:',
    quietHours: 'quiet-hours:',
    recommendations: 'recommendations:'
};

// Combien de temps on garde chaque famille avant de recalculer.
// L'historique récent bouge vite (1 min) ; les créneaux calmes et les
// recommandations sont des moyennes stables (5 min).
const CACHE_TTL_MS = {
    history: 60 * 1000,
    quietHours: 5 * 60 * 1000,
    recommendations: 5 * 60 * 1000
};

/*
Une nouvelle mesure sur un lieu rend obsolètes :
- son historique (toutes périodes) et ses créneaux calmes ;
- toutes les recommandations, car elles sont calculées sur l'ensemble des mesures.
On efface donc ces entrées pour qu'elles soient recalculées au prochain appel.
 */
function invalidateOnNewMeasurement(location, target = cache) {
    target.invalidatePrefix(`${CACHE_PREFIX.history}${location}`);
    target.invalidatePrefix(`${CACHE_PREFIX.quietHours}${location}`);
    target.invalidatePrefix(CACHE_PREFIX.recommendations);
}

// Instance partagée utilisée par les routes.
const cache = createCache();

module.exports = {
    createCache,
    cache,
    CACHE_PREFIX,
    CACHE_TTL_MS,
    invalidateOnNewMeasurement
};
