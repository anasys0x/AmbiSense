import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getRecommendations } from '../services/recommendations';
import useRecommendations from './useRecommendations';

vi.mock('../services/recommendations', () => ({ getRecommendations: vi.fn() }));

describe('useRecommendations', () => {
  afterEach(() => vi.clearAllMocks());

  it('gere les criteres et le resultat hors du composant de page', async () => {
    getRecommendations.mockResolvedValue({ data: [{ rank: 1 }], meta: { hour: 14 } });
    const { result } = renderHook(() => useRecommendations(9));

    act(() => {
      result.current.setAmbiance('moderate');
      result.current.setHour('14');
    });
    await act(() => result.current.search('moderate', 14));

    expect(getRecommendations).toHaveBeenCalledWith('moderate', 14);
    expect(result.current.results.data).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it('expose les erreurs tout en conservant les criteres', async () => {
    getRecommendations.mockRejectedValue(new Error('API indisponible'));
    const { result } = renderHook(() => useRecommendations(8));

    await act(() => result.current.search('calm', 8));

    expect(result.current.error.message).toBe('API indisponible');
    expect(result.current.ambiance).toBe('calm');
    expect(result.current.hour).toBe('8');
  });
});
