import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import AmbianceBadge from './AmbianceBadge';
import AsyncState from './AsyncState';

describe('AmbianceBadge', () => {
  it('affiche le libelle fourni par API', () => {
    render(<AmbianceBadge classification={{ code: 'calm', label: 'Calme', isRecent: true }} />);

    expect(screen.getByText('Calme')).toHaveClass('ambiance-calm');
  });

  it('signale une mesure qui nest plus recente', () => {
    render(<AmbianceBadge classification={{ code: 'animated', label: 'Animé', isRecent: false }} />);

    expect(screen.getByText(/mesure ancienne/i)).toBeInTheDocument();
  });
});

describe('AsyncState', () => {
  it('rend les etats chargement, erreur et vide explicitement', () => {
    const { rerender } = render(<AsyncState loading />);
    expect(screen.getByText(/chargement/i)).toBeInTheDocument();

    rerender(<AsyncState error={new Error('API indisponible')} />);
    expect(screen.getByRole('alert')).toHaveTextContent('API indisponible');

    rerender(<AsyncState empty emptyMessage="Aucun lieu" />);
    expect(screen.getByText('Aucun lieu')).toBeInTheDocument();
  });
});
