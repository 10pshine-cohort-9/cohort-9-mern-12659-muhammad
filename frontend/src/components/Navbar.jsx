import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './Button';
import './Navbar.css';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Ignore errors on logout
    } finally {
      navigate('/login');
    }
  };

  return (
    <header className="navbar">
      <div className="navbar__container">
        <Link to="/dashboard" className="navbar__brand">
          Inkwell
        </Link>

        {isAuthenticated && (
          <nav className="navbar__nav" aria-label="Main Navigation">
            <NavLink
              to="/dashboard"
              end
              className={({ isActive }) =>
                `navbar__link ${isActive ? 'navbar__link--active' : ''}`
              }
            >
              Notes
            </NavLink>
            <NavLink
              to="/trash"
              className={({ isActive }) =>
                `navbar__link ${isActive ? 'navbar__link--active' : ''}`
              }
            >
              Trash
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `navbar__link ${isActive ? 'navbar__link--active' : ''}`
              }
            >
              Profile
            </NavLink>
          </nav>
        )}

        <div className="navbar__user-actions">
          {isAuthenticated ? (
            <>
              <span className="navbar__username">{user?.name || user?.email}</span>
              <Button variant="ghost" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <div className="navbar__auth-links">
              <NavLink to="/login" className="navbar__link">
                Login
              </NavLink>
              <NavLink to="/signup" className="navbar__link">
                Signup
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
