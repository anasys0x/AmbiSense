import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import HistoryChart from './HistoryChart';

const MEASUREMENTS = [
  { value: 35.2, timestamp: '2026-07-17T09:00:00.000Z' },
  { value: 62.7, timestamp: '2026-07-17T10:00:00.000Z' },
  { value: 74.1, timestamp: '2026-07-17T11:00:00.000Z' }
];

const META = {
  unit: 'dB',
  bands: [
    { code: 'calm', label: 'Calme', min: null, max: 40 },
    { code: 'moderate', label: 'Modéré', min: 40, max: 70 },
    { code: 'animated', label: 'Animé', min: 70, max: null }
  ]
};

describe('HistoryChart', () => {
  afterEach(cleanup);

  it('rend le graphe avec unite annoncee pour les lecteurs decran', () => {
    render(<HistoryChart measurements={MEASUREMENTS} meta={META} />);

    expect(
      screen.getByRole('img', { name: /évolution du niveau sonore en dB/i })
    ).toBeInTheDocument();
  });

  it('ne plante pas sans bandes echelle (meta minimale)', () => {
    render(<HistoryChart measurements={MEASUREMENTS} meta={{ unit: 'dB' }} />);

    expect(screen.getByRole('img')).toBeInTheDocument();
  });
});
