import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import useAmbianceStream from '../hooks/useAmbianceStream';
import PlaceMarker from './PlaceMarker';

vi.mock('../hooks/useAmbianceStream', () => ({ default: vi.fn() }));
vi.mock('react-leaflet', () => ({
  CircleMarker: ({ children, pathOptions = {} }) => (
    <div data-testid="circle-marker" className={pathOptions.className || ''}>{children}</div>
  ),
  Tooltip: ({ children }) => <div data-testid="marker-tooltip">{children}</div>
}));

const place = {
  name: 'Cafe Tore et Fraction',
  slug: 'cafe-tore-et-fraction',
  locationKey: 'cafe_tore_fraction',
  latitude: 45.50115,
  longitude: -73.61589,
  ambiance: {
    classification: { code: 'moderate', label: 'Moderee', isRecent: true }
  },
  latestObservation: {
    notes: 'Conversations et machines à café',
    timestamp: '2026-07-22T00:45:00.000Z'
  },
  recentAverage: { value: 57.46, count: 12, periodMinutes: 30 }
};

describe('PlaceMarker', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('anime le marqueur lorsqu une mesure arrive en direct', () => {
    useAmbianceStream.mockReturnValue({
      location: 'cafe_tore_fraction',
      value: 57.61,
      code: 'moderate',
      label: 'Moderee'
    });

    render(<MemoryRouter><PlaceMarker place={place} /></MemoryRouter>);

    expect(screen.getByText(/mesure en direct/i)).toBeInTheDocument();
    expect(screen.getAllByTestId('circle-marker')[0]).toHaveClass('map-marker-live-halo');
    expect(useAmbianceStream).toHaveBeenCalledWith('cafe_tore_fraction');
  });

  it('n affiche pas l animation sans nouvelle mesure', () => {
    useAmbianceStream.mockReturnValue(null);

    render(<MemoryRouter><PlaceMarker place={place} /></MemoryRouter>);

    expect(screen.queryByText(/mesure en direct/i)).not.toBeInTheDocument();
    expect(screen.getAllByTestId('circle-marker')).toHaveLength(1);
  });

  it('affiche au survol la derniere observation et la moyenne recente', () => {
    useAmbianceStream.mockReturnValue(null);

    render(<MemoryRouter><PlaceMarker place={place} /></MemoryRouter>);

    expect(screen.getByTestId('marker-tooltip')).toBeInTheDocument();
    expect(screen.getByText('Conversations et machines à café')).toBeInTheDocument();
    expect(screen.getByText(/57.46 dB/)).toBeInTheDocument();
    expect(screen.getByText(/30 dernières minutes/i)).toBeInTheDocument();
    expect(screen.getByRole('time')).toHaveAttribute('datetime', '2026-07-22T00:45:00.000Z');
  });
});
