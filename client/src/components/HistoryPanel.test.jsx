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
});
