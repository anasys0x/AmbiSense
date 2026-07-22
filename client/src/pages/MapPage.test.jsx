import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import useApi from '../hooks/useApi';
import MapPage, { filterPlaces } from './MapPage';

vi.mock('../hooks/useApi', () => ({ default: vi.fn() }));
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div>{children}</div>,
  TileLayer: () => null
}));
vi.mock('../components/PlaceMarker', () => ({
  default: ({ place }) => <div data-testid="place-marker">{place.name}</div>
}));

const places = [
  { id: '1', name: 'Bibliotheque', ambiance: { classification: { code: 'calm', isRecent: true } } },
  { id: '2', name: 'Cafe', ambiance: { classification: { code: 'moderate', isRecent: true } } },
  { id: '3', name: 'Agora', ambiance: { classification: { code: 'animated', isRecent: true } } },
  { id: '4', name: 'Sans mesure', ambiance: null }
];

describe('MapPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useApi.mockReturnValue({ data: { places }, loading: false, error: null });
  });
  afterEach(() => cleanup());

  it('filtre les lieux selon leur classification recente', () => {
    expect(filterPlaces(places, 'calm').map(({ name }) => name)).toEqual(['Bibliotheque']);
    expect(filterPlaces(places, 'moderate').map(({ name }) => name)).toEqual(['Cafe']);
    expect(filterPlaces(places, 'all')).toHaveLength(4);
  });

  it('affiche uniquement les marqueurs calmes apres un clic', () => {
    render(<MapPage />);

    fireEvent.click(screen.getByRole('button', { name: /calmes/i }));

    expect(screen.getByText('Bibliotheque')).toBeInTheDocument();
    expect(screen.queryByText('Cafe')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /calmes/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('explique comment consulter les heures calmes', () => {
    render(<MapPage />);

    expect(screen.getByText(/portrait.*créneaux calmes/i)).toBeInTheDocument();
  });
});
