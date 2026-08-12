import { afterEach, describe, expect, it, vi } from 'vitest';

import { getRecommendations } from './recommendations';

describe('service recommendations', () => {
  afterEach(() => vi.restoreAllMocks());

  it('encode les criteres dans URL', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [], meta: {} })
    });

    await getRecommendations('calm', 14);

    expect(fetchMock.mock.calls[0][0]).toContain('/recommendations?ambiance=calm&hour=14');
  });
});
