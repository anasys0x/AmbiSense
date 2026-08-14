import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import RouteLoading from './RouteLoading';

describe('RouteLoading', () => {
  it('annonce le chargement de la page aux utilisateurs', () => {
    render(<RouteLoading />);

    expect(screen.getByRole('status')).toHaveTextContent('Chargement de la page');
  });
});
