import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRolesApi } from '../../services/api';

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const getInitials = (name) => {
  if (!name || typeof name !== 'string' || !name.trim()) return 'NA';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.map((w) => w[0]).join('').slice(0, 2).toUpperCase();
};

export default function GlobalSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const navigate = useNavigate();

  const handleSelectRole = useCallback(
    (role) => {
      onClose();

      navigate(`/roles?q=${encodeURIComponent(role.name)}`);
    },
    [navigate, onClose]
  );

  const handleOpenMatrix = useCallback(
    (e, role) => {
      e.stopPropagation();
      onClose();
      const roleId = role.id || role._id;
      navigate(`/permission-matrix?roleId=${encodeURIComponent(roleId)}`);
    },
    [navigate, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const trimmed = query.trim();
    if (!trimmed) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      let isCurrent = true;
      setLoading(true);
      setError(null);
      getRolesApi({ q: trimmed })
        .then((roles) => {
          if (isCurrent) {
            setResults(Array.isArray(roles) ? roles : []);
            setSelectedIndex(0);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (isCurrent) {
            console.error('Global search error:', err);
            setError(err.message || 'Failed to search roles.');
            setLoading(false);
          }
        });

      return () => {
        isCurrent = false;
      };
    }, 220);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, isOpen]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (results.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % results.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const target = results[selectedIndex];
          if (target) {
            handleSelectRole(target);
          }
        }
      }
    },
    [results, selectedIndex, onClose, handleSelectRole]
  );

  if (!isOpen) return null;

  return (
    <div
      className="search-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Global Search"
    >
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>

        <div className="search-modal__input-wrap">
          <SearchIcon />
          <input
            ref={inputRef}
            type="text"
            className="search-modal__input"
            placeholder="Search roles by name, description, or branch scope..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            id="global-search-input"
            aria-label="Global search input"
          />
          {query ? (
            <button
              className="btn btn-ghost btn-sm p-1 text-slate-400 hover:text-slate-600"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              aria-label="Clear search query"
            >
              <CloseIcon />
            </button>
          ) : (
            <kbd className="search-modal__kbd">ESC to close</kbd>
          )}
        </div>

        <div className="search-modal__results" role="listbox">
          {loading && (
            <div className="search-modal__empty-state">
              <div className="flex items-center justify-center gap-2 font-semibold text-[#176B87]">
                <svg
                  className="animate-spin h-5 w-5 text-[#176B87]"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Searching role catalog in database...</span>
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="search-modal__empty-state text-rose-600">
              <p className="font-semibold">{error}</p>
              <button
                className="btn btn-secondary btn-sm mt-3"
                onClick={() => setQuery(query)}
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && query.trim() === '' && (
            <div className="search-modal__empty-state">
              <p className="font-medium text-slate-700 mb-1">Search the Access Control Catalog</p>
              <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
                Type a role name (e.g. &ldquo;Administrator&rdquo;, &ldquo;Manager&rdquo;, &ldquo;Cashier&rdquo;), description, or branch scope to quickly locate records.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm text-xs"
                  onClick={() => setQuery('Admin')}
                >
                  &ldquo;Admin&rdquo;
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm text-xs"
                  onClick={() => setQuery('Manager')}
                >
                  &ldquo;Manager&rdquo;
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm text-xs"
                  onClick={() => setQuery('Branch')}
                >
                  &ldquo;Branch&rdquo;
                </button>
              </div>
            </div>
          )}

          {!loading && !error && query.trim() !== '' && results.length === 0 && (
            <div className="search-modal__empty-state">
              <p className="font-semibold text-slate-700">No roles found matching &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-slate-500 mt-1">
                Try searching with a broader keyword or check spelling.
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            results.length > 0 &&
            results.map((role, idx) => {
              const isSelected = idx === selectedIndex;
              const roleId = role.id || role._id;
              const initials = getInitials(role.name);
              return (
                <div
                  key={roleId}
                  className={`search-modal__result-item ${isSelected ? 'selected' : ''}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelectRole(role)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: role.iconColor || '#176B87' }}
                      aria-hidden="true"
                    >
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[#0a1f2e]">{role.name}</span>
                        {role.isSystem && (
                          <span className="role-name-cell__system-tag">System</span>
                        )}
                        <span className={`status-badge ${(role.status || '').toLowerCase()}`}>
                          {(role.status || '').toLowerCase() === 'active' ? 'Active' : 'Inactive'}
                        </span>
                        <span
                          className={`scope-badge ${
                            role.branchScope === 'All Branches'
                              ? 'all-branches'
                              : role.branchScope === 'Assigned Branch'
                              ? 'assigned-branch'
                              : 'selected-branches'
                          }`}
                        >
                          {role.branchScope}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5" title={role.description}>
                        {role.description || 'No description provided'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm text-xs py-1 px-2"
                      title="Open in Permission Matrix"
                      onClick={(e) => handleOpenMatrix(e, role)}
                    >
                      Matrix 🛡️
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm text-xs py-1 px-2.5"
                      title="View in Roles"
                      onClick={() => handleSelectRole(role)}
                    >
                      View Role →
                    </button>
                  </div>
                </div>
              );
            })}
        </div>

        <div className="search-modal__footer">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="search-modal__kbd mr-1">↑</kbd>
              <kbd className="search-modal__kbd mr-1">↓</kbd> to navigate
            </span>
            <span>
              <kbd className="search-modal__kbd mr-1">Enter</kbd> to select
            </span>
          </div>
          <div>
            {results.length > 0 && (
              <span>
                Found <strong>{results.length}</strong> role{results.length === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
