import { useState, useEffect } from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  Sliders, 
  Plus, 
  Trash2, 
  Edit3, 
  Trophy, 
  Users, 
  Calendar, 
  PieChart as PieIcon 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  Legend 
} from 'recharts';
import { statsService } from '../services/statsService';
import { playerService } from '../services/playerService';
import { matchService } from '../services/matchService';
import StatDefinitionModal from '../components/stats/StatDefinitionModal';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function Statistics() {
  const [statDefs, setStatDefs] = useState([]);
  const [chartDataList, setChartDataList] = useState([]);
  const [summaryMetrics, setSummaryMetrics] = useState({
    totalPlayers: 0,
    upcomingMatches: 0,
    completedMatches: 0,
    totalGoals: 0,
  });
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddDefOpen, setIsAddDefOpen] = useState(false);
  const [defToEdit, setDefToEdit] = useState(null);
  const [defToDelete, setDefToDelete] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [defs, charts, pCount, upCount, compCount, goals] = await Promise.all([
        statsService.getAllDefinitions(),
        statsService.getChartData(),
        playerService.count(),
        matchService.upcomingCount(),
        matchService.completedCount(),
        statsService.getTotalGoals(),
      ]);

      setStatDefs(defs);
      setChartDataList(charts);
      setSummaryMetrics({
        totalPlayers: pCount,
        upcomingMatches: upCount,
        completedMatches: compCount,
        totalGoals: goals,
      });
    } catch (err) {
      console.error('Failed to load stats & analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDeleteDef = async () => {
    try {
      await statsService.removeDefinition(defToDelete.id);
      setDefToDelete(null);
      loadAllData();
      showToast('Custom statistic field removed.');
    } catch (err) {
      showToast(err.message || 'Failed to delete stat definition');
    }
  };

  return (
    <div className="statistics-page-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="dossier-toast" role="status" aria-live="polite">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <section className="welcome-hero-card" style={{ padding: '24px 28px' }}>
        <div className="hero-header-row" style={{ marginBottom: '16px' }}>
          <div className="hero-title-group">
            <h1 className="hero-title" style={{ fontSize: '28px' }}>Stats &amp; Squad Analytics</h1>
            <p className="hero-subtitle">
              Live squad ledger metrics, custom trackable dimensions, and player comparison charts.
            </p>
          </div>

          <button
            type="button"
            className="btn-import-backup"
            onClick={() => {
              setDefToEdit(null);
              setIsAddDefOpen(true);
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={16} />
            <span>New Custom Stat</span>
          </button>
        </div>

        {/* Live Metrics Grid */}
        <div className="placeholder-stats-grid" style={{ marginTop: '12px' }}>
          <div className="stat-pill-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={14} style={{ color: 'var(--text-muted)' }} />
              <span className="stat-label">Registered Players</span>
            </div>
            <strong className="stat-value">{summaryMetrics.totalPlayers} Squad Members</strong>
          </div>

          <div className="stat-pill-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
              <span className="stat-label">Upcoming Fixtures</span>
            </div>
            <strong className="stat-value">{summaryMetrics.upcomingMatches} Scheduled</strong>
          </div>

          <div className="stat-pill-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Trophy size={14} style={{ color: 'var(--text-muted)' }} />
              <span className="stat-label">Matches Completed</span>
            </div>
            <strong className="stat-value">{summaryMetrics.completedMatches} Logged</strong>
          </div>

          <div className="stat-pill-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={14} style={{ color: 'var(--text-muted)' }} />
              <span className="stat-label">Total Goals Scored</span>
            </div>
            <strong className="stat-value">{summaryMetrics.totalGoals} Goals</strong>
          </div>
        </div>
      </section>

      {/* Analytics Charts Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Squad Performance Charts
            </h2>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              Metrics marked "Include in charts" based on verified local match logs.
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading charts...
          </div>
        ) : chartDataList.length === 0 ? (
          <div className="placeholder-content-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div className="empty-state-icon-circle action-sand" style={{ margin: '0 auto 12px' }}>
              <BarChart2 size={28} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              No Chart Data Available
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto' }}>
              Ensure you have completed matches with recorded player statistics, and that statistic definitions have "Include in charts" enabled.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(460px, 1fr))', gap: '16px' }}>
            {chartDataList.map((item) => {
              const { def, barData, timeData } = item;
              const hasData = barData && barData.length > 0;

              return (
                <div
                  key={def.id}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    border: '1px solid var(--border-subtle)',
                    padding: '20px',
                    boxShadow: 'var(--shadow-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {def.name} {def.unit ? `(${def.unit})` : ''}
                      </h3>
                      {def.description && (
                        <p style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                          {def.description}
                        </p>
                      )}
                    </div>
                    <span className="badge badge-green" style={{ fontSize: '10px' }}>
                      {def.type === 'quantitative' ? 'Top Performers' : 'Distribution'}
                    </span>
                  </div>

                  {!hasData ? (
                    <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12.5px' }}>
                      No player statistics logged for this metric yet.
                    </div>
                  ) : (
                    <div style={{ height: '240px', width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 11, fill: '#6B7280' }}
                            interval={0}
                            angle={-20}
                            textAnchor="end"
                          />
                          <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
                          <Tooltip
                            contentStyle={{
                              borderRadius: '8px',
                              border: '1px solid #E5E7EB',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                              fontSize: '12px'
                            }}
                          />
                          <Bar dataKey="value" fill="#0D3828" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Over time line chart preview if quantitative and multi-match */}
                  {timeData && timeData.length > 1 && (
                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                        Progression Across Fixtures
                      </span>
                      <div style={{ height: '140px', width: '100%', marginTop: '6px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={timeData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                            <XAxis dataKey="match" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip contentStyle={{ fontSize: '11px' }} />
                            {Object.keys(timeData[0] || {})
                              .filter((k) => k !== 'match')
                              .slice(0, 3)
                              .map((pKey, idx) => {
                                const colors = ['#0D3828', '#16A34A', '#F59E0B'];
                                return (
                                  <Line
                                    key={pKey}
                                    type="monotone"
                                    dataKey={pKey}
                                    stroke={colors[idx % colors.length]}
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                  />
                                );
                              })}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Custom Statistic Definitions Manager */}
      <section style={{ backgroundColor: '#fff', borderRadius: '18px', border: '1px solid var(--border-subtle)', padding: '24px', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Custom Statistic Definitions
            </h2>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              Create and calibrate trackable metrics for post-match player evaluation.
            </p>
          </div>

          <button
            type="button"
            className="btn-import-backup"
            onClick={() => {
              setDefToEdit(null);
              setIsAddDefOpen(true);
            }}
          >
            <Plus size={14} />
            <span>Add Dimension</span>
          </button>
        </div>

        {statDefs.length === 0 ? (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            No stat definitions configured.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {statDefs.map((def) => (
              <div
                key={def.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                      {def.name}
                    </strong>
                    <span className="badge badge-peach" style={{ fontSize: '10px', textTransform: 'capitalize' }}>
                      {def.type}
                    </span>
                    {def.unit && (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Unit: {def.unit}
                      </span>
                    )}
                    {def.inChart === 1 && (
                      <span className="badge badge-green" style={{ fontSize: '10px' }}>
                        In Charts
                      </span>
                    )}
                  </div>
                  {def.description && (
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {def.description}
                    </p>
                  )}
                  {def.type === 'qualitative' && def.choices?.length > 0 && (
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Options: {def.choices.join(', ')}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setDefToEdit(def);
                      setIsAddDefOpen(true);
                    }}
                    style={{ padding: '6px', borderRadius: '6px', color: 'var(--forest-green)', cursor: 'pointer' }}
                    title="Edit definition"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDefToDelete(def)}
                    style={{ padding: '6px', borderRadius: '6px', color: '#DC2626', cursor: 'pointer' }}
                    title="Delete definition"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add / Edit Definition Modal */}
      <StatDefinitionModal
        isOpen={isAddDefOpen}
        defToEdit={defToEdit}
        onClose={() => {
          setIsAddDefOpen(false);
          setDefToEdit(null);
        }}
        onSaved={() => {
          loadAllData();
          showToast('Custom statistic saved.');
        }}
      />

      {/* Delete Definition Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!defToDelete}
        title="Delete Statistic Dimension"
        message={`Are you sure you want to delete "${defToDelete?.name}"? All historical match ratings logged under this statistic will be permanently removed.`}
        confirmLabel="Delete Stat"
        confirmVariant="danger"
        onCancel={() => setDefToDelete(null)}
        onConfirm={handleDeleteDef}
      />
    </div>
  );
}
