import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getFavorites, getMyObservations, removeFavorite } from '../services/account';
import AccountPage, { getVisitedPlaces, sortObservations } from './AccountPage';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { name: 'Alice', email: 'alice@example.com' },
    token: 'jeton-alice',
    logout: vi.fn()
  })
}));

vi.mock('../services/account', () => ({
  getFavorites: vi.fn(),
  getMyObservations: vi.fn(),
  removeFavorite: vi.fn()
}));

const recentObservation = {
  _id: 'observation-2',
  location: 'Bibliothèque',
  vibe: 'calme',
  proximity: 'proche',
  notes: 'Observation récente',
  receivedAt: '2026-07-20T18:00:00.000Z'
};

const oldObservation = {
  _id: 'observation-1',
  location: 'bibliothèque',
  vibe: 'moderee',
  proximity: 'moyenne',
  notes: 'Observation ancienne',
  receivedAt: '2026-07-19T18:00:00.000Z'
};

describe('outils du recapitulatif', () => {
  it('trie les observations de la plus recente a la plus ancienne', () => {
    expect(sortObservations([oldObservation, recentObservation]).map(({ _id }) => _id))
      .toEqual(['observation-2', 'observation-1']);
  });

  it('deduit les lieux visites sans doublons de casse', () => {
    expect(getVisitedPlaces([recentObservation, oldObservation])).toEqual(['Bibliothèque']);
  });
});

describe('AccountPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    removeFavorite.mockResolvedValue({ favorites: [], count: 0 });
  });

  it('affiche les favoris, lieux visites et contributions triees', async () => {
    getFavorites.mockResolvedValue({
      favorites: [{ id: 'lieu-1', name: 'Café étudiant', slug: 'cafe-etudiant' }],
      count: 1
    });
    getMyObservations.mockResolvedValue({
      observations: [oldObservation, recentObservation],
      count: 2
    });

    render(<MemoryRouter><AccountPage /></MemoryRouter>);

    expect(await screen.findByRole('link', { name: 'Voir le portrait' })).toHaveAttribute(
      'href',
      '/lieux/cafe-etudiant'
    );

    const visited = screen.getByRole('region', { name: 'Lieux visités' });
    expect(within(visited).getAllByRole('listitem')).toHaveLength(1);
    expect(within(visited).getByText('Bibliothèque')).toBeInTheDocument();

    const activity = screen.getByRole('region', { name: 'Contributions et lieux visités' });
    const cards = within(activity).getAllByRole('article');
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent('Observation récente');
    expect(cards[0]).toHaveTextContent('Calme');
    expect(cards[0]).toHaveTextContent('Proche');
    expect(cards[1]).toHaveTextContent('Observation ancienne');
  });

  it('affiche explicitement les etats vides', async () => {
    getFavorites.mockResolvedValue({ favorites: [], count: 0 });
    getMyObservations.mockResolvedValue({ observations: [], count: 0 });

    render(<MemoryRouter><AccountPage /></MemoryRouter>);

    expect(await screen.findByText(/pas encore de lieu favori/i)).toBeInTheDocument();
    expect(await screen.findByText(/pas encore soumis d’observation/i)).toBeInTheDocument();
  });
});
