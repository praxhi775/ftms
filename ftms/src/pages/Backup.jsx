import { Link } from 'react-router-dom';
import { HardDrive, Download, Upload, ArrowLeft } from 'lucide-react';

export default function Backup() {
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
            <h1 className="hero-title">Backup &amp; Data Restore</h1>
            <p className="hero-subtitle">
              Manage browser storage, export snapshot archives, and restore squad databases without external cloud dependencies.
            </p>
          </div>
          <div className="squad-status-indicator desktop-status">
            <span className="status-dot" aria-hidden="true"></span>
            <span className="status-label">Local Storage: Ready</span>
          </div>
        </div>

        {/* Quick Info Bar */}
        <div className="placeholder-stats-grid">
          <div className="stat-pill-card">
            <span className="stat-label">Storage Location</span>
            <strong className="stat-value">Device / Local Only</strong>
          </div>
          <div className="stat-pill-card">
            <span className="stat-label">Last Archive</span>
            <strong className="stat-value">Oct 18, 2024 at 19:42</strong>
          </div>
          <div className="stat-pill-card">
            <span className="stat-label">Format</span>
            <strong className="stat-value">JSON Snapshot</strong>
          </div>
          <div className="stat-pill-card">
            <span className="stat-label">Privacy Status</span>
            <strong className="stat-value">Zero-Cloud / Private</strong>
          </div>
        </div>
      </section>

      {/* Clean Empty State UI */}
      <section className="placeholder-content-card">
        <div className="empty-state-box">
          <div className="empty-state-icon-circle action-sand" aria-hidden="true">
            <HardDrive size={32} strokeWidth={2} />
          </div>
          <h2 className="empty-state-title">Local Storage Vault</h2>
          <p className="empty-state-text">
            Your squad data is isolated and lives only on this computer. In the upcoming phase, you can export a full JSON snapshot of your rosters and matches, or restore from a previously downloaded archive anytime.
          </p>

          <div className="placeholder-actions-row">
            <div className="ui-placeholder-pill">
              <Download size={16} />
              <span>Export JSON Snapshot (UI Placeholder - Next Phase)</span>
            </div>
            <div className="ui-placeholder-pill">
              <Upload size={16} />
              <span>Import &amp; Restore Archive (UI Placeholder - Next Phase)</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
