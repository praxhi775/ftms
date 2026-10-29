import { CalendarClock, Plus, Pencil, Trash2, Activity, Trophy } from 'lucide-react';
import {
  SESSION_STATUSES,
  sessionGoals,
  computeStandings,
} from '../../utils/sessionUtils';

function TeamDot({ color }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        backgroundColor: color || '#9CA3AF',
        border: '1px solid rgba(0,0,0,0.15)',
        marginRight: '6px',
      }}
    />
  );
}

const STATUS_ACCENT = { upcoming: '#E5E7EB', active: '#34D399', completed: '#9CA3AF' };

function TeamChip({ team }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        maxWidth: '100%',
        padding: '6px 12px',
        borderRadius: '999px',
        backgroundColor: 'var(--bg-subtle)',
        border: '1px solid var(--border-subtle)',
        fontSize: '13.5px',
        fontWeight: 700,
        color: 'var(--text-primary)',
        overflowWrap: 'anywhere',
      }}
    >
      <TeamDot color={team?.color} />
      {team?.name || 'Removed team'}
    </span>
  );
}

export default function SessionsPanel({
  sessions = [],
  teams = [],
  events = [],
  matchCompleted = false,
  onAdd,
  onEdit,
  onDelete,
  onChangeStatus,
  onRecordActivity,
}) {
  const teamById = (id) => teams.find((t) => t.id === id);
  const standings = computeStandings(sessions, teams);
  const canAdd = teams.length >= 2 && !matchCompleted;

  const iconBtn = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    padding: '6px',
    borderRadius: '6px',
  };

  return (
    <section
      aria-labelledby="sessions-heading"
      style={{ backgroundColor: '#fff', borderRadius: '18px', border: '1px solid var(--border-subtle)', padding: '22px 24px', boxShadow: 'var(--shadow-sm)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarClock size={18} style={{ color: 'var(--forest-green)' }} />
            <h2 id="sessions-heading" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Matches
            </h2>
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Fixtures between this match&apos;s teams, played like a league.
          </p>
        </div>

        <button
          type="button"
          className="btn-import-backup"
          onClick={onAdd}
          disabled={!canAdd}
          title={
            matchCompleted
              ? 'Matches are locked for a completed session'
              : teams.length < 2
                ? 'Create at least two teams first'
                : 'Add a match'
          }
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: canAdd ? 1 : 0.5, cursor: canAdd ? 'pointer' : 'not-allowed' }}
        >
          <Plus size={15} />
          <span>Add Match</span>
        </button>
      </div>

      {sessions.length === 0 ? (
        <div style={{ padding: '22px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', backgroundColor: 'var(--bg-subtle)', borderRadius: '12px' }}>
          {teams.length < 2
            ? 'Create at least two teams in the Team Builder below, then add matches between them.'
            : <>No matches yet. Use <strong>Add Match</strong> to schedule the first fixture.</>}
        </div>
      ) : (
        <>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sessions.map((session, idx) => {
              const teamA = teamById(session.teamAId);
              const teamB = teamById(session.teamBId);
              const goals = sessionGoals(session, events, teams);
              const recordedCount = events.filter((e) => e.sessionId === session.id).length;

              let scoreText = 'vs';
              if (session.status === 'completed' && session.score) {
                scoreText = `${session.score.home} – ${session.score.away}`;
              } else if (session.status === 'active') {
                scoreText = `${goals.a} – ${goals.b}`;
              }

              const isActive = session.status === 'active';
              // activity can only be recorded while the match is active
              const canRecord = !matchCompleted && isActive;

              return (
                <li
                  key={session.id}
                  style={{
                    display: 'flex',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    backgroundColor: '#fff',
                    border: '1px solid var(--border-subtle)',
                    boxShadow: isActive ? '0 0 0 2px #A7F3D0' : 'none',
                  }}
                >
                  {/* Colour strip shows the status at a glance */}
                  <div aria-hidden="true" style={{ width: '5px', flexShrink: 0, backgroundColor: STATUS_ACCENT[session.status] || '#9CA3AF' }} />

                  <div style={{ flex: 1, minWidth: 0, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Title + actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <span
                          aria-hidden="true"
                          style={{ width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}
                        >
                          {idx + 1}
                        </span>
                        <strong style={{ fontSize: '15px', color: 'var(--text-primary)', overflowWrap: 'anywhere' }}>{session.name}</strong>
                        {isActive && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em', color: '#047857' }}>
                            <span aria-hidden="true" style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10B981' }} />
                            LIVE
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                        <button
                          type="button"
                          style={{
                            ...iconBtn,
                            color: canRecord ? 'var(--forest-green)' : '#D1D5DB',
                            cursor: canRecord ? 'pointer' : 'not-allowed',
                          }}
                          onClick={() => onRecordActivity(session.id)}
                          disabled={!canRecord}
                          aria-label={`Record activity for ${session.name}`}
                          title={
                            matchCompleted
                              ? 'Session is completed'
                              : session.status === 'completed'
                                ? 'Match is completed'
                                : !isActive
                                  ? 'Set this match to Active to record activity'
                                  : 'Record goal / foul'
                          }
                        >
                          <Activity size={16} />
                        </button>
                        {!matchCompleted && (
                          <>
                            <button type="button" style={{ ...iconBtn, color: 'var(--text-secondary)' }} onClick={() => onEdit(session)} aria-label={`Edit ${session.name}`} title="Edit match">
                              <Pencil size={15} />
                            </button>
                            <button type="button" style={{ ...iconBtn, color: '#DC2626' }} onClick={() => onDelete(session)} aria-label={`Delete ${session.name}`} title="Delete match">
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Fixture: team vs team with the score in the middle */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <TeamChip team={teamA} />
                      </div>
                      <div
                        style={{
                          minWidth: '76px',
                          padding: '6px 14px',
                          textAlign: 'center',
                          borderRadius: '10px',
                          backgroundColor: session.status === 'upcoming' ? 'var(--bg-subtle)' : '#F4FBF7',
                          fontSize: '20px',
                          fontWeight: 800,
                          fontFamily: 'var(--font-heading)',
                          color: session.status === 'upcoming' ? 'var(--text-muted)' : 'var(--forest-green)',
                        }}
                      >
                        {scoreText}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <TeamChip team={teamB} />
                      </div>
                    </div>

                    {/* Status control + activity count */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div role="group" aria-label={`Status of ${session.name}`} style={{ display: 'inline-flex', gap: '4px', padding: '3px', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '10px' }}>
                        {[
                          { key: 'active', hint: isActive ? 'Click again to set this match back to not started' : 'Start this match' },
                          { key: 'completed', hint: 'Complete this match' },
                        ].map(({ key, hint }) => {
                          const cfg = SESSION_STATUSES[key];
                          const selected = session.status === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              aria-pressed={selected}
                              disabled={matchCompleted}
                              title={selected && key === 'completed' ? undefined : hint}
                              onClick={() => {
                                if (key === 'active') {
                                  // Active toggles: start it, or click again to put it back to "not started"
                                  onChangeStatus(session, selected ? 'upcoming' : 'active');
                                } else if (!selected) {
                                  onChangeStatus(session, 'completed');
                                }
                              }}
                              style={{
                                padding: '5px 14px',
                                borderRadius: '8px',
                                border: 'none',
                                fontSize: '12px',
                                fontWeight: 700,
                                fontFamily: 'inherit',
                                cursor: matchCompleted || (selected && key === 'completed') ? 'default' : 'pointer',
                                backgroundColor: selected ? cfg.bg : 'transparent',
                                color: selected ? cfg.color : 'var(--text-muted)',
                              }}
                            >
                              {cfg.label}
                            </button>
                          );
                        })}
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {recordedCount} {recordedCount === 1 ? 'activity' : 'activities'} recorded
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* League table */}
          <div style={{ marginTop: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Trophy size={16} style={{ color: 'var(--forest-green)' }} />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>League Table</h3>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>completed matches · 3 pts win, 1 pt draw</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '420px' }}>
                <thead>
                  <tr style={{ textAlign: 'center', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '8px 6px', width: '32px' }}>#</th>
                    <th style={{ padding: '8px 6px', textAlign: 'left' }}>Team</th>
                    {['P', 'W', 'D', 'L', 'GF', 'GA', 'GD', 'Pts'].map((h) => (
                      <th key={h} style={{ padding: '8px 6px', width: '38px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row, i) => {
                    const team = teamById(row.teamId);
                    return (
                      <tr key={row.teamId} style={{ textAlign: 'center', borderTop: '1px solid var(--border-subtle)', backgroundColor: i === 0 && row.played > 0 ? '#F4FBF7' : 'transparent' }}>
                        <td style={{ padding: '9px 6px', fontWeight: 700, color: 'var(--text-muted)' }}>{i + 1}</td>
                        <td style={{ padding: '9px 6px', textAlign: 'left', fontWeight: 700, color: 'var(--text-primary)' }}>
                          <TeamDot color={team?.color} />
                          {team?.name || 'Removed team'}
                        </td>
                        <td>{row.played}</td>
                        <td>{row.won}</td>
                        <td>{row.drawn}</td>
                        <td>{row.lost}</td>
                        <td>{row.gf}</td>
                        <td>{row.ga}</td>
                        <td>{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                        <td style={{ fontWeight: 800, color: 'var(--forest-green)' }}>{row.pts}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}