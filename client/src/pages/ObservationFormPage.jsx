import React, { useState } from 'react';

import AsyncState from '../components/AsyncState';
import { useAuth } from '../context/AuthContext';
import useApi from '../hooks/useApi';
import { createObservation } from '../services/observations';
import { getPlaces } from '../services/places';

export default function ObservationFormPage() {
  const { token } = useAuth();
  const { data, loading, error } = useApi(getPlaces);
  const [form, setForm] = useState({ location: '', proximity: 'proche', vibe: 'calme', notes: '' });
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const places = data?.places || [];

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFeedback({ type: '', message: '' });
    setSubmitting(true);
    try {
      await createObservation(form, token);
      setFeedback({ type: 'success', message: 'Observation enregistrée.' });
      setForm((current) => ({ ...current, notes: '' }));
    } catch (requestError) {
      setFeedback({ type: 'danger', message: requestError.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="form-panel form-panel-wide">
      <p className="eyebrow">Action protégée</p>
      <h1>Ajouter une observation</h1>
      <AsyncState loading={loading} error={error} empty={!loading && !error && places.length === 0} emptyMessage="Ajoutez d’abord un lieu avec des coordonnées dans l’API.">
        {feedback.message && <div className={`alert alert-${feedback.type}`} role="status">{feedback.message}</div>}
        <form onSubmit={handleSubmit}>
          <label className="form-label" htmlFor="location">Lieu</label>
          <select className="form-select mb-3" id="location" name="location" value={form.location} onChange={updateField} required>
            <option value="">Choisir un lieu</option>
            {places.map((place) => <option key={place.id} value={place.name}>{place.name}</option>)}
          </select>
          <div className="row">
            <div className="col-md-6"><label className="form-label" htmlFor="proximity">Source sonore</label><select className="form-select mb-3" id="proximity" name="proximity" value={form.proximity} onChange={updateField}><option value="proche">Proche</option><option value="moyenne">À moyenne distance</option><option value="lointaine">Lointaine</option></select></div>
            <div className="col-md-6"><label className="form-label" htmlFor="vibe">Impression</label><select className="form-select mb-3" id="vibe" name="vibe" value={form.vibe} onChange={updateField}><option value="calme">Calme</option><option value="moderee">Modérée</option><option value="animee">Animée</option></select></div>
          </div>
          <label className="form-label" htmlFor="notes">Notes</label>
          <textarea className="form-control mb-4" id="notes" name="notes" rows="4" value={form.notes} onChange={updateField} required />
          <button className="btn btn-primary" disabled={submitting}>{submitting ? 'Enregistrement…' : 'Enregistrer l’observation'}</button>
        </form>
      </AsyncState>
    </section>
  );
}
