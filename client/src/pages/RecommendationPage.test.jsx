import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getRecommendations } from '../services/recommendations';
import RecommendationPage from './RecommendationPage';

vi.mock('../services/recommendations', () => ({ getRecommendations: vi.fn() }));

describe('RecommendationPage', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('affiche le meilleur lieu pour les criteres choisis', async () => {
    getRecommendations.mockResolvedValue({
      data: [{
        rank: 1,
        averageValue: 36.2,
        sampleCount: 12,
        matchesDesired: true,
        explanation: 'Correspond a ambiance calme recherchee a 14 h.',
        classification: { code: 'calm', label: 'Calme' },
        place: { name: 'Bibliotheque', slug: 'bibliotheque' }
      }],
      meta: { hour: 14 }
    });

    render(<MemoryRouter><RecommendationPage /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText(/heure pr.*vue/i), { target: { value: '14' } });
    fireEvent.click(screen.getByRole('button', { name: /chercher/i }));

    await waitFor(() => expect(screen.getByText('Bibliotheque')).toBeInTheDocument());
    expect(screen.getByText(/meilleur choix/i)).toBeInTheDocument();
    expect(getRecommendations).toHaveBeenCalledWith('calm', 14);
  });

  it('explique quand aucune mesure ne permet une recommandation', async () => {
    getRecommendations.mockResolvedValue({ data: [], meta: { hour: 3 } });

    render(<MemoryRouter><RecommendationPage /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText(/heure pr.*vue/i), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: /chercher/i }));

    expect(await screen.findByText(/aucune mesure.*3 h/i)).toBeInTheDocument();
  });

  it('affiche une erreur API sans effacer le formulaire', async () => {
    getRecommendations.mockRejectedValue(new Error('Serveur indisponible'));

    render(<MemoryRouter><RecommendationPage /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: /chercher/i }));

    expect(await screen.findByText('Serveur indisponible')).toBeInTheDocument();
    expect(screen.getByLabelText(/ambiance recherch.*e/i)).toHaveValue('calm');
  });
});
