import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(location.state?.from || '/compte', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="form-panel">
      <p className="eyebrow">Espace personnel</p>
      <h1>Connexion</h1>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <form onSubmit={handleSubmit}>
        <label className="form-label" htmlFor="email">Courriel</label>
        <input className="form-control mb-3" id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <label className="form-label" htmlFor="password">Mot de passe</label>
        <input className="form-control mb-4" id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        <button className="btn btn-primary w-100" disabled={submitting}>{submitting ? 'Connexion…' : 'Se connecter'}</button>
      </form>
      <p className="mt-3 mb-0">Pas encore de compte? <Link to="/inscription">Créer un compte</Link></p>
    </section>
  );
}
