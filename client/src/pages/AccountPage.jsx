import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

export default function AccountPage() {
  const { user, logout } = useAuth();
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate('/');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <section>
      <p className="eyebrow">Espace compte</p>
      <h1>Bonjour, {user.name}</h1>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <div className="account-grid">
        <article className="account-card"><h2>Identité</h2><p><strong>Nom</strong><br />{user.name}</p><p><strong>Courriel</strong><br />{user.email}</p></article>
        <article className="account-card"><h2>Contribuer</h2><p>Partagez ce que vous entendez dans un lieu suivi.</p><Link className="btn btn-primary" to="/observations/nouvelle">Ajouter une observation</Link></article>
      </div>
      <button className="btn btn-outline-danger mt-4" onClick={handleLogout}>Se déconnecter</button>
    </section>
  );
}
