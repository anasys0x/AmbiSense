import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return <section className="text-center py-5"><p className="eyebrow">Erreur 404</p><h1>Page introuvable</h1><p>Cette adresse ne correspond à aucune vue AmbiSense.</p><Link className="btn btn-primary" to="/">Retour à l’accueil</Link></section>;
}
