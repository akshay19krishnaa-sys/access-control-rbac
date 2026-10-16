import { NavLink, useLocation } from 'react-router-dom';

function NavItem({ to, icon, label, badge }) {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(to + '/');

  return (
    <NavLink
      to={to}
      className={`nav-item ${isActive ? 'active' : ''}`}
      aria-current={isActive ? 'page' : undefined}
    >

      <span className="nav-item__icon" aria-hidden="true">
        {icon}
      </span>

      <span className="nav-item__label">{label}</span>

      {badge !== undefined && badge !== null && (
        <span className="nav-item__badge" aria-label={`${badge} items`}>
          {badge}
        </span>
      )}

      <span className="nav-item__tooltip" aria-hidden="true">
        {label}
      </span>
    </NavLink>
  );
}

export default NavItem;
