import React from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

// Memes couleurs que la palette du site (voir :root dans styles.css)
const BAND_COLORS = {
  calm: '#2a9d8f',
  moderate: '#d49a22',
  animated: '#e76f51'
};

const formatTime = (timestamp) => new Date(timestamp).toLocaleTimeString('fr-CA', {
  hour: '2-digit',
  minute: '2-digit'
});

const formatFullDate = (timestamp) => new Date(timestamp).toLocaleString('fr-CA');

export default function HistoryChart({ measurements, meta }) {
  const points = measurements.map((measurement) => ({
    timestamp: new Date(measurement.timestamp).getTime(),
    value: measurement.value
  }));

  const maxValue = Math.max(...points.map((point) => point.value), 80);
  const yMax = Math.ceil((maxValue + 10) / 10) * 10;
  const bands = meta?.bands || [];
  const unit = meta?.unit || 'dB';

  return (
    <div className="history-chart" role="img" aria-label={`Évolution du niveau sonore en ${unit}`}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={points} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          {/* Zones colorees selon les bandes envoyees par l'API :
              aucun seuil n'est recalcule cote client */}
          {bands.map((band) => (
            <ReferenceArea
              key={band.code}
              y1={band.min ?? 0}
              y2={band.max ?? yMax}
              fill={BAND_COLORS[band.code]}
              fillOpacity={0.08}
              label={{ value: band.label, position: 'insideTopRight', fontSize: 11, fill: '#526579' }}
            />
          ))}
          <XAxis
            dataKey="timestamp"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={formatTime}
            fontSize={12}
          />
          <YAxis
            domain={[0, yMax]}
            label={{ value: unit, angle: -90, position: 'insideLeft' }}
            fontSize={12}
          />
          <Tooltip
            labelFormatter={(timestamp) => formatFullDate(Number(timestamp))}
            formatter={(value) => [`${value} ${unit}`, 'Niveau sonore']}
          />
          <Line type="monotone" dataKey="value" stroke="#1c77c3" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
