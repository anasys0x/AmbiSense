import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import HistoryChart, { buildChartPoints, shouldShowDots } from './HistoryChart';

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

  it('coupe la courbe lorsqu il existe un grand intervalle sans mesure', () => {
    const points = buildChartPoints([
      { value: 53, timestamp: '2026-07-19T20:00:00.000Z' },
      { value: 55, timestamp: '2026-07-21T20:00:00.000Z' }
    ]);

    expect(points).toHaveLength(3);
    expect(points[1].value).toBeNull();
  });

  it('explique et affiche une periode contenant une seule tranche', () => {
    render(<HistoryChart measurements={[MEASUREMENTS[0]]} meta={META} />);

    expect(screen.getByText(/une seule tranche est disponible/i)).toBeInTheDocument();
  });

  it('affiche des points sur un historique agrege mais pas sur des centaines de mesures brutes', () => {
    expect(shouldShowDots(Array.from({ length: 49 }, () => ({ value: 50 })))).toBe(true);
    expect(shouldShowDots(Array.from({ length: 392 }, () => ({ value: 50 })))).toBe(false);
  });
});
