import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotes } from '../hooks/useNotes';
import Button from '../components/Button';
import Loader from '../components/Loader';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { notes, fetchNotes, isLoading } = useNotes();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Ignore errors on logout
    } finally {
      navigate('/login');
    }
  };

  const formattedJoinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Member';

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h1 className="profile-title">User Profile</h1>

        <div className="profile-details">
          <div className="profile-field">
            <span className="profile-label">Name</span>
            <span className="profile-value">{user?.name || '—'}</span>
          </div>

          <div className="profile-field">
            <span className="profile-label">Email</span>
            <span className="profile-value">{user?.email || '—'}</span>
          </div>

          <div className="profile-field">
            <span className="profile-label">Member Since</span>
            <span className="profile-value">{formattedJoinDate}</span>
          </div>

          <div className="profile-field">
            <span className="profile-label">Active Notes</span>
            <span className="profile-value">
              {isLoading ? 'Counting...' : `${notes.length} notes`}
            </span>
          </div>
        </div>

        <div className="profile-actions">
          <Button variant="danger" onClick={handleLogout}>
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
