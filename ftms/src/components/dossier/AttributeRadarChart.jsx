import { useMemo } from 'react';
import { Circle } from 'lucide-react';

const AXES = [
  { key: 'pac', label: 'PAC', angle: -90, positionClass: 'pos-top' },
  { key: 'sho', label: 'SHO', angle: -30, positionClass: 'pos-top-right' },
  { key: 'pas', label: 'PAS', angle: 30, positionClass: 'pos-bottom-right' },
  { key: 'phy', label: 'PHY', angle: 90, positionClass: 'pos-bottom' },
  { key: 'def', label: 'DEF', angle: 150, positionClass: 'pos-bottom-left' },
  { key: 'dri', label: 'DRI', angle: 210, positionClass: 'pos-top-left' },
];

const RING_LEVELS = [0.2, 0.4, 0.6, 0.8, 1.0];

function getBadgeStyleClass(value) {
  if (value >= 80) return 'badge-radar-elite';
  if (value >= 60) return 'badge-radar-solid';
  return 'badge-radar-dev';
}

export default function AttributeRadarChart({ ratings }) {
  const cx = 200;
  const cy = 180;
  const radius = 110;

  const gridRings = useMemo(() => {
    return RING_LEVELS.map((lvl) => {
      const r = radius * lvl;
      const points = AXES.map((axis) => {
        const rad = (axis.angle * Math.PI) / 180;
        const x = cx + r * Math.cos(rad);
        const y = cy + r * Math.sin(rad);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');
      return points;
    });
  }, [radius, cx, cy]);

  // Spokes from center to outer ring
  const spokes = useMemo(() => {
    return AXES.map((axis) => {
      const rad = (axis.angle * Math.PI) / 180;
      const x2 = cx + radius * Math.cos(rad);
      const y2 = cy + radius * Math.sin(rad);
      return { x1: cx, y1: cy, x2, y2, key: axis.key };
    });
  }, [radius, cx, cy]);

  // Polygon data points based on player ratings (normalized 0..100)
  const { dataPointsString, vertices } = useMemo(() => {
    const coords = AXES.map((axis) => {
      const val = Math.max(10, Math.min(99, ratings[axis.key] || 50));
      const r = (val / 100) * radius;
      const rad = (axis.angle * Math.PI) / 180;
      const x = cx + r * Math.cos(rad);
      const y = cy + r * Math.sin(rad);
      return { x, y, val, key: axis.key };
    });

    const ptsString = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
    return { dataPointsString: ptsString, vertices: coords };
  }, [ratings, radius, cx, cy]);

  return (
    <div className="radar-chart-container">
      {/* Title & Legend Row */}
      <div className="radar-header-row">
        <div className="radar-title-group">
          <Circle size={15} className="radar-title-icon" strokeWidth={2.5} />
          <h3 className="radar-title">Attribute Profile</h3>
        </div>

        <div className="radar-legend">
          <span className="legend-item">
            <span className="legend-dot dot-elite"></span>
            <span>80+ Elite</span>
          </span>
          <span className="legend-item">
            <span className="legend-dot dot-solid"></span>
            <span>60–79 Solid</span>
          </span>
          <span className="legend-item">
            <span className="legend-dot dot-dev"></span>
            <span>&lt;60 Dev</span>
          </span>
        </div>
      </div>

      {/* Interactive Radar Visualizer */}
      <div className="radar-visualizer-wrapper">
        <svg
          viewBox="0 0 400 360"
          className="radar-svg"
          aria-label="Six-axis Player Attribute Radar Chart"
        >
          {/* Concentric Hexagon Grid Rings */}
          {gridRings.map((pts, i) => (
            <polygon
              key={`ring-${i}`}
              points={pts}
              className="radar-grid-ring"
            />
          ))}

          {/* Radial Spokes */}
          {spokes.map((spoke) => (
            <line
              key={`spoke-${spoke.key}`}
              x1={spoke.x1}
              y1={spoke.y1}
              x2={spoke.x2}
              y2={spoke.y2}
              className="radar-spoke"
            />
          ))}

          {/* Player Ratings Data Polygon */}
          <polygon
            points={dataPointsString}
            className="radar-data-polygon"
          />

          {/* Vertex Points */}
          {vertices.map((v) => (
            <circle
              key={`vertex-${v.key}`}
              cx={v.x}
              cy={v.y}
              r={4}
              className="radar-vertex-dot"
            />
          ))}
        </svg>

        {/* Outer Attribute Badges */}
        <div className="radar-labels-overlay" aria-hidden="true">
          {AXES.map((axis) => {
            const val = ratings[axis.key];
            const badgeClass = getBadgeStyleClass(val);
            return (
              <div
                key={axis.key}
                className={`radar-attribute-badge ${axis.positionClass} ${badgeClass}`}
              >
                <span className="badge-attr-label">{axis.label}</span>
                <span className="badge-attr-val">{val}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Normalization Baseline Caption */}
      <p className="radar-baseline-caption">
        Radial normalized against Tier 1 Continental wingers (500+ match baseline).
      </p>
    </div>
  );
}
