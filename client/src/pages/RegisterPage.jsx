import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/compte', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="form-panel">
      <p className="eyebrow">Participer aux observations</p>
      <h1>Créer un compte</h1>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <form onSubmit={handleSubmit}>
        <label className="form-label" htmlFor="name">Nom</label>
        <input className="form-control mb-3" id="name" name="name" value={form.name} onChange={updateField} required />
        <label className="form-label" htmlFor="email">Courriel</label>
        <input className="form-control mb-3" id="email" name="email" type="email" value={form.email} onChange={updateField} required />
        <label className="form-label" htmlFor="password">Mot de passe</label>
        <input className="form-control mb-2" id="password" name="password" type="password" minLength="8" value={form.password} onChange={updateField} required />
        <p className="form-text mb-4">Au moins 8 caractères.</p>
        <button className="btn btn-primary w-100" disabled={submitting}>{submitting ? 'Création…' : 'Créer mon compte'}</button>
      </form>
      <p className="mt-3 mb-0">Déjà inscrit? <Link to="/connexion">Se connecter</Link></p>
    </section>
  );
}
