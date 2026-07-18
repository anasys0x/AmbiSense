import React from 'react';
import { Link, NavLink } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

export default function Navigation() {
  const { user, loading } = useAuth();

  return (
    <nav className="navbar navbar-expand-md navbar-dark container" aria-label="Navigation principale">
      <Link className="navbar-brand" to="/">AmbiSense</Link>
      <div className="navbar-nav ms-auto align-items-md-center gap-md-2">
        <NavLink className="nav-link" to="/">Accueil</NavLink>
        <NavLink className="nav-link" to="/carte">Carte</NavLink>
        {!loading && !user && <NavLink className="nav-link" to="/connexion">Connexion</NavLink>}
        {!loading && !user && <NavLink className="btn btn-outline-light btn-sm" to="/inscription">Créer un compte</NavLink>}
        {!loading && user && <NavLink className="nav-link" to="/compte">Mon compte</NavLink>}
        {!loading && user && <NavLink className="btn btn-light btn-sm" to="/observations/nouvelle">Ajouter une observation</NavLink>}
      </div>
    </nav>
  );
}
