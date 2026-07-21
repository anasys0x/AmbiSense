import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { addFavorite, getFavorites, removeFavorite } from '../services/account';
import FavoriteButton from './FavoriteButton';

vi.mock('../services/account', () => ({
  addFavorite: vi.fn(),
  getFavorites: vi.fn(),
  removeFavorite: vi.fn()
}));

const place = { id: 'lieu-1', name: 'Bibliothèque', slug: 'bibliotheque' };

describe('FavoriteButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('invite un visiteur deconnecte a se connecter', () => {
    render(<MemoryRouter><FavoriteButton place={place} token={null} /></MemoryRouter>);

    expect(screen.getByRole('link', { name: /se connecter/i })).toHaveAttribute(
      'href',
      '/connexion'
    );
    expect(getFavorites).not.toHaveBeenCalled();
  });

  it('ajoute puis retire un favori pour utilisateur connecte', async () => {
    getFavorites.mockResolvedValue({ favorites: [], count: 0 });
    addFavorite.mockResolvedValue({ favorites: [place], count: 1 });
    removeFavorite.mockResolvedValue({ favorites: [], count: 0 });

    render(<MemoryRouter><FavoriteButton place={place} token="jeton" /></MemoryRouter>);

    await userEvent.click(await screen.findByRole('button', { name: /ajouter aux favoris/i }));
    expect(addFavorite).toHaveBeenCalledWith('lieu-1', 'jeton');

    await waitFor(() => expect(
      screen.getByRole('button', { name: /retirer des favoris/i })
    ).toHaveAttribute('aria-pressed', 'true'));

    await userEvent.click(screen.getByRole('button', { name: /retirer des favoris/i }));
    expect(removeFavorite).toHaveBeenCalledWith('lieu-1', 'jeton');
    await waitFor(() => expect(
      screen.getByRole('button', { name: /ajouter aux favoris/i })
    ).toHaveAttribute('aria-pressed', 'false'));
  });
});
