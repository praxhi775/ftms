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

export default function AttributeRadarChart({ chartMetrics = [] }) {
  const [focusedIndex, setFocusedIndex] = useState(null);
  const badgeRefs = useRef([]);

  const cx = 200;
  const cy = 180;
  const radius = 100;

  // Prepare active axes based ONLY on metrics selected in sub-metric breakdown
  const axes = useMemo(() => {
    if (!chartMetrics || chartMetrics.length === 0) {
      return [];
    }

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
  }, [chartMetrics]);

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
  const vertices = useMemo(() => {
    if (axes.length === 0) return [];
    return axes.map((axis) => {
      const r = (axis.val / 100) * radius;
      const rad = (axis.angle * Math.PI) / 180;
      const x = cx + r * Math.cos(rad);
      const y = cy + r * Math.sin(rad);
      return { x, y, val: axis.val, label: axis.label, key: axis.key };
    });
  }, [axes, radius, cx, cy]);

  const dataPointsString = useMemo(() => {
    if (axes.length < 3) return '';
    return vertices.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  }, [axes, vertices]);

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

        {axes.length >= 3 && (
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
        )}
      </div>

      {axes.length === 0 ? (
        <div className="radar-blank-state" style={{ minHeight: '320px' }} />
      ) : (
        /* Interactive Radar Visualizer */
        <div className="radar-visualizer-wrapper">
          <svg
            viewBox="0 0 400 360"
            className="radar-svg"
            role="img"
            aria-label={`${axes.length}-axis Player Attribute Profile displaying ${axes.map((a) => `${a.label}: ${a.val}`).join(', ')}`}
          >
            {/* Concentric Grid Rings */}
            {axes.length >= 3 ? (
              gridRings.map((pts, i) => (
                <polygon
                  key={`ring-${i}`}
                  points={pts}
                  className="radar-grid-ring"
                />
              ))
            ) : (
              RING_LEVELS.map((lvl, i) => (
                <circle
                  key={`circle-ring-${i}`}
                  cx={cx}
                  cy={cy}
                  r={radius * lvl}
                  className="radar-grid-ring"
                  fill="none"
                />
              ))
            )}

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

            {/* Data Shape */}
            {axes.length >= 3 && dataPointsString && (
              <polygon
                points={dataPointsString}
                className="radar-data-polygon"
              />
            )}

            {axes.length === 2 && vertices.length === 2 && (
              <line
                x1={vertices[0].x}
                y1={vertices[0].y}
                x2={vertices[1].x}
                y2={vertices[1].y}
                stroke="#059669"
                strokeWidth={3}
                strokeLinecap="round"
              />
            )}

            {axes.length === 1 && vertices.length === 1 && (
              <line
                x1={cx}
                y1={cy}
                x2={vertices[0].x}
                y2={vertices[0].y}
                stroke="#059669"
                strokeWidth={3}
                strokeLinecap="round"
              />
            )}

            {/* Vertex Points */}
            {vertices.map((v, idx) => {
              const isHighlight = focusedIndex === idx;
              return (
                <circle
                  key={`vertex-${v.key}`}
                  cx={v.x}
                  cy={v.y}
                  r={isHighlight ? 6 : 4.5}
                  className="radar-vertex-dot"
                  style={isHighlight ? { fill: '#16A34A', strokeWidth: 2 } : { fill: '#003B1B' }}
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
