import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/projects/dashboard');
        setStats(data);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>👋 Welcome, {user?.name}</h1>
          <p style={{ color: '#888', fontSize: 14, marginTop: 4 }}>
            Here's your {user?.role === 'admin' ? 'project overview' : 'task summary'}
          </p>
        </div>
        {user?.role === 'admin' && (
          <Link to="/projects/new" className="btn btn-primary">+ New Project</Link>
        )}
      </div>

      {user?.role === 'admin' ? (
        <>
          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-number">{stats?.totalProjects ?? 0}</div>
              <div className="stat-label">Total Projects</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats?.totalIssues ?? 0}</div>
              <div className="stat-label">Total Issues</div>
            </div>
            <div className="stat-card orange">
              <div className="stat-number">{stats?.pendingIssues ?? 0}</div>
              <div className="stat-label">Pending Issues</div>
            </div>
            <div className="stat-card green">
              <div className="stat-number">{stats?.completedIssues ?? 0}</div>
              <div className="stat-label">Completed Issues</div>
            </div>
            <div className="stat-card red">
              <div className="stat-number">{stats?.overdueIssues ?? 0}</div>
              <div className="stat-label">Overdue Tasks</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="card">
              <h3 style={{ marginBottom: 12 }}>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Link to="/projects/new" className="btn btn-primary">➕ Create New Project</Link>
                <Link to="/issues/new" className="btn btn-secondary">🐛 Create New Issue</Link>
                <Link to="/projects" className="btn btn-secondary">📁 View All Projects</Link>
                <Link to="/issues" className="btn btn-secondary">📋 View All Issues</Link>
              </div>
            </div>
            <div className="card">
              <h3 style={{ marginBottom: 12 }}>At a Glance</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <StatRow label="Completion Rate" value={
                  stats?.totalIssues > 0
                    ? `${Math.round((stats.completedIssues / stats.totalIssues) * 100)}%`
                    : 'N/A'
                } />
                <StatRow label="Open + In-Progress" value={stats?.pendingIssues ?? 0} />
                <StatRow label="Overdue Tasks" value={stats?.overdueIssues ?? 0} highlight={stats?.overdueIssues > 0} />
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-number">{stats?.assignedIssues ?? 0}</div>
              <div className="stat-label">Assigned Issues</div>
            </div>
            <div className="stat-card orange">
              <div className="stat-number">{stats?.inProgressIssues ?? 0}</div>
              <div className="stat-label">In Progress</div>
            </div>
            <div className="stat-card green">
              <div className="stat-number">{stats?.completedIssues ?? 0}</div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="stat-card purple">
              <div className="stat-number">{stats?.upcomingDeadlines ?? 0}</div>
              <div className="stat-label">Due This Week</div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 12 }}>Quick Actions</h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/issues" className="btn btn-primary">📋 View My Tasks</Link>
              <Link to="/projects" className="btn btn-secondary">📁 View Projects</Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatRow({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f2f5', fontSize: 14 }}>
      <span style={{ color: '#666' }}>{label}</span>
      <span style={{ fontWeight: 700, color: highlight ? '#ff4d4f' : '#1a1a2e' }}>{value}</span>
    </div>
  );
}
