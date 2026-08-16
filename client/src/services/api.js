export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:1234';

// Cache volontairement limite aux reponses publiques. Il reste en memoire :
// aucune donnee sensible n'est persistee dans localStorage ou sessionStorage.
const publicApiCache = new Map();

export function clearPublicApiCache() {
  publicApiCache.clear();
}

function readPublicCache(key) {
  const entry = publicApiCache.get(key);
  if (!entry) return undefined;

  if (entry.expiresAt <= Date.now()) {
    publicApiCache.delete(key);
    return undefined;
  }

  return entry.data;
}

function writePublicCache(key, data, ttl) {
  publicApiCache.set(key, {
    data,
    expiresAt: Date.now() + ttl
  });
}

export async function apiRequest(path, options = {}) {
  const {
    token,
    body,
    headers = {},
    cacheTtl = 0,
    forceRefresh = false,
    invalidatePublicCacheOnSuccess = false,
    ...requestOptions
  } = options;
  const requestHeaders = { ...headers };
  const method = (requestOptions.method || 'GET').toUpperCase();
  const cacheKey = `${API_URL}${path}`;
  const canUsePublicCache = method === 'GET' && !token && cacheTtl > 0;

  if (canUsePublicCache && !forceRefresh) {
    const cachedData = readPublicCache(cacheKey);
    if (cachedData !== undefined) return cachedData;
  }

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
  }
  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...requestOptions,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    const message = data?.error?.message || `Erreur HTTP ${response.status}`;
    const requestError = new Error(message);
    // On garde le code HTTP sur l'erreur : les pages peuvent ainsi faire la
    // difference entre un 404 (pas encore de donnees) et une vraie erreur
    requestError.status = response.status;
    throw requestError;
  }

  if (invalidatePublicCacheOnSuccess) {
    clearPublicApiCache();
  }
  if (canUsePublicCache) {
    writePublicCache(cacheKey, data, cacheTtl);
  }

  return data;
}
