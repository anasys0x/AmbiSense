import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import useAmbianceStream from '../hooks/useAmbianceStream';
import PlaceSummary from './PlaceSummary';

vi.mock('../hooks/useAmbianceStream', () => ({ default: vi.fn() }));

const place = {
  name: 'Cafe Tore et Fraction',
  slug: 'cafe-tore-et-fraction',
  locationKey: 'cafe_tore_fraction',
  ambiance: {
    value: 45,
    classification: { code: 'moderate', label: 'Moderee', isRecent: true }
  }
};

describe('PlaceSummary', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it('affiche le direct et la nouvelle mesure dans la carte du lieu', () => {
    useAmbianceStream.mockReturnValue({ value: 57.61, code: 'moderate', label: 'Moderee' });

    render(<MemoryRouter><PlaceSummary place={place} /></MemoryRouter>);

    expect(screen.getByText(/live/i)).toBeInTheDocument();
    expect(screen.getByText('57.61')).toBeInTheDocument();
    expect(useAmbianceStream).toHaveBeenCalledWith('cafe_tore_fraction');
  });

  it('garde la valeur chargee quand aucune mesure live n arrive', () => {
    useAmbianceStream.mockReturnValue(null);

    render(<MemoryRouter><PlaceSummary place={place} /></MemoryRouter>);

    expect(screen.queryByText(/live/i)).not.toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
  });
});
