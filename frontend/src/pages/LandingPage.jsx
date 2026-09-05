import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LandingPage.css';

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div className="landing-page">
      <div className="landing-content">
        <h1 className="landing-brand">Inkwell</h1>
        <p className="landing-tagline">Your personal space for notes.</p>
        <div className="landing-actions">
          <Link to="/login" className="btn btn--secondary">Sign In</Link>
          <Link to="/signup" className="btn btn--primary">Create Account</Link>
        </div>
      </div>
    </div>
  );
}
