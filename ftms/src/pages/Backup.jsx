import { useState, useEffect } from 'react';
import { 
  HardDrive, 
  Download, 
  Upload, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Users, 
  Trophy, 
  Award 
} from 'lucide-react';
import { backupService } from '../services/backupService';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function Backup() {
  const [storageInfo, setStorageInfo] = useState({
    playersCount: 0,
    matchesCount: 0,
    statsCount: 0,
    lastBackup: null,
    lastRestored: null,
  });
  const [loading, setLoading] = useState(true);

  // Restore flow states
  const [selectedFileContent, setSelectedFileContent] = useState(null);
  const [backupSummary, setBackupSummary] = useState(null);
  const [restoreError, setRestoreError] = useState(null);
  const [isConfirmRestoreOpen, setIsConfirmRestoreOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const loadInfo = async () => {
    try {
      setLoading(true);
      const info = await backupService.getStorageInfo();
      setStorageInfo(info);
    } catch (err) {
      console.error('Failed to load storage info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInfo();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleExport = async () => {
    try {
      await backupService.downloadBackup();
      showToast('Database exported as JSON snapshot.');
      loadInfo();
    } catch (err) {
      showToast(err.message || 'Export failed');
    }
  };

  const handleFileChange = (e) => {
    setRestoreError(null);
    setBackupSummary(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        const validation = backupService.validateBackup(json);
        setSelectedFileContent(json);
        setBackupSummary(validation);
      } catch (err) {
        setRestoreError(err.message || 'Failed to parse JSON backup file.');
        setSelectedFileContent(null);
        setBackupSummary(null);
      }
    };
    reader.onerror = () => {
      setRestoreError('Failed to read the selected file.');
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = async () => {
    if (!selectedFileContent) return;
    setIsRestoring(true);
    try {
      await backupService.restoreData(selectedFileContent);
      setIsConfirmRestoreOpen(false);
      setSelectedFileContent(null);
      setBackupSummary(null);
      showToast('Squad database restored successfully from JSON snapshot.');
      loadInfo();
    } catch (err) {
      setRestoreError(err.message || 'Restoration failed');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="backup-page-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
            <h1 className="hero-title" style={{ fontSize: '28px' }}>Backup &amp; Data Restore</h1>
            <p className="hero-subtitle">
              Export complete roster and session snapshots to JSON, or restore previous archives with transactional safety.
            </p>
          </div>
          <div className="squad-status-indicator desktop-status">
            <span className="status-dot" aria-hidden="true"></span>
            <span className="status-label">Local Storage: Pitch Ready</span>
          </div>
        </div>

        {/* Quick Info Bar */}
        <div className="placeholder-stats-grid" style={{ marginTop: '12px' }}>
          <div className="stat-pill-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HardDrive size={14} style={{ color: 'var(--text-muted)' }} />
              <span className="stat-label">Storage Location</span>
            </div>
            <strong className="stat-value">Device IndexedDB</strong>
          </div>

          <div className="stat-pill-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} style={{ color: 'var(--text-muted)' }} />
              <span className="stat-label">Last Export</span>
            </div>
            <strong className="stat-value">
              {storageInfo.lastBackup ? new Date(storageInfo.lastBackup).toLocaleDateString() : 'Never exported'}
            </strong>
          </div>

          <div className="stat-pill-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={14} style={{ color: 'var(--text-muted)' }} />
              <span className="stat-label">Format</span>
            </div>
            <strong className="stat-value">JSON Snapshot (v1)</strong>
          </div>

          <div className="stat-pill-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={14} style={{ color: 'var(--green-dot)' }} />
              <span className="stat-label">Privacy Model</span>
            </div>
            <strong className="stat-value">Zero-Cloud / Local</strong>
          </div>
        </div>
      </section>

      {/* Export & Import Cards Grid */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Export Card */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '18px',
          border: '1px solid var(--border-subtle)',
          padding: '24px',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="icon-circle icon-circle-mint" style={{ width: '36px', height: '36px' }}>
              <Download size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Export Database
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Download a clean JSON archive of all squad records
              </p>
            </div>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Export contains current players, tactical ratings, session schedules, generated team distributions, custom stat definitions, and recorded performance numbers.
          </p>

          <div style={{
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: '10px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            fontSize: '12.5px',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Registered Players:</span>
              <strong>{storageInfo.playersCount}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Sessions Recorded:</span>
              <strong>{storageInfo.matchesCount}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Player Stats Entries:</span>
              <strong>{storageInfo.statsCount}</strong>
            </div>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
            <button
              type="button"
              className="btn-import-backup"
              onClick={handleExport}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Download size={15} />
              <span>Download JSON Backup</span>
            </button>
          </div>
        </div>

        {/* Import & Restore Card */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '18px',
          border: '1px solid var(--border-subtle)',
          padding: '24px',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="icon-circle action-sand" style={{ width: '36px', height: '36px' }}>
              <Upload size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Restore From Backup
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Upload previously exported JSON snapshot
              </p>
            </div>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Select an ftms JSON backup file. The system will inspect the schema and present a summary before safely replacing current records.
          </p>

          {/* File Picker */}
          <div>
            <label
              style={{
                display: 'block',
                padding: '16px',
                border: '2px dashed var(--border-strong)',
                borderRadius: '10px',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: 'var(--bg-subtle)',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FAF7F2'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-subtle)'}
            >
              <Upload size={20} style={{ color: 'var(--text-muted)', margin: '0 auto 6px' }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--forest-green)', display: 'block' }}>
                Click to browse backup file (.json)
              </span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {/* Validation Error Message */}
          {restoreError && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: '#FEE2E2',
              color: '#B91C1C',
              fontSize: '12px'
            }}>
              <AlertTriangle size={15} />
              <span>{restoreError}</span>
            </div>
          )}

          {/* Backup Summary Preview */}
          {backupSummary && (
            <div style={{
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '10px',
              padding: '12px',
              fontSize: '12px',
              color: '#1E40AF',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <strong style={{ fontSize: '13px', marginBottom: '2px' }}>
                Valid Backup File Detected
              </strong>
              <div>Schema Version: {backupSummary.schemaVersion}</div>
              <div>Players: {backupSummary.summary.playersCount}</div>
              <div>Sessions: {backupSummary.summary.matchesCount}</div>
              <div>Custom Stat Fields: {backupSummary.summary.statDefinitionsCount}</div>
              <div>Recorded Stats: {backupSummary.summary.playerStatsCount}</div>

              <button
                type="button"
                className="btn-import-backup"
                onClick={() => setIsConfirmRestoreOpen(true)}
                style={{ marginTop: '8px', width: '100%', justifyContent: 'center' }}
              >
                <CheckCircle size={15} />
                <span>Restore Dataset Now</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmRestoreOpen}
        title="Confirm Database Restore"
        message="Restoring from backup will REPLACE your current squad, sessions, and stats with the contents of the backup file. This cannot be undone. Are you sure you wish to proceed?"
        confirmLabel={isRestoring ? 'Restoring...' : 'Confirm Replace & Restore'}
        confirmVariant="danger"
        onCancel={() => setIsConfirmRestoreOpen(false)}
        onConfirm={handleConfirmRestore}
      />
    </div>
  );
}