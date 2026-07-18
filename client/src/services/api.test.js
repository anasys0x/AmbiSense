import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiRequest } from './api';

describe('apiRequest', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('retourne la reponse JSON en cas de succes', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ places: [] })
    });

    await expect(apiRequest('/places')).resolves.toEqual({ places: [] });
  });

  it('utilise le message descriptif retourne par API', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: { message: 'Lieu introuvable' } })
    });

    await expect(apiRequest('/places/inconnu')).rejects.toThrow('Lieu introuvable');
  });
});
