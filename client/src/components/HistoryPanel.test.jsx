import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getHistory } from '../services/ambiance';
import HistoryPanel from './HistoryPanel';

vi.mock('../services/ambiance', () => ({
  getHistory: vi.fn()
}));

describe('HistoryPanel', () => {
  beforeEach(() => vi.clearAllMocks());

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
        scale: { calm: '< 40 dB', moderate: '40-69 dB', animated: '>= 70 dB' }
      }
    });

    render(<HistoryPanel location="Bibliotheque" />);
    expect(await screen.findByText(/1 tranche horaire/i)).toBeInTheDocument();
  });
});
