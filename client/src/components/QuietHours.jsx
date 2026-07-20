import React from 'react';

const formatHour = (hour) => `${String(hour).padStart(2, '0')} h`;

// L'ambiance arrive deja calculee du serveur (quiet/moderate/noisy),
// ici on la traduit juste en classe CSS pour choisir la couleur de la barre
const AMBIANCE_CLASS = {
  quiet: 'calm',
  moderate: 'moderate',
  noisy: 'animated'
};

export default function QuietHours({ hours, meta }) {
  const unit = meta?.unit || 'dB';
  const quietest = meta?.quietest;
  const maxAverage = Math.max(...hours.map((slot) => slot.averageValue));

  return (
    <div className="quiet-hours">
      {quietest && (
        <p className="quiet-highlight">
          Créneau le plus calme : <strong>{formatHour(quietest.hour)}</strong>
          {' '}({quietest.averageValue} {unit} en moyenne, {quietest.count} mesure{quietest.count > 1 ? 's' : ''})
        </p>
      )}
      <ul className="quiet-list">
        {hours.map((slot) => (
          <li key={slot.hour} className={quietest && slot.hour === quietest.hour ? 'quiet-best' : ''}>
            <span className="quiet-hour">{formatHour(slot.hour)}</span>
            <span className="quiet-track">
              <span
                className={`quiet-bar quiet-bar-${AMBIANCE_CLASS[slot.ambiance] || 'moderate'}`}
                style={{ width: `${(slot.averageValue / maxAverage) * 100}%` }}
              />
            </span>
            <span className="quiet-value">{slot.averageValue} {unit}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
