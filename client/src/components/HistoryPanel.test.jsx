import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getHistory } from '../services/ambiance';
import useAmbianceStream from '../hooks/useAmbianceStream';
import HistoryPanel, { selectHistoryPoints } from './HistoryPanel';

vi.mock('../services/ambiance', () => ({
  getHistory: vi.fn()
}));
vi.mock('../hooks/useAmbianceStream', () => ({ default: vi.fn() }));

describe('HistoryPanel', () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    useAmbianceStream.mockReturnValue(null);
  });

  it('affiche explicitement une réponse 200 contenant une liste vide', async () => {
    getHistory.mockResolvedValue({
      data: [],
      meta: { location: 'Bibliothèque', count: 0, unit: 'dB', bands: [] }
    });

    render(<HistoryPanel location="Bibliothèque" />);

    expect(await screen.findByText(/aucune mesure sur cette période/i)).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /évolution du niveau sonore/i })).not.toBeInTheDocument();
  });

  it('utilise les tranches agregees tout en acceptant le contrat brut de l API', async () => {
    getHistory.mockResolvedValue({
      data: [{ value: 41, timestamp: '2026-07-21T10:05:00.000Z' }],
      slices: [{ value: 41, timestamp: '2026-07-21T10:00:00.000Z', count: 1 }],
      meta: {
        location: 'Bibliotheque', count: 1, measurementCount: 1,
        aggregation: { intervalMinutes: 60 },
        scale: { calm: '< 40 dB', moderate: '40-69 dB', animated: '>= 70 dB' }
      }
    });

    render(<HistoryPanel location="Bibliotheque" />);
    expect(await screen.findByText(/1 tranche de 60 minutes/i)).toBeInTheDocument();
  });

  it('utilise les tranches agrégées pour toutes les périodes', () => {
    const data = {
      data: [{ value: 51 }, { value: 52 }],
      slices: [{ value: 51.5 }]
    };

    expect(selectHistoryPoints(data)).toEqual(data.slices);
  });

  it('indique les tranches de cinq minutes dans la vue trois heures', async () => {
    getHistory.mockResolvedValue({
      data: [{ value: 51, timestamp: '2026-07-22T00:01:00.000Z' }],
      slices: [{ value: 51, timestamp: '2026-07-22T00:00:00.000Z' }],
      meta: {
        count: 1,
        measurementCount: 1,
        aggregation: { intervalMinutes: 5 },
        scale: { calm: '< 40 dB', moderate: '40-69 dB', animated: '>= 70 dB' }
      }
    });

    render(<HistoryPanel location="cafe_tore_fraction" />);
    fireEvent.click(screen.getByRole('button', { name: '3 h' }));

    expect(await screen.findByText(/1 tranche de 5 minutes/i)).toBeInTheDocument();
  });

  it('recharge l historique lorsqu une mesure live arrive', async () => {
    getHistory.mockResolvedValue({
      data: [{ value: 51, timestamp: '2026-07-22T00:45:00.000Z' }],
      slices: [{ value: 51, timestamp: '2026-07-22T00:00:00.000Z' }],
      meta: { count: 1, measurementCount: 1, aggregation: { intervalMinutes: 5 }, scale: {} }
    });
    const { rerender } = render(<HistoryPanel location="cafe_tore_fraction" />);
    await waitFor(() => expect(getHistory).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: '3 h' }));
    await waitFor(() => expect(getHistory).toHaveBeenCalledTimes(2));

    useAmbianceStream.mockReturnValue({ timestamp: '2026-07-22T00:49:00.000Z' });
    rerender(<HistoryPanel location="cafe_tore_fraction" />);

    await waitFor(() => expect(getHistory).toHaveBeenCalledTimes(3));

    useAmbianceStream.mockReturnValue({ timestamp: '2026-07-22T00:49:01.000Z' });
    rerender(<HistoryPanel location="cafe_tore_fraction" />);

    expect(getHistory).toHaveBeenCalledTimes(3);
  });

  it('ne réactualise pas automatiquement la vue Tout', async () => {
    getHistory.mockResolvedValue({
      slices: [{ value: 51, timestamp: '2026-07-22T00:00:00.000Z' }],
      meta: {
        count: 1, measurementCount: 1, aggregation: { intervalMinutes: 60 }, scale: {}
      }
    });
    const { rerender } = render(<HistoryPanel location="cafe_tore_fraction" />);
    await waitFor(() => expect(getHistory).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByRole('button', { name: 'Tout' }));
    await waitFor(() => expect(getHistory).toHaveBeenCalledTimes(2));

    useAmbianceStream.mockReturnValue({ timestamp: '2026-07-22T00:49:00.000Z' });
    rerender(<HistoryPanel location="cafe_tore_fraction" />);

    expect(getHistory).toHaveBeenCalledTimes(2);
  });
});
