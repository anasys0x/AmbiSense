import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider, useAuth } from './AuthContext';

function AuthConsumer() {
  const { user, loading, login } = useAuth();
  if (loading) return <p>Validation…</p>;

  return (
    <div>
      <span>{user ? user.name : 'Déconnecté'}</span>
      <button onClick={() => login('alice@example.com', 'motdepasse123')}>Connexion test</button>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('connecte utilisateur et conserve le jeton', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        user: { name: 'Alice', email: 'alice@example.com' },
        authToken: 'jeton-alice'
      })
    });

    render(<AuthProvider><AuthConsumer /></AuthProvider>);
    await userEvent.click(await screen.findByRole('button', { name: /connexion test/i }));

    await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());
    expect(localStorage.getItem('ambisense:authToken')).toBe('jeton-alice');
  });
});
