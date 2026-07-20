export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function apiRequest(path, options = {}) {
  const { token, body, headers = {}, ...requestOptions } = options;
  const requestHeaders = { ...headers };

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

  return data;
}
