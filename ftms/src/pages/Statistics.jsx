import { Link } from 'react-router-dom';
import { BarChart2, TrendingUp, ArrowLeft } from 'lucide-react';

export default function Statistics() {
  return (
    <div className="placeholder-page-container">
      {/* Header Banner */}
      <section className="welcome-hero-card placeholder-hero">
        <div className="hero-header-row">
          <div className="hero-title-group">
            <div className="breadcrumb-row">
              <Link to="/" className="breadcrumb-back">
                <ArrowLeft size={14} /> Back to Dashboard
              </Link>
            </div>
            <h1 className="hero-title">Stats &amp; Analytics</h1>
            <p className="hero-subtitle">
              Squad form metrics, win/loss distribution, attendance consistency, and player progression trends.
            </p>
          </div>
          <div className="squad-status-indicator desktop-status">
            <span className="status-dot" aria-hidden="true"></span>
            <span className="status-label">Analytics Calibrated</span>
          </div>
        </div>

        {/* Quick Info Bar */}
        <div className="placeholder-stats-grid">
          <div className="stat-pill-card">
            <span className="stat-label">Matches Logged</span>
            <strong className="stat-value">24 Scrimmages</strong>
          </div>
          <div className="stat-pill-card">
            <span className="stat-label">Squad Win Rate</span>
            <strong className="stat-value">68% Overall</strong>
          </div>
          <div className="stat-pill-card">
            <span className="stat-label">Avg. Goals / Match</span>
            <strong className="stat-value">3.6 Goals</strong>
          </div>
          <div className="stat-pill-card">
            <span className="stat-label">Attendance Rate</span>
            <strong className="stat-value">92% Reliable</strong>
          </div>
        </div>
      </section>

      {/* Clean Empty State UI */}
      <section className="placeholder-content-card">
        <div className="empty-state-box">
          <div className="empty-state-icon-circle action-sand" aria-hidden="true">
            <BarChart2 size={32} strokeWidth={2} />
          </div>
          <h2 className="empty-state-title">Squad Performance Ledger</h2>
          <p className="empty-state-text">
            Analytics visualization is prepped. In the upcoming phase, interactive charts will breakdown player chemistry, goal distribution, individual match ratings, and squad consistency over time.
          </p>

          <div className="placeholder-actions-row">
            <div className="ui-placeholder-pill">
              <TrendingUp size={16} />
              <span>Interactive Charts &amp; Form Tracker (UI Placeholder - Next Phase)</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
