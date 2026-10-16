import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getAuditSettingsApi,
  updateAuditSettingsApi,
  getAuditLogsApi,
  exportAuditLogsApi,
} from '../services/api';

/* ── Inline SVG Icons ── */
const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const RefreshIcon = ({ spinning }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`}>
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-emerald-600">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const AlertCircleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-rose-600">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SETTING_SECTIONS = [
  {
    id: 'general',
    title: 'General',
    description: 'Organisation name, timezone, date formats, and locale settings.',
    icon: '🏢',
    status: 'active',
  },
  {
    id: 'security',
    title: 'Security & Authentication',
    description: 'Password policies, MFA settings, session timeouts, and IP restrictions.',
    icon: '🔐',
    status: 'active',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Email, in-app, and webhook notification preferences for RBAC events.',
    icon: '🔔',
    status: 'active',
  },
  {
    id: 'audit',
    title: 'Audit & Logging',
    description: 'Audit trail retention, log export settings, and compliance report schedules.',
    icon: '📋',
    status: 'active',
  },
  {
    id: 'integrations',
    title: 'Integrations',
    description: 'Connect to LDAP/AD, SSO providers, SCIM, and third-party identity services.',
    icon: '🔗',
    status: 'coming-soon',
  },
  {
    id: 'api',
    title: 'API Access',
    description: 'Manage API keys, rate limits, and service account credentials.',
    icon: '⚙️',
    status: 'coming-soon',
  },
];

const ACTION_BADGE_MAP = {
  ROLE_CREATED: 'audit-badge--created',
  ROLE_UPDATED: 'audit-badge--updated',
  PERMISSION_MODIFIED: 'audit-badge--permission',
  BRANCH_SCOPE_CHANGED: 'audit-badge--scope',
  APPROVAL_LEVEL_CHANGED: 'audit-badge--approval',
  ROLE_ACTIVATED: 'audit-badge--activated',
  ROLE_DEACTIVATED: 'audit-badge--deactivated',
};

function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSection = searchParams.get('section');

  // Sub-tabs in Audit & Logging view: 'settings' | 'logs'
  const [auditTab, setAuditTab] = useState('settings');

  // ── Audit Settings State (Authoritative source: MongoDB) ──
  const [savedSettings, setSavedSettings] = useState(null);
  const [formSettings, setFormSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState(null);
  const [settingsSuccess, setSettingsSuccess] = useState(null);

  // ── Audit Logs State ──
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState(null);
  const [logFilterAction, setLogFilterAction] = useState('ALL');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [selectedLogDetail, setSelectedLogDetail] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Info modal for other sections
  const [otherSectionModal, setOtherSectionModal] = useState(null);

  // ── Detect Unsaved Settings Changes ──
  const isSettingsDirty = useMemo(() => {
    if (!savedSettings || !formSettings) return false;
    return JSON.stringify(savedSettings) !== JSON.stringify(formSettings);
  }, [savedSettings, formSettings]);

  // ── Fetch Persistent Settings from MongoDB ──
  const fetchAuditSettings = useCallback(async () => {
    setSettingsLoading(true);
    setSettingsError(null);
    try {
      const data = await getAuditSettingsApi();
      setSavedSettings(data);
      setFormSettings(JSON.parse(JSON.stringify(data)));
    } catch (err) {
      console.error('Failed to load audit settings:', err);
      setSettingsError(err.message || 'Failed to load audit settings from server.');
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  // ── Fetch Audit Logs from MongoDB ──
  const fetchAuditLogs = useCallback(async () => {
    setLogsLoading(true);
    setLogsError(null);
    try {
      const result = await getAuditLogsApi({
        q: logSearchQuery.trim() || undefined,
        action: logFilterAction !== 'ALL' ? logFilterAction : undefined,
      });
      setLogs(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setLogsError(err.message || 'Failed to fetch audit logs.');
    } finally {
      setLogsLoading(false);
    }
  }, [logSearchQuery, logFilterAction]);

  // Initial fetch when entering Audit & Logging section
  useEffect(() => {
    if (activeSection !== 'audit') return;

    let ignore = false;
    getAuditSettingsApi()
      .then((data) => {
        if (!ignore) {
          setSavedSettings(data);
          setFormSettings(JSON.parse(JSON.stringify(data)));
          setSettingsLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setSettingsError(err.message || 'Failed to load audit settings.');
          setSettingsLoading(false);
        }
      });

    getAuditLogsApi()
      .then((res) => {
        if (!ignore) {
          setLogs(Array.isArray(res.data) ? res.data : []);
          setLogsLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setLogsError(err.message || 'Failed to fetch audit logs.');
          setLogsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [activeSection]);

  // ── Save Settings Action ──
  const handleSaveSettings = async () => {
    if (!formSettings || settingsSaving) return;
    setSettingsSaving(true);
    setSettingsError(null);
    setSettingsSuccess(null);

    try {
      const updated = await updateAuditSettingsApi(formSettings);
      setSavedSettings(updated);
      setFormSettings(JSON.parse(JSON.stringify(updated)));
      setSettingsSuccess('Audit & Logging settings successfully saved to database.');
      setTimeout(() => setSettingsSuccess(null), 4000);
    } catch (err) {
      console.error('Failed to update audit settings:', err);
      setSettingsError(err.message || 'Failed to save settings.');
    } finally {
      setSettingsSaving(false);
    }
  };

  // ── Reset Settings Action ──
  const handleResetSettings = () => {
    if (savedSettings) {
      setFormSettings(JSON.parse(JSON.stringify(savedSettings)));
      setSettingsError(null);
      setSettingsSuccess(null);
    }
  };

  // ── Export Action ──
  const handleExport = async () => {
    setExporting(true);
    try {
      const format = formSettings?.exportFormat || 'CSV';
      await exportAuditLogsApi(format, {
        q: logSearchQuery.trim() || undefined,
        action: logFilterAction !== 'ALL' ? logFilterAction : undefined,
      });
    } catch (err) {
      console.error('Export error:', err);
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  // ── Toggle Event Handler ──
  const handleToggleEvent = (key) => {
    if (!formSettings) return;
    setFormSettings((prev) => ({
      ...prev,
      enabledEvents: {
        ...prev.enabledEvents,
        [key]: !prev.enabledEvents[key],
      },
    }));
  };

  // Format timestamp nicely
  const formatTimestamp = (dateString) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="settings-page">
      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header__left">
          {activeSection === 'audit' ? (
            <div>
              <button
                className="btn btn-ghost btn-sm text-indigo-700 hover:text-indigo-900 px-0 mb-1 inline-flex items-center gap-1 font-semibold"
                onClick={() => setSearchParams({})}
                id="back-to-settings-btn"
              >
                <ArrowLeftIcon /> Back to All Settings
              </button>
              <h2 className="page-header__title">Audit & Logging Configuration</h2>
              <p className="page-header__description">
                Manage persistent audit trail retention, event tracking rules, and view comprehensive activity logs.
              </p>
            </div>
          ) : (
            <div>
              <h2 className="page-header__title">Settings</h2>
              <p className="page-header__description">
                Configure system-wide settings for the RBAC platform.
              </p>
            </div>
          )}
        </div>
        <div className="page-header__actions">
          {activeSection === 'audit' ? (
            <button
              className="btn btn-primary btn-sm"
              id="save-settings-btn"
              disabled={!isSettingsDirty || settingsSaving}
              onClick={handleSaveSettings}
            >
              {settingsSaving ? 'Saving Changes...' : isSettingsDirty ? 'Save Changes *' : 'Save Changes'}
            </button>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              id="save-settings-btn"
              onClick={() => setSearchParams({ section: 'audit' })}
            >
              Configure Audit & Logs →
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN SECTIONS OVERVIEW (When no section active) ── */}
      {activeSection !== 'audit' && (
        <>
          <div className="settings-overview-grid">
            {SETTING_SECTIONS.map((section) => (
              <div
                key={section.id}
                className={`card transition-all duration-200 ${
                  section.status === 'coming-soon'
                    ? 'opacity-60 cursor-not-allowed'
                    : 'hover:shadow-md cursor-pointer border hover:border-blue-400'
                }`}
                id={`settings-section-${section.id}`}
                aria-label={`${section.title} settings`}
                aria-disabled={section.status === 'coming-soon'}
                onClick={() => {
                  if (section.id === 'audit') {
                    setSearchParams({ section: 'audit' });
                  } else if (section.status !== 'coming-soon') {
                    setOtherSectionModal(section);
                  }
                }}
              >
                <div className="card-body">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-2xl" aria-hidden="true">{section.icon}</span>
                    {section.status === 'coming-soon' ? (
                      <span className="status-badge warning">Soon</span>
                    ) : (
                      <span className="status-badge active">Active</span>
                    )}
                  </div>
                  <div className="card-title mb-1">{section.title}</div>
                  <p className="text-sm text-slate-500 leading-relaxed">{section.description}</p>
                  {section.status !== 'coming-soon' && (
                    <div className="mt-4">
                      <button
                        className="btn btn-ghost btn-sm text-indigo-600 hover:text-indigo-700 px-0"
                        id={`configure-${section.id}-btn`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (section.id === 'audit') {
                            setSearchParams({ section: 'audit' });
                          } else {
                            setOtherSectionModal(section);
                          }
                        }}
                      >
                        Configure →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Info Card */}
          <div className="coming-soon-card">
            <div className="coming-soon-card__icon" aria-hidden="true">
              <SettingsIcon />
            </div>
            <h3 className="coming-soon-card__title">Enterprise System Administration</h3>
            <p className="coming-soon-card__desc">
              Select <strong>Audit & Logging</strong> above to review real-time security events,
              configure MongoDB log retention schedules, or export compliance reports.
            </p>
            <span className="coming-soon-card__phase">Active RBAC Security Engine</span>
          </div>
        </>
      )}

      {/* ── AUDIT & LOGGING MANAGEMENT CONSOLE ── */}
      {activeSection === 'audit' && (
        <div>
          {/* Sub-tab Navigation */}
          <div className="settings-tabs" role="tablist" aria-label="Audit & Logging Views">
            <button
              className={`settings-tab-btn ${auditTab === 'settings' ? 'active' : ''}`}
              id="tab-audit-settings"
              role="tab"
              aria-selected={auditTab === 'settings'}
              onClick={() => setAuditTab('settings')}
            >
              <span>⚙️</span> Policies & Retention Settings
            </button>
            <button
              className={`settings-tab-btn ${auditTab === 'logs' ? 'active' : ''}`}
              id="tab-audit-logs"
              role="tab"
              aria-selected={auditTab === 'logs'}
              onClick={() => {
                setAuditTab('logs');
                fetchAuditLogs();
              }}
            >
              <span>📋</span> Audit Trail / Activity Logs ({logs.length})
            </button>
          </div>

          {/* Feedback Banners */}
          {settingsSuccess && (
            <div className="mb-6 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircleIcon />
                <span>{settingsSuccess}</span>
              </div>
              <button onClick={() => setSettingsSuccess(null)} className="text-emerald-700 hover:text-emerald-900">
                <CloseIcon />
              </button>
            </div>
          )}

          {settingsError && (
            <div className="mb-6 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircleIcon />
                <span>{settingsError}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={fetchAuditSettings} className="font-semibold underline hover:text-rose-950">
                  Retry
                </button>
                <button onClick={() => setSettingsError(null)} className="text-rose-700 hover:text-rose-900">
                  <CloseIcon />
                </button>
              </div>
            </div>
          )}

          {/* ════ TAB 1: POLICIES & RETENTION SETTINGS ════ */}
          {auditTab === 'settings' && (
            <div>
              {settingsLoading || !formSettings ? (
                <div className="card p-12 text-center text-slate-500">
                  <div className="inline-block animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-3" />
                  <div>Loading persistent audit settings from MongoDB...</div>
                </div>
              ) : (
                <>
                  {/* General Retention & Log Level */}
                  <div className="settings-section-card">
                    <div className="settings-section-header">
                      <div className="settings-section-title">Audit Trail Retention & Severity</div>
                      <div className="settings-section-desc">
                        Control how long audit records are retained in MongoDB and the minimum severity required for recording.
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Retention Days */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="setting-retention-days">
                          Retention Period
                        </label>
                        <select
                          id="setting-retention-days"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={formSettings.retentionDays}
                          onChange={(e) =>
                            setFormSettings((prev) => ({
                              ...prev,
                              retentionDays: Number(e.target.value),
                            }))
                          }
                        >
                          <option value={30}>30 Days (1 Month)</option>
                          <option value={60}>60 Days (2 Months)</option>
                          <option value={90}>90 Days (Quarterly — Default)</option>
                          <option value={180}>180 Days (6 Months)</option>
                          <option value={365}>365 Days (1 Year)</option>
                          <option value={730}>730 Days (2 Years)</option>
                          <option value={2555}>2,555 Days (7 Years — Financial Regulatory Standard)</option>
                        </select>
                        <p className="text-xs text-slate-500 mt-1">
                          Records older than this period can be purged according to enterprise compliance policy.
                        </p>
                      </div>

                      {/* Log Level */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="setting-log-level">
                          Minimum Log Level
                        </label>
                        <select
                          id="setting-log-level"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={formSettings.logLevel}
                          onChange={(e) =>
                            setFormSettings((prev) => ({
                              ...prev,
                              logLevel: e.target.value,
                            }))
                          }
                        >
                          <option value="ALL">ALL — Verbose (All operations, status toggles, and updates)</option>
                          <option value="INFO">INFO — Standard (Role modifications, matrix updates, approvals)</option>
                          <option value="WARNING">WARNING — State modifications and deactivations only</option>
                          <option value="CRITICAL">CRITICAL — Security policy and admin mutations only</option>
                        </select>
                        <p className="text-xs text-slate-500 mt-1">
                          Sets the threshold for which events are recorded to persistent storage.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Granular Event Tracking Policies */}
                  <div className="settings-section-card">
                    <div className="settings-section-header">
                      <div className="settings-section-title">Audit Event Tracking Policies</div>
                      <div className="settings-section-desc">
                        Select which RBAC lifecycle operations are recorded in the persistent audit trail.
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Role Created */}
                      <label
                        className={`switch-label ${formSettings.enabledEvents.roleCreated ? 'checked' : ''}`}
                        htmlFor="toggle-event-roleCreated"
                      >
                        <div>
                          <div className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                            <span>Role Created</span>
                            <span className="status-badge active text-[10px]">Required</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Record creation of new roles and role cloning actions.
                          </div>
                        </div>
                        <div className="switch-control">
                          <input
                            type="checkbox"
                            id="toggle-event-roleCreated"
                            checked={formSettings.enabledEvents.roleCreated}
                            onChange={() => handleToggleEvent('roleCreated')}
                          />
                          <span className="switch-slider" />
                        </div>
                      </label>

                      {/* Role Updated */}
                      <label
                        className={`switch-label ${formSettings.enabledEvents.roleUpdated ? 'checked' : ''}`}
                        htmlFor="toggle-event-roleUpdated"
                      >
                        <div>
                          <div className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                            <span>Role Updated</span>
                            <span className="status-badge active text-[10px]">Required</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Record updates to role details, descriptions, and limits.
                          </div>
                        </div>
                        <div className="switch-control">
                          <input
                            type="checkbox"
                            id="toggle-event-roleUpdated"
                            checked={formSettings.enabledEvents.roleUpdated}
                            onChange={() => handleToggleEvent('roleUpdated')}
                          />
                          <span className="switch-slider" />
                        </div>
                      </label>

                      {/* Permission Modified */}
                      <label
                        className={`switch-label ${formSettings.enabledEvents.permissionModified ? 'checked' : ''}`}
                        htmlFor="toggle-event-permissionModified"
                      >
                        <div>
                          <div className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                            <span>Permission Modified</span>
                            <span className="status-badge active text-[10px]">Required</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Record changes made across the granular permission matrix.
                          </div>
                        </div>
                        <div className="switch-control">
                          <input
                            type="checkbox"
                            id="toggle-event-permissionModified"
                            checked={formSettings.enabledEvents.permissionModified}
                            onChange={() => handleToggleEvent('permissionModified')}
                          />
                          <span className="switch-slider" />
                        </div>
                      </label>

                      {/* Branch Scope Changed */}
                      <label
                        className={`switch-label ${formSettings.enabledEvents.branchScopeChanged ? 'checked' : ''}`}
                        htmlFor="toggle-event-branchScopeChanged"
                      >
                        <div>
                          <div className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                            <span>Branch Scope Changed</span>
                            <span className="status-badge active text-[10px]">Required</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Record changes to role geographic or branch access scopes.
                          </div>
                        </div>
                        <div className="switch-control">
                          <input
                            type="checkbox"
                            id="toggle-event-branchScopeChanged"
                            checked={formSettings.enabledEvents.branchScopeChanged}
                            onChange={() => handleToggleEvent('branchScopeChanged')}
                          />
                          <span className="switch-slider" />
                        </div>
                      </label>

                      {/* Approval Level Changed */}
                      <label
                        className={`switch-label ${formSettings.enabledEvents.approvalLevelChanged ? 'checked' : ''}`}
                        htmlFor="toggle-event-approvalLevelChanged"
                      >
                        <div>
                          <div className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                            <span>Approval Level Changed</span>
                            <span className="status-badge active text-[10px]">Required</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Record tier configuration changes and financial thresholds.
                          </div>
                        </div>
                        <div className="switch-control">
                          <input
                            type="checkbox"
                            id="toggle-event-approvalLevelChanged"
                            checked={formSettings.enabledEvents.approvalLevelChanged}
                            onChange={() => handleToggleEvent('approvalLevelChanged')}
                          />
                          <span className="switch-slider" />
                        </div>
                      </label>

                      {/* Role Activated / Deactivated */}
                      <label
                        className={`switch-label ${formSettings.enabledEvents.roleStatusChanged ? 'checked' : ''}`}
                        htmlFor="toggle-event-roleStatusChanged"
                      >
                        <div>
                          <div className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                            <span>Role Activated / Deactivated</span>
                            <span className="status-badge active text-[10px]">Required</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Record role state transitions between ACTIVE and INACTIVE.
                          </div>
                        </div>
                        <div className="switch-control">
                          <input
                            type="checkbox"
                            id="toggle-event-roleStatusChanged"
                            checked={formSettings.enabledEvents.roleStatusChanged}
                            onChange={() => handleToggleEvent('roleStatusChanged')}
                          />
                          <span className="switch-slider" />
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Export & Compliance Schedule */}
                  <div className="settings-section-card">
                    <div className="settings-section-header">
                      <div className="settings-section-title">Compliance Reports & Export Configuration</div>
                      <div className="settings-section-desc">
                        Manage automated compliance report delivery and regulatory export parameters.
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {/* Export Format */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="setting-export-format">
                          Default Export Format
                        </label>
                        <select
                          id="setting-export-format"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={formSettings.exportFormat}
                          onChange={(e) =>
                            setFormSettings((prev) => ({
                              ...prev,
                              exportFormat: e.target.value,
                            }))
                          }
                        >
                          <option value="CSV">CSV (Comma-Separated Values — Excel / Sheets)</option>
                          <option value="JSON">JSON (Structured Machine-Readable)</option>
                        </select>
                      </div>

                      {/* Compliance Report Schedule */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1" htmlFor="setting-compliance-schedule">
                          Compliance Report Schedule
                        </label>
                        <select
                          id="setting-compliance-schedule"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={formSettings.complianceReportSchedule}
                          onChange={(e) =>
                            setFormSettings((prev) => ({
                              ...prev,
                              complianceReportSchedule: e.target.value,
                            }))
                          }
                        >
                          <option value="NONE">None (Manual Export Only)</option>
                          <option value="DAILY">Daily Digest</option>
                          <option value="WEEKLY">Weekly Summary (Recommended)</option>
                          <option value="MONTHLY">Monthly Comprehensive Regulatory Report</option>
                        </select>
                      </div>
                    </div>

                    {/* Secondary Toggles */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label
                        className={`switch-label ${formSettings.notifyOnCriticalEvents ? 'checked' : ''}`}
                        htmlFor="toggle-notify-critical"
                      >
                        <div>
                          <div className="font-semibold text-sm text-slate-800">Critical Event Alerts</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Trigger notifications when system administrative roles are modified.
                          </div>
                        </div>
                        <div className="switch-control">
                          <input
                            type="checkbox"
                            id="toggle-notify-critical"
                            checked={formSettings.notifyOnCriticalEvents}
                            onChange={(e) =>
                              setFormSettings((prev) => ({
                                ...prev,
                                notifyOnCriticalEvents: e.target.checked,
                              }))
                            }
                          />
                          <span className="switch-slider" />
                        </div>
                      </label>

                      <label
                        className={`switch-label ${formSettings.anonymizeActors ? 'checked' : ''}`}
                        htmlFor="toggle-anonymize-actors"
                      >
                        <div>
                          <div className="font-semibold text-sm text-slate-800">Anonymize Actor Identity</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Mask actor username and IP in public logs for privacy regulations.
                          </div>
                        </div>
                        <div className="switch-control">
                          <input
                            type="checkbox"
                            id="toggle-anonymize-actors"
                            checked={formSettings.anonymizeActors}
                            onChange={(e) =>
                              setFormSettings((prev) => ({
                                ...prev,
                                anonymizeActors: e.target.checked,
                              }))
                            }
                          />
                          <span className="switch-slider" />
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between p-4 bg-white border border-[#B4D4FF] rounded-xl shadow-xs">
                    <div className="text-xs text-slate-500">
                      {isSettingsDirty ? (
                        <span className="text-amber-700 font-semibold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                          You have unsaved changes. Remember to save to persist in database.
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-medium flex items-center gap-1.5">
                          <CheckCircleIcon /> All settings are synchronized with MongoDB.
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        className="btn btn-secondary btn-sm"
                        id="reset-audit-settings-btn"
                        onClick={handleResetSettings}
                        disabled={!isSettingsDirty || settingsSaving}
                      >
                        Reset Changes
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        id="save-audit-settings-btn"
                        onClick={handleSaveSettings}
                        disabled={!isSettingsDirty || settingsSaving}
                      >
                        {settingsSaving ? 'Saving...' : 'Save Audit Settings'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ════ TAB 2: AUDIT TRAIL LOG VIEWER ════ */}
          {auditTab === 'logs' && (
            <div>
              {/* Filter & Search Toolbar */}
              <div className="audit-toolbar">
                <div className="audit-toolbar__left">
                  {/* Search Input */}
                  <div className="relative flex-1 min-w-[220px]">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <SearchIcon />
                    </span>
                    <input
                      id="audit-search-input"
                      type="text"
                      className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Search by role, actor, or action..."
                      value={logSearchQuery}
                      onChange={(e) => setLogSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') fetchAuditLogs();
                      }}
                    />
                  </div>

                  {/* Action Filter */}
                  <select
                    id="audit-action-filter"
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={logFilterAction}
                    onChange={(e) => setLogFilterAction(e.target.value)}
                  >
                    <option value="ALL">All Event Types</option>
                    <option value="ROLE_CREATED">Role Created</option>
                    <option value="ROLE_UPDATED">Role Updated</option>
                    <option value="PERMISSION_MODIFIED">Permission Modified</option>
                    <option value="BRANCH_SCOPE_CHANGED">Branch Scope Changed</option>
                    <option value="APPROVAL_LEVEL_CHANGED">Approval Level Changed</option>
                    <option value="ROLE_ACTIVATED">Role Activated</option>
                    <option value="ROLE_DEACTIVATED">Role Deactivated</option>
                  </select>
                </div>

                <div className="audit-toolbar__right">
                  {/* Refresh Button */}
                  <button
                    className="btn btn-secondary btn-sm"
                    id="audit-refresh-btn"
                    onClick={fetchAuditLogs}
                    disabled={logsLoading}
                    title="Refresh logs from MongoDB"
                  >
                    <RefreshIcon spinning={logsLoading} />
                    <span>Refresh</span>
                  </button>

                  {/* Export Button */}
                  <button
                    className="btn btn-secondary btn-sm"
                    id="audit-export-btn"
                    onClick={handleExport}
                    disabled={exporting || logs.length === 0}
                    title={`Download as ${formSettings?.exportFormat || 'CSV'}`}
                  >
                    <DownloadIcon />
                    <span>{exporting ? 'Exporting...' : `Export ${formSettings?.exportFormat || 'CSV'}`}</span>
                  </button>
                </div>
              </div>

              {/* Logs Error */}
              {logsError && (
                <div className="mb-6 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircleIcon />
                    <span>{logsError}</span>
                  </div>
                  <button onClick={fetchAuditLogs} className="btn btn-ghost btn-sm text-rose-800 font-semibold underline">
                    Retry
                  </button>
                </div>
              )}

              {/* Table or Empty State */}
              {logsLoading ? (
                <div className="card p-12 text-center text-slate-500">
                  <div className="inline-block animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-3" />
                  <div>Querying persistent audit records...</div>
                </div>
              ) : logs.length === 0 ? (
                <div className="card p-12 text-center">
                  <div className="text-3xl mb-2">📋</div>
                  <div className="font-bold text-slate-800 mb-1">No Audit Records Found</div>
                  <div className="text-sm text-slate-500 max-w-md mx-auto mb-4">
                    {logSearchQuery || logFilterAction !== 'ALL'
                      ? 'No events match your current search or filter criteria. Try clearing the filter or search query.'
                      : 'Audit logs will automatically appear here as administrative events take place.'}
                  </div>
                  {(logSearchQuery || logFilterAction !== 'ALL') && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setLogSearchQuery('');
                        setLogFilterAction('ALL');
                      }}
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="audit-table-wrap">
                  <table className="audit-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Event / Action</th>
                        <th>Target Entity</th>
                        <th>Changes & Details</th>
                        <th>Actor</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => {
                        const badgeClass = ACTION_BADGE_MAP[log.action] || 'audit-badge--default';

                        // Summarize details
                        let detailsSummary = '—';
                        if (log.details) {
                          if (log.details.summary) {
                            detailsSummary = log.details.summary;
                          } else if (log.details.previousScope && log.details.newScope) {
                            detailsSummary = `${log.details.previousScope} → ${log.details.newScope}`;
                          } else if (log.details.previousLevel !== undefined && log.details.newLevel !== undefined) {
                            detailsSummary = `Level ${log.details.previousLevel} → Level ${log.details.newLevel}`;
                          } else if (log.details.previousStatus && log.details.newStatus) {
                            detailsSummary = `Status: ${log.details.previousStatus} → ${log.details.newStatus}`;
                          } else if (log.details.branchScope) {
                            detailsSummary = `Scope: ${log.details.branchScope}`;
                          } else if (log.details.threshold) {
                            detailsSummary = `Threshold: ${log.details.threshold}`;
                          } else {
                            const keys = Object.keys(log.details);
                            if (keys.length > 0) detailsSummary = `${keys.length} field(s) configured`;
                          }
                        }

                        // Actor display
                        const actorDisplay = log.actor?.name || 'System / Unavailable';
                        const isSys = log.actor?.isSystem || actorDisplay.includes('System');

                        return (
                          <tr
                            key={log._id || log.id}
                            className="cursor-pointer transition-colors"
                            onClick={() => setSelectedLogDetail(log)}
                            id={`audit-row-${log._id || log.id}`}
                          >
                            <td className="font-mono text-xs whitespace-nowrap text-slate-600">
                              {formatTimestamp(log.createdAt)}
                            </td>
                            <td>
                              <span className={`audit-badge ${badgeClass}`}>
                                {log.actionDisplay || log.action}
                              </span>
                            </td>
                            <td>
                              <div className="font-semibold text-slate-800">{log.entityName}</div>
                              <div className="text-[11px] text-slate-500 uppercase">{log.entityType || 'Role'}</div>
                            </td>
                            <td className="text-xs text-slate-600 max-w-xs truncate" title={detailsSummary}>
                              {detailsSummary}
                            </td>
                            <td>
                              <div className="text-xs font-medium text-slate-800">
                                {actorDisplay}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {isSys ? 'System-generated' : (log.actor?.role || 'User')}
                              </div>
                            </td>
                            <td>
                              <span className={`status-badge ${log.status === 'SUCCESS' ? 'active' : 'warning'}`}>
                                {log.status || 'SUCCESS'}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn btn-ghost btn-sm text-indigo-600 hover:text-indigo-800 py-1 px-2 text-xs"
                                id={`view-audit-detail-${log._id || log.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedLogDetail(log);
                                }}
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Log Detail Modal ── */}
      {selectedLogDetail && (
        <div
          className="audit-detail-overlay"
          onClick={() => setSelectedLogDetail(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="audit-detail-title"
        >
          <div
            className="audit-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-800" id="audit-detail-title">
                  Audit Record Details
                </h3>
                <div className="text-xs text-slate-500 mt-0.5">
                  ID: {selectedLogDetail._id || selectedLogDetail.id || 'N/A'}
                </div>
              </div>
              <button
                className="btn btn-ghost btn-sm p-1 text-slate-400 hover:text-slate-600"
                onClick={() => setSelectedLogDetail(null)}
                aria-label="Close dialog"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-slate-400 font-semibold uppercase tracking-wider mb-1">Event Action</div>
                  <span className={`audit-badge ${ACTION_BADGE_MAP[selectedLogDetail.action] || 'audit-badge--default'}`}>
                    {selectedLogDetail.actionDisplay || selectedLogDetail.action}
                  </span>
                </div>
                <div>
                  <div className="text-slate-400 font-semibold uppercase tracking-wider mb-1">Timestamp</div>
                  <div className="font-mono text-slate-800">{formatTimestamp(selectedLogDetail.createdAt)}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-semibold uppercase tracking-wider mb-1">Target Entity</div>
                  <div className="font-semibold text-slate-800">{selectedLogDetail.entityName}</div>
                  <div className="text-slate-500">{selectedLogDetail.entityType}</div>
                </div>
                <div>
                  <div className="text-slate-400 font-semibold uppercase tracking-wider mb-1">Actor Information</div>
                  <div className="font-semibold text-slate-800">{selectedLogDetail.actor?.name || 'System / Unavailable'}</div>
                  <div className="text-slate-500">{selectedLogDetail.actor?.role || 'System'}</div>
                </div>
              </div>

              <div>
                <div className="text-slate-400 font-semibold text-xs uppercase tracking-wider mb-1">
                  Recorded Payload & Differential Changes
                </div>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs overflow-x-auto font-mono max-h-60 leading-relaxed">
                  {JSON.stringify(selectedLogDetail.details || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end rounded-b-xl">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedLogDetail(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal for Other Unconfigured Sections ── */}
      {otherSectionModal && (
        <div
          className="audit-detail-overlay"
          onClick={() => setOtherSectionModal(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="audit-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{otherSectionModal.icon}</span>
                <h3 className="font-bold text-base text-slate-800">
                  {otherSectionModal.title}
                </h3>
              </div>
              <button
                className="btn btn-ghost btn-sm p-1 text-slate-400 hover:text-slate-600"
                onClick={() => setOtherSectionModal(null)}
                aria-label="Close dialog"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="p-6 text-sm text-slate-600 space-y-3">
              <p>{otherSectionModal.description}</p>
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs">
                To configure system policies, audit trail retention, and view live RBAC logs, visit the{' '}
                <button
                  className="font-bold underline text-blue-800 hover:text-blue-950"
                  onClick={() => {
                    setOtherSectionModal(null);
                    setSearchParams({ section: 'audit' });
                  }}
                >
                  Audit & Logging console
                </button>.
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 rounded-b-xl">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setOtherSectionModal(null)}
              >
                Close
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setOtherSectionModal(null);
                  setSearchParams({ section: 'audit' });
                }}
              >
                Open Audit & Logging
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
