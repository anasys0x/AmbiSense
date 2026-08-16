import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { apiRequest, clearPublicApiCache } from './api';

describe('apiRequest', () => {
  beforeEach(() => {
    clearPublicApiCache();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-16T12:00:00Z'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
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

  it('reutilise une reponse publique encore valide sans nouvel appel', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ places: [{ id: '1' }] })
    });

    const first = await apiRequest('/places', { cacheTtl: 30_000 });
    const second = await apiRequest('/places', { cacheTtl: 30_000 });

    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('recharge une reponse publique expiree', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ version: 1 })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ version: 2 })
      });

    await apiRequest('/places', { cacheTtl: 30_000 });
    vi.advanceTimersByTime(30_001);

    await expect(apiRequest('/places', { cacheTtl: 30_000 }))
      .resolves.toEqual({ version: 2 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('invalide les reponses publiques apres une ecriture reussie', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ version: 1 })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ observation: { id: 'obs-1' } })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ version: 2 })
      });

    await apiRequest('/places', { cacheTtl: 30_000 });
    await apiRequest('/observations', {
      method: 'POST',
      body: { location: 'Bibliotheque' },
      invalidatePublicCacheOnSuccess: true
    });

    await expect(apiRequest('/places', { cacheTtl: 30_000 }))
      .resolves.toEqual({ version: 2 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('ne met jamais en cache une reponse authentifiee', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ favorites: [] })
    });

    await apiRequest('/users/me/favorites', { token: 'secret', cacheTtl: 30_000 });
    await apiRequest('/users/me/favorites', { token: 'secret', cacheTtl: 30_000 });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
