import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import QuietHours from './QuietHours';

const HOURS = [
  { hour: 3, averageValue: 31.2, ambiance: 'quiet', count: 4 },
  { hour: 14, averageValue: 71.8, ambiance: 'noisy', count: 4 },
  { hour: 19, averageValue: 55.4, ambiance: 'moderate', count: 4 }
];

const META = {
  unit: 'dB',
  quietest: HOURS[0]
};

describe('QuietHours', () => {
  afterEach(cleanup);

  it('met en avant le creneau le plus calme fourni par API', () => {
    render(<QuietHours hours={HOURS} meta={META} />);

    expect(screen.getByText(/créneau le plus calme/i)).toBeInTheDocument();
    // "03 h" apparait deux fois : dans le resume en haut et dans la liste
    expect(screen.getAllByText('03 h')).toHaveLength(2);
    expect(screen.getByText(/31.2 dB en moyenne/)).toBeInTheDocument();
  });

  it('affiche chaque heure avec sa valeur moyenne et son unite', () => {
    render(<QuietHours hours={HOURS} meta={META} />);

    expect(screen.getByText('14 h')).toBeInTheDocument();
    expect(screen.getByText('71.8 dB')).toBeInTheDocument();
    expect(screen.getByText('55.4 dB')).toBeInTheDocument();
  });

  it('colore les barres selon ambiance calculee par le serveur', () => {
    const { container } = render(<QuietHours hours={HOURS} meta={META} />);

    // quiet devient calm, noisy devient animated : on verifie juste que la
    // correspondance des couleurs suit ce que le serveur a decide
    expect(container.querySelector('.quiet-bar-calm')).toBeInTheDocument();
    expect(container.querySelector('.quiet-bar-animated')).toBeInTheDocument();
    expect(container.querySelector('.quiet-bar-moderate')).toBeInTheDocument();
  });
});
