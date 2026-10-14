import { useMemo, useState, useRef } from 'react';
import { Circle } from 'lucide-react';

const RING_LEVELS = [0.2, 0.4, 0.6, 0.8, 1.0];

function getBadgeStyleClass(value) {
  if (value >= 80) return 'badge-radar-elite';
  if (value >= 60) return 'badge-radar-solid';
  return 'badge-radar-dev';
}

function parseMetricNumeric(val) {
  if (typeof val === 'number') return val;
  const num = parseInt(val, 10);
  if (!isNaN(num)) return num;
  if (val === 'High') return 85;
  if (val === 'Med' || val === 'Medium') return 65;
  if (val === 'Low') return 45;
  return 50;
}

export default function AttributeRadarChart({ chartMetrics = [], ratings = null }) {
  const [focusedIndex, setFocusedIndex] = useState(null);
  const badgeRefs = useRef([]);

  const cx = 200;
  const cy = 180;
  const radius = 100;

  // Prepare active axes based on metrics listed as "inChart: true"
  const axes = useMemo(() => {
    if (chartMetrics && chartMetrics.length >= 3) {
      const N = chartMetrics.length;
      return chartMetrics.map((m, idx) => {
        const angle = -90 + (360 / N) * idx;
        const val = parseMetricNumeric(m.value);
        return {
          id: m.id || `axis-${idx}`,
          label: m.name,
          val: Math.max(1, Math.min(99, val)),
          angle,
          key: m.id || `m-${idx}`,
        };
      });
    }

    // Fallback if chartMetrics not supplied: use legacy 6 ratings
    if (ratings) {
      const defaultAxes = [
        { key: 'pac', label: 'PAC', angle: -90, val: ratings.pac || 50 },
        { key: 'sho', label: 'SHO', angle: -30, val: ratings.sho || 50 },
        { key: 'pas', label: 'PAS', angle: 30, val: ratings.pas || 50 },
        { key: 'phy', label: 'PHY', angle: 90, val: ratings.phy || 50 },
        { key: 'def', label: 'DEF', angle: 150, val: ratings.def || 50 },
        { key: 'dri', label: 'DRI', angle: 210, val: ratings.dri || 50 },
      ];
      return defaultAxes.map((a, i) => ({
        id: a.key,
        label: a.label,
        val: Math.max(1, Math.min(99, a.val)),
        angle: a.angle,
        key: a.key,
      }));
    }

    return [];
  }, [chartMetrics, ratings]);

  // Concentric regular polygon rings with axes.length vertices
  const gridRings = useMemo(() => {
    if (axes.length < 3) return [];
    return RING_LEVELS.map((lvl) => {
      const r = radius * lvl;
      return axes
        .map((axis) => {
          const rad = (axis.angle * Math.PI) / 180;
          const x = cx + r * Math.cos(rad);
          const y = cy + r * Math.sin(rad);
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');
    });
  }, [axes, radius, cx, cy]);

  // Radial spokes to each vertex
  const spokes = useMemo(() => {
    return axes.map((axis) => {
      const rad = (axis.angle * Math.PI) / 180;
      const x2 = cx + radius * Math.cos(rad);
      const y2 = cy + radius * Math.sin(rad);
      return { x1: cx, y1: cy, x2, y2, key: axis.key, angle: axis.angle };
    });
  }, [axes, radius, cx, cy]);

  // Normalized data polygon points
  const { dataPointsString, vertices } = useMemo(() => {
    if (axes.length < 3) return { dataPointsString: '', vertices: [] };
    const coords = axes.map((axis) => {
      const r = (axis.val / 100) * radius;
      const rad = (axis.angle * Math.PI) / 180;
      const x = cx + r * Math.cos(rad);
      const y = cy + r * Math.sin(rad);
      return { x, y, val: axis.val, label: axis.label, key: axis.key };
    });

    const ptsString = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
    return { dataPointsString: ptsString, vertices: coords };
  }, [axes, radius, cx, cy]);

  // Keyboard navigation across axes
  const handleBadgeKeyDown = (e, index) => {
    if (axes.length === 0) return;
    let nextIndex = null;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (index + 1) % axes.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (index - 1 + axes.length) % axes.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = axes.length - 1;
    }

    if (nextIndex !== null) {
      setFocusedIndex(nextIndex);
      if (badgeRefs.current[nextIndex]) {
        badgeRefs.current[nextIndex].focus();
      }
    }
  };

  return (
    <div className="radar-chart-container" role="region" aria-label="Attribute Profile Radar Chart">
      {/* Title & Legend Row */}
      <div className="radar-header-row">
        <div className="radar-title-group">
          <Circle size={15} className="radar-title-icon" strokeWidth={2.5} />
          <h3 className="radar-title">Attribute Profile</h3>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '4px' }}>
            ({axes.length} chart metrics)
          </span>
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

      {axes.length < 3 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '50px 20px',
            textAlign: 'center',
            backgroundColor: '#fff',
            borderRadius: '12px',
            border: '1px dashed #D1D5DB',
            margin: '20px 0',
          }}
        >
          <p style={{ fontWeight: 600, fontSize: '13.5px', color: 'var(--text-primary)' }}>
            Polygon Chart Requires at Least 3 Active Metrics
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Toggle "✓ Chart" on the sub-metrics below to display them on the radar polygon.
          </p>
        </div>
      ) : (
        /* Interactive Radar Visualizer */
        <div className="radar-visualizer-wrapper">
          <svg
            viewBox="0 0 400 360"
            className="radar-svg"
            role="img"
            aria-label={`${axes.length}-axis Player Attribute Radar Chart displaying ${axes.map((a) => `${a.label}: ${a.val}`).join(', ')}`}
          >
            {/* Concentric Grid Rings */}
            {gridRings.map((pts, i) => (
              <polygon
                key={`ring-${i}`}
                points={pts}
                className="radar-grid-ring"
              />
            ))}

            {/* Radial Spokes */}
            {spokes.map((spoke, idx) => {
              const isHighlight = focusedIndex === idx;
              return (
                <line
                  key={`spoke-${spoke.key}`}
                  x1={spoke.x1}
                  y1={spoke.y1}
                  x2={spoke.x2}
                  y2={spoke.y2}
                  className="radar-spoke"
                  style={isHighlight ? { stroke: '#003B1B', strokeWidth: 2, strokeDasharray: 'none' } : undefined}
                />
              );
            })}

            {/* Player Ratings Data Polygon */}
            <polygon
              points={dataPointsString}
              className="radar-data-polygon"
            />

            {/* Vertex Points */}
            {vertices.map((v, idx) => {
              const isHighlight = focusedIndex === idx;
              return (
                <circle
                  key={`vertex-${v.key}`}
                  cx={v.x}
                  cy={v.y}
                  r={isHighlight ? 6 : 4}
                  className="radar-vertex-dot"
                  style={isHighlight ? { fill: '#16A34A', strokeWidth: 2 } : undefined}
                />
              );
            })}
          </svg>

          {/* Outer Attribute Badges */}
          <div className="radar-labels-overlay" role="toolbar" aria-label="Radar attributes (use arrow keys to navigate)">
            {axes.map((axis, idx) => {
              const badgeClass = getBadgeStyleClass(axis.val);
              const rad = (axis.angle * Math.PI) / 180;
              const badgeRadius = radius + 36;
              const bx = cx + badgeRadius * Math.cos(rad);
              const by = cy + badgeRadius * Math.sin(rad);

              const leftPercent = ((bx / 400) * 100).toFixed(1);
              const topPercent = ((by / 360) * 100).toFixed(1);
              const isFocused = focusedIndex === idx;

              return (
                <div
                  key={axis.key}
                  ref={(el) => (badgeRefs.current[idx] = el)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${axis.label}: ${axis.val}`}
                  className={`radar-attribute-badge ${badgeClass} ${isFocused ? 'badge-focused' : ''}`}
                  style={{
                    left: `${leftPercent}%`,
                    top: `${topPercent}%`,
                    outline: isFocused ? '2px solid #003B1B' : undefined,
                    outlineOffset: isFocused ? '2px' : undefined,
                    cursor: 'pointer',
                    maxWidth: '120px',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                  }}
                  onFocus={() => setFocusedIndex(idx)}
                  onBlur={() => setFocusedIndex(null)}
                  onMouseEnter={() => setFocusedIndex(idx)}
                  onMouseLeave={() => setFocusedIndex(null)}
                  onKeyDown={(e) => handleBadgeKeyDown(e, idx)}
                >
                  <span className="badge-attr-label" title={axis.label}>
                    {axis.label}
                  </span>
                  <span className="badge-attr-val">{axis.val}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Normalization Baseline Caption */}
      <p className="radar-baseline-caption">
        Radial normalized dynamically against calibrated squad baselines (1–99).
      </p>
    </div>
  );
}
