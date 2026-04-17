import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar-brand">⚡ CollabTrack</Link>
      <div className="navbar-links">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/projects">Projects</Link>
        <Link to="/issues">{user?.role === 'admin' ? 'All Issues' : 'My Tasks'}</Link>
        {user?.role === 'admin' && <Link to="/projects/new">+ Project</Link>}
        <span style={{ color: '#888', fontSize: 13, padding: '0 4px' }}>
          {user?.name} <span className={`role-${user?.role}`}>({user?.role})</span>
        </span>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}
