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

const MAX_CONTINUOUS_GAP_MS = 90 * 60 * 1000;

export function buildChartPoints(measurements) {
  const ordered = measurements
    .map((measurement) => ({
      timestamp: new Date(measurement.timestamp).getTime(),
      value: measurement.value
    }))
    .sort((first, second) => first.timestamp - second.timestamp);

  return ordered.reduce((points, point, index) => {
    const previous = ordered[index - 1];
    if (previous && point.timestamp - previous.timestamp > MAX_CONTINUOUS_GAP_MS) {
      points.push({
        timestamp: previous.timestamp + ((point.timestamp - previous.timestamp) / 2),
        value: null
      });
    }
    points.push(point);
    return points;
  }, []);
}

export function shouldShowDots(points) {
  return points.length > 0 && points.length <= 100;
}

export default function HistoryChart({ measurements, meta }) {
  const points = buildChartPoints(measurements);
  const measuredPoints = points.filter((point) => point.value !== null);
  const singlePoint = measuredPoints.length === 1;

  const maxValue = Math.max(...measuredPoints.map((point) => point.value), 80);
  const yMax = Math.ceil((maxValue + 10) / 10) * 10;
  const bands = meta?.bands || [];
  const unit = meta?.unit || 'dB';
  const xDomain = singlePoint
    ? [measuredPoints[0].timestamp - 1800000, measuredPoints[0].timestamp + 1800000]
    : ['dataMin', 'dataMax'];

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
            domain={xDomain}
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
          <Line
            type="monotone"
            dataKey="value"
            stroke="#1c77c3"
            strokeWidth={2}
            dot={shouldShowDots(measuredPoints)
              ? { r: singlePoint ? 5 : 2.5, fill: '#1c77c3' }
              : false}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
      {singlePoint && (
        <p className="history-single-point">Une seule tranche est disponible dans cette période.</p>
      )}
    </div>
  );
}
