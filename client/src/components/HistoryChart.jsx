import React from 'react';

// Memes couleurs que la palette du site (voir :root dans styles.css)
const BAND_COLORS = {
  calm: '#2a9d8f',
  moderate: '#d49a22',
  animated: '#e76f51'
};

const CHART = {
  width: 720,
  height: 300,
  margin: { top: 22, right: 24, bottom: 42, left: 58 }
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

function createTicks(min, max, count) {
  return Array.from({ length: count }, (_, index) => (
    min + ((max - min) * index) / (count - 1)
  ));
}

function buildLineSegments(points, toX, toY) {
  const segments = [];
  let current = [];

  points.forEach((point) => {
    if (point.value === null) {
      if (current.length) segments.push(current);
      current = [];
      return;
    }
    current.push(point);
  });
  if (current.length) segments.push(current);

  return segments.map((segment) => segment
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${toX(point.timestamp)} ${toY(point.value)}`)
    .join(' '));
}

export default function HistoryChart({ measurements, meta }) {
  const points = buildChartPoints(measurements);
  const measuredPoints = points.filter((point) => point.value !== null);

  if (measuredPoints.length === 0) return null;

  const singlePoint = measuredPoints.length === 1;
  const plotWidth = CHART.width - CHART.margin.left - CHART.margin.right;
  const plotHeight = CHART.height - CHART.margin.top - CHART.margin.bottom;
  const maxValue = Math.max(...measuredPoints.map((point) => point.value), 80);
  const yMax = Math.ceil((maxValue + 10) / 10) * 10;
  const firstTimestamp = measuredPoints[0].timestamp;
  const lastTimestamp = measuredPoints[measuredPoints.length - 1].timestamp;
  const sameTimestamp = firstTimestamp === lastTimestamp;
  const xMin = sameTimestamp ? firstTimestamp - 1800000 : firstTimestamp;
  const xMax = sameTimestamp ? lastTimestamp + 1800000 : lastTimestamp;
  const bands = meta?.bands || [];
  const unit = meta?.unit || 'dB';
  const toX = (timestamp) => (
    CHART.margin.left + ((timestamp - xMin) / (xMax - xMin)) * plotWidth
  );
  const toY = (value) => (
    CHART.margin.top + plotHeight - (Math.max(0, Math.min(value, yMax)) / yMax) * plotHeight
  );
  const xTicks = createTicks(xMin, xMax, 5);
  const yTicks = createTicks(0, yMax, 5);
  const lineSegments = buildLineSegments(points, toX, toY);

  return (
    <div className="history-chart" role="img" aria-label={`Évolution du niveau sonore en ${unit}`}>
      <div className="history-chart-scroll">
        <svg
          className="history-chart-svg"
          viewBox={`0 0 ${CHART.width} ${CHART.height}`}
          aria-hidden="true"
        >
          {bands.map((band) => {
            const bandMin = Math.max(0, band.min ?? 0);
            const bandMax = Math.min(yMax, band.max ?? yMax);
            const top = toY(bandMax);
            const bottom = toY(bandMin);
            return (
              <g key={band.code}>
                <rect
                  x={CHART.margin.left}
                  y={top}
                  width={plotWidth}
                  height={Math.max(0, bottom - top)}
                  fill={BAND_COLORS[band.code] || '#526579'}
                  opacity="0.08"
                />
                <text
                  x={CHART.width - CHART.margin.right - 6}
                  y={top + 14}
                  textAnchor="end"
                  className="history-chart-band-label"
                >
                  {band.label}
                </text>
              </g>
            );
          })}

          {yTicks.map((tick) => (
            <g key={`y-${tick}`}>
              <line
                x1={CHART.margin.left}
                x2={CHART.width - CHART.margin.right}
                y1={toY(tick)}
                y2={toY(tick)}
                className="history-chart-grid"
              />
              <text
                x={CHART.margin.left - 10}
                y={toY(tick) + 4}
                textAnchor="end"
                className="history-chart-axis-label"
              >
                {Math.round(tick)}
              </text>
            </g>
          ))}

          {xTicks.map((tick) => (
            <text
              key={`x-${tick}`}
              x={toX(tick)}
              y={CHART.height - 14}
              textAnchor="middle"
              className="history-chart-axis-label"
            >
              {formatTime(tick)}
            </text>
          ))}

          <text
            x="16"
            y={CHART.margin.top + plotHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90 16 ${CHART.margin.top + plotHeight / 2})`}
            className="history-chart-axis-title"
          >
            {unit}
          </text>

          {lineSegments.map((path, index) => (
            <path
              key={path}
              d={path}
              fill="none"
              stroke="#1c77c3"
              strokeWidth="2.5"
              vectorEffect="non-scaling-stroke"
              data-segment={index}
            />
          ))}

          {shouldShowDots(measuredPoints) && measuredPoints.map((point) => (
            <circle
              key={`${point.timestamp}-${point.value}`}
              cx={toX(point.timestamp)}
              cy={toY(point.value)}
              r={singlePoint ? 5 : 3}
              fill="#1c77c3"
            >
              <title>{`${formatFullDate(point.timestamp)} — ${point.value} ${unit}`}</title>
            </circle>
          ))}
        </svg>
      </div>
      {singlePoint && (
        <p className="history-single-point">Une seule tranche est disponible dans cette période.</p>
      )}
    </div>
  );
}
