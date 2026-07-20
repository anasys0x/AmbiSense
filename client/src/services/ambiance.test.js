import { afterEach, describe, expect, it, vi } from 'vitest';

import { getHistory, getQuietHours } from './ambiance';

describe('services ambiance', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('construit URL historique avec la periode demandee', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [], meta: {} })
    });

    await getHistory('biblio_jb', '24');

    expect(fetchMock.mock.calls[0][0]).toContain('/ambiance/biblio_jb/history?last=24');
  });

  it('omet le parametre last quand aucune periode nest choisie', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [], meta: {} })
    });

    await getHistory('biblio_jb', '');

    expect(fetchMock.mock.calls[0][0]).toContain('/ambiance/biblio_jb/history');
    expect(fetchMock.mock.calls[0][0]).not.toContain('last=');
  });

  it('expose le code HTTP sur les erreurs pour distinguer les etats vides', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: { message: 'Aucune donnée pour ce lieu' } })
    });

    await expect(getQuietHours('lieu_vide')).rejects.toMatchObject({
      message: 'Aucune donnée pour ce lieu',
      status: 404
    });
  });
});
