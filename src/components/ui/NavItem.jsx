import { NavLink, useLocation } from 'react-router-dom';

/**
 * NavItem — Sidebar navigation link.
 * Uses NavLink for active-state detection.
 *
 * @param {string}       to      - Route path
 * @param {ReactNode}    icon    - SVG icon element
 * @param {string}       label   - Display label
 * @param {string|number} badge  - Optional badge count
 */
function NavItem({ to, icon, label, badge }) {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(to + '/');

  return (
    <NavLink
      to={to}
      className={`nav-item ${isActive ? 'active' : ''}`}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* Icon container */}
      <span className="nav-item__icon" aria-hidden="true">
        {icon}
      </span>

      {/* Label */}
      <span className="nav-item__label">{label}</span>

      {/* Optional badge */}
      {badge !== undefined && badge !== null && (
        <span className="nav-item__badge" aria-label={`${badge} items`}>
          {badge}
        </span>
      )}

      {/* Tooltip shown when sidebar is collapsed */}
      <span className="nav-item__tooltip" aria-hidden="true">
        {label}
      </span>
    </NavLink>
  );
}

export default NavItem;
