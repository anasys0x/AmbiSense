import { afterEach, describe, expect, it, vi } from 'vitest';

import { addFavorite, getFavorites, getMyObservations, removeFavorite } from './account';

describe('services du compte', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('charge les contributions avec le JWT', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ observations: [], count: 0 })
    });

    await getMyObservations('jeton-alice');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/users/me/observations'),
      expect.objectContaining({ headers: { Authorization: 'Bearer jeton-alice' } })
    );
  });

  it('consulte, ajoute et retire les favoris avec le JWT', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ favorites: [], count: 0 })
    });

    await getFavorites('jeton-alice');
    await addFavorite('lieu 1', 'jeton-alice');
    await removeFavorite('lieu 1', 'jeton-alice');

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/users/me/favorites/lieu%201'),
      expect.objectContaining({
        method: 'POST',
        headers: { Authorization: 'Bearer jeton-alice' }
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('/users/me/favorites/lieu%201'),
      expect.objectContaining({
        method: 'DELETE',
        headers: { Authorization: 'Bearer jeton-alice' }
      })
    );
  });
});
